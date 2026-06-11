// ============================================================
//  server.js — Express Application Entrypoint
// ============================================================

import "dotenv/config";
import express from "express";
import cors from "cors";
import routes from "./routes.js";

const app = express();
const PORT = process.env.PORT || 5000;

// ── Middleware ───────────────────────────────────────────────
app.use(cors({
  origin: ["http://localhost:5173", "http://127.0.0.1:5173"],
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
}));

app.use(express.json());

// ── Routes ───────────────────────────────────────────────────
app.use("/api", routes);

// ── 404 Fallback ─────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ success: false, error: "Endpoint not found" });
});

// ── Global Error Handler ─────────────────────────────────────
app.use((err, _req, res, _next) => {
  console.error("[server] Unhandled error:", err);
  res.status(500).json({ success: false, error: err.message || "Internal server error" });
});

// ── Start ────────────────────────────────────────────────────
app.listen(PORT, () => {
  const mode = process.env.NODE_ENV || "development";
  console.log("");
  console.log("  ╔══════════════════════════════════════════════╗");
  console.log("  ║   M365 Tenant Advisor — Backend API Server   ║");
  console.log("  ╠══════════════════════════════════════════════╣");
  console.log(`  ║  Mode    : ${mode.padEnd(34)}║`);
  console.log(`  ║  Port    : ${String(PORT).padEnd(34)}║`);
  console.log(`  ║  API     : http://localhost:${PORT}/api         ║`);
  console.log(`  ║  Health  : http://localhost:${PORT}/api/health  ║`);
  console.log("  ╚══════════════════════════════════════════════╝");
  console.log("");
});
