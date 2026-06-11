// ============================================================
//  routes.js — REST API + SSE Endpoints
// ============================================================

import { Router } from "express";
import { v4 as uuidv4 } from "uuid";
import { getAllTenants, getTenantById, getScan } from "./db.js";
import { runScan } from "./scanEngine.js";

const router = Router();

// Active SSE listeners: { [scanId]: Set<res> }
const sseClients = {};

// ── GET /api/tenants ─────────────────────────────────────────
// Returns list of onboarded tenants (summary only)
router.get("/tenants", (_req, res) => {
  res.json({ success: true, data: getAllTenants() });
});

// ── GET /api/tenants/:id ──────────────────────────────────────
// Returns full tenant data for dashboard rendering
router.get("/tenants/:id", (req, res) => {
  const tenant = getTenantById(req.params.id);
  if (!tenant) return res.status(404).json({ success: false, error: "Tenant not found" });
  res.json({ success: true, data: tenant });
});

// ── POST /api/scans/start ─────────────────────────────────────
// Initiates a new background scan job for a tenant
router.post("/scans/start", (req, res) => {
  const { tenantId } = req.body;
  if (!tenantId) return res.status(400).json({ success: false, error: "tenantId is required" });
  if (!getTenantById(tenantId)) return res.status(404).json({ success: false, error: "Tenant not found" });

  const scanId = uuidv4();
  sseClients[scanId] = new Set();

  // Fire off background scan — don't await
  runScan(
    scanId,
    tenantId,
    (log) => {
      // Push each log event to all SSE listeners for this scan
      const payload = `data: ${JSON.stringify(log)}\n\n`;
      if (sseClients[scanId]) {
        for (const client of sseClients[scanId]) {
          try { client.write(payload); } catch (_) { /* client disconnected */ }
        }
      }
    },
    () => {
      // Scan complete — send done event and close all SSE connections
      const donePayload = `event: done\ndata: ${JSON.stringify({ scanId, status: "completed" })}\n\n`;
      if (sseClients[scanId]) {
        for (const client of sseClients[scanId]) {
          try { client.write(donePayload); client.end(); } catch (_) { /* already closed */ }
        }
        delete sseClients[scanId];
      }
    }
  );

  res.json({ success: true, scanId });
});

// ── GET /api/scans/:id/progress ───────────────────────────────
// Server-Sent Events stream for real-time scan log updates
router.get("/scans/:id/progress", (req, res) => {
  const { id: scanId } = req.params;

  // SSE headers
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no"); // Disable Nginx buffering
  res.flushHeaders();

  // Register client
  if (!sseClients[scanId]) {
    // Scan already completed or doesn't exist — check db
    const scan = getScan(scanId);
    if (scan && scan.status === "completed") {
      // Replay all logs then send done
      for (const log of scan.logs) {
        res.write(`data: ${JSON.stringify(log)}\n\n`);
      }
      res.write(`event: done\ndata: ${JSON.stringify({ scanId, status: "completed" })}\n\n`);
      res.end();
      return;
    }
    res.write(`event: error\ndata: ${JSON.stringify({ error: "Scan not found or expired" })}\n\n`);
    res.end();
    return;
  }

  sseClients[scanId].add(res);

  // Heartbeat every 15s to keep connection alive through proxies
  const heartbeat = setInterval(() => {
    try { res.write(":heartbeat\n\n"); } catch (_) { clearInterval(heartbeat); }
  }, 15000);

  // Clean up on client disconnect
  req.on("close", () => {
    clearInterval(heartbeat);
    if (sseClients[scanId]) sseClients[scanId].delete(res);
  });
});

// ── GET /api/scans/:id/results ────────────────────────────────
// Returns full completed scan record (logs + metadata)
router.get("/scans/:id/results", (req, res) => {
  const scan = getScan(req.params.id);
  if (!scan) return res.status(404).json({ success: false, error: "Scan not found" });
  const tenant = getTenantById(scan.tenantId);
  res.json({ success: true, data: { scan, tenant } });
});

// ── GET /api/health ───────────────────────────────────────────
router.get("/health", (_req, res) => {
  res.json({ status: "ok", mode: process.env.NODE_ENV || "development", timestamp: new Date().toISOString() });
});

export default router;
