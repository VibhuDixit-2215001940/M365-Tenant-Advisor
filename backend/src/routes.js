// ============================================================
//  routes.js — REST API + SSE Endpoints
// ============================================================

import { Router } from "express";
import { v4 as uuidv4 } from "uuid";
import {
  getAllTenants,
  getTenantById,
  getScan,
  addTenant,
  removeTenant,
  storeTenantCredentials,
  hasCredentials,
} from "./db.js";
import { runScan } from "./scanEngine.js";
import { validateCredentials } from "./graphClient.js";

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

// ── POST /api/tenants/onboard ─────────────────────────────────
// Onboard a new tenant with Azure credentials
router.post("/tenants/onboard", async (req, res) => {
  const { tenantId, clientId, clientSecret } = req.body;

  // Validate required fields
  if (!tenantId || !clientId || !clientSecret) {
    return res.status(400).json({
      success: false,
      error: "tenantId, clientId, and clientSecret are all required.",
    });
  }

  // Validate GUID format
  const guidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!guidRegex.test(tenantId)) {
    return res.status(400).json({
      success: false,
      error: "tenantId must be a valid Azure AD Directory (Tenant) ID in GUID format.",
    });
  }
  if (!guidRegex.test(clientId)) {
    return res.status(400).json({
      success: false,
      error: "clientId must be a valid Application (Client) ID in GUID format.",
    });
  }

  try {
    // Validate credentials against Microsoft
    const validation = await validateCredentials(tenantId, clientId, clientSecret);

    if (!validation.valid) {
      return res.status(401).json({
        success: false,
        error: `Microsoft rejected the credentials: ${validation.error}`,
      });
    }

    // Use tenantId as the internal ID (to avoid duplicate onboarding)
    const internalId = tenantId.toLowerCase();

    // Check if already exists
    const existing = getTenantById(internalId);
    if (existing && existing.isReal) {
      // Update credentials silently (user may be rotating secrets)
      storeTenantCredentials(internalId, {
        azureTenantId: tenantId,
        clientId,
        clientSecret,
      });
      return res.json({
        success: true,
        data: { id: internalId, displayName: existing.displayName, domain: existing.domain, isNew: false },
        message: "Tenant already onboarded — credentials updated.",
      });
    }

    // Add tenant to DB
    const tenant = addTenant({
      id: internalId,
      displayName: validation.displayName,
      domain: validation.domain,
    });

    // Store credentials
    storeTenantCredentials(internalId, {
      azureTenantId: tenantId,
      clientId,
      clientSecret,
    });

    res.json({
      success: true,
      data: { id: tenant.id, displayName: tenant.displayName, domain: tenant.domain, isNew: true },
      message: `Tenant "${validation.displayName}" onboarded successfully. Run a scan to pull live data.`,
    });
  } catch (err) {
    console.error("[onboard] Error:", err);
    res.status(500).json({
      success: false,
      error: `Onboarding failed: ${err.message}`,
    });
  }
});

// ── DELETE /api/tenants/:id ───────────────────────────────────
// Remove a tenant
router.delete("/tenants/:id", (req, res) => {
  const success = removeTenant(req.params.id);
  if (!success) return res.status(404).json({ success: false, error: "Tenant not found" });
  res.json({ success: true, message: "Tenant removed." });
});

// ── POST /api/scans/start ─────────────────────────────────────
// Initiates a new background scan job for a tenant
router.post("/scans/start", (req, res) => {
  const { tenantId } = req.body;
  if (!tenantId) return res.status(400).json({ success: false, error: "tenantId is required" });
  if (!getTenantById(tenantId)) return res.status(404).json({ success: false, error: "Tenant not found" });

  const scanId = uuidv4();
  const isRealScan = hasCredentials(tenantId);
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

  res.json({ success: true, scanId, mode: isRealScan ? "live" : "simulation" });
});

// ── GET /api/scans/:id/progress ───────────────────────────────
// Server-Sent Events stream for real-time scan log updates
router.get("/scans/:id/progress", (req, res) => {
  const { id: scanId } = req.params;

  // SSE headers
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");
  res.flushHeaders();

  // Register client
  if (!sseClients[scanId]) {
    const scan = getScan(scanId);
    if (scan && scan.status === "completed") {
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

  const heartbeat = setInterval(() => {
    try { res.write(":heartbeat\n\n"); } catch (_) { clearInterval(heartbeat); }
  }, 15000);

  req.on("close", () => {
    clearInterval(heartbeat);
    if (sseClients[scanId]) sseClients[scanId].delete(res);
  });
});

// ── GET /api/scans/:id/results ────────────────────────────────
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
