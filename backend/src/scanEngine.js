// ============================================================
//  scanEngine.js — Background Scan Orchestrator
//  Simulates an async Microsoft Graph API scan pipeline with
//  real-time progress logs streamed via Server-Sent Events.
// ============================================================

import { createScan, appendLog, completeScan, getTenantById } from "./db.js";

// Pipeline steps for a tenant scan
const SCAN_PIPELINE = [
  { delay: 400,  module: "connector",  text: "Initializing Microsoft Graph API connector..." },
  { delay: 600,  module: "connector",  text: "Authenticating with Azure Entra ID (OAuth 2.0)..." },
  { delay: 500,  module: "connector",  text: "Establishing delegated permission scope..." },
  { delay: 700,  module: "users",      text: "Fetching user directory — enumerating all accounts..." },
  { delay: 600,  module: "users",      text: "Identifying inactive accounts (90d+ login gap)..." },
  { delay: 500,  module: "users",      text: "Identifying disabled accounts with active license assignments..." },
  { delay: 800,  module: "licensing",  text: "Auditing Microsoft 365 SKU subscriptions..." },
  { delay: 700,  module: "licensing",  text: "Calculating unassigned license overhead..." },
  { delay: 600,  module: "licensing",  text: "Analyzing per-user feature utilization data..." },
  { delay: 800,  module: "licensing",  text: "Generating downgrade recommendations..." },
  { delay: 700,  module: "security",   text: "Running security posture audit via Secure Score API..." },
  { delay: 600,  module: "security",   text: "Checking MFA status for all admin roles..." },
  { delay: 600,  module: "security",   text: "Checking legacy authentication protocol state..." },
  { delay: 500,  module: "security",   text: "Auditing Conditional Access policies..." },
  { delay: 700,  module: "security",   text: "Auditing OAuth application consent permissions..." },
  { delay: 600,  module: "security",   text: "Auditing Unified Audit Log configuration..." },
  { delay: 500,  module: "cost",       text: "Calculating cost leakage breakdown..." },
  { delay: 600,  module: "cost",       text: "Cross-referencing billing data with usage telemetry..." },
  { delay: 800,  module: "ai",         text: "Generating AI advisory report via Azure OpenAI..." },
  { delay: 700,  module: "ai",         text: "Synthesizing executive summary..." },
  { delay: 400,  module: "complete",   text: "Scan complete. All findings recorded." },
];

/**
 * Runs a scan pipeline for the given tenant.
 * @param {string} scanId - UUID for this scan job
 * @param {string} tenantId - Tenant identifier
 * @param {Function} onLog - Callback called with each log event { text, module, type, timestamp }
 * @param {Function} onComplete - Callback fired when all steps are done
 */
export async function runScan(scanId, tenantId, onLog, onComplete) {
  const tenant = getTenantById(tenantId);
  if (!tenant) {
    onLog({ text: `ERROR: Tenant '${tenantId}' not found.`, module: "error", type: "error", timestamp: new Date().toISOString() });
    onComplete();
    return;
  }

  createScan(scanId, tenantId);

  onLog({
    text: `Starting full M365 health scan for tenant: ${tenant.displayName} (${tenant.domain})`,
    module: "init",
    type: "info",
    timestamp: new Date().toISOString(),
  });

  for (const step of SCAN_PIPELINE) {
    await sleep(step.delay);
    const log = {
      text: step.text,
      module: step.module,
      type: step.module === "complete" ? "success" : step.module === "error" ? "error" : "info",
      timestamp: new Date().toISOString(),
    };
    appendLog(scanId, log);
    onLog(log);
  }

  completeScan(scanId);
  onComplete();
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
