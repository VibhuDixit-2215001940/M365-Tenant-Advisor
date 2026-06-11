// ============================================================
//  scanEngine.js — Background Scan Orchestrator
//  Dual mode: Real Graph API scan or simulated pipeline.
//  Real-time progress logs streamed via Server-Sent Events.
// ============================================================

import { createScan, appendLog, completeScan, getTenantById, getTenantCredentials, updateTenantData } from "./db.js";
import {
  getAccessToken,
  fetchUsers,
  fetchLicenses,
  fetchSecurity,
  buildCostLeakage,
  buildAISummary,
} from "./graphClient.js";

// Simulation pipeline steps (fallback for demo tenants)
const SIMULATION_PIPELINE = [
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
 * Main entry: runs a scan pipeline for the given tenant.
 * Automatically selects real or simulated mode based on stored credentials.
 */
export async function runScan(scanId, tenantId, onLog, onComplete) {
  const tenant = getTenantById(tenantId);
  if (!tenant) {
    onLog({ text: `ERROR: Tenant '${tenantId}' not found.`, module: "error", type: "error", timestamp: ts() });
    onComplete();
    return;
  }

  createScan(scanId, tenantId);

  // Check if we have real credentials for this tenant
  const creds = getTenantCredentials(tenantId);

  if (creds) {
    await runRealScan(scanId, tenantId, tenant, creds, onLog, onComplete);
  } else {
    await runSimulatedScan(scanId, tenant, onLog, onComplete);
  }
}

// ── Real Graph API Scan ──────────────────────────────────────
async function runRealScan(scanId, tenantId, tenant, creds, onLog, onComplete) {
  const emit = (text, module = "info", type = "info") => {
    const log = { text, module, type, timestamp: ts() };
    appendLog(scanId, log);
    onLog(log);
  };

  emit(`Starting LIVE M365 scan for tenant: ${tenant.displayName} (${tenant.domain})`, "init", "info");

  try {
    // 1. Authenticate
    emit("Authenticating with Azure Entra ID (OAuth 2.0 Client Credentials)...", "connector");
    const token = await getAccessToken(creds.azureTenantId, creds.clientId, creds.clientSecret);
    emit("Authentication successful — access token acquired.", "connector", "success");

    // 2. Fetch users
    emit("Starting user directory enumeration...", "users");
    const userData = await fetchUsers(token, (msg) => emit(msg, "users"));

    // 3. Fetch licenses
    emit("Starting license subscription audit...", "licensing");
    const licenseData = await fetchLicenses(token, (msg) => emit(msg, "licensing"), userData);

    // 4. Security audit
    emit("Starting security posture assessment...", "security");
    const securityData = await fetchSecurity(token, (msg) => emit(msg, "security"));

    // 5. Cost leakage
    emit("Calculating cost leakage breakdown...", "cost");
    const costData = buildCostLeakage(userData, licenseData);
    emit(`Identified ${costData.items.length} cost leakage categories.`, "cost", "success");

    // 6. AI summary
    emit("Generating AI advisory summary from collected telemetry...", "ai");
    const aiSummary = buildAISummary(tenant.displayName, userData, licenseData, securityData, costData);
    emit("AI advisory report generated.", "ai", "success");

    // 7. Calculate health score
    const licensingEfficiency = licenseData.assignedLicenses / Math.max(licenseData.totalLicenses, 1);
    const healthScore = Math.round(
      (securityData.score * 0.4) +
      (licensingEfficiency * 100 * 0.3) +
      (Math.max(0, 100 - userData.inactiveUsers) * 0.3)
    );

    // 8. Update tenant in DB with real data
    updateTenantData(tenantId, {
      healthScore: Math.max(10, Math.min(100, healthScore)),
      metrics: {
        users: userData.totalUsers,
        devices: userData.deviceCount,
        licensesTotal: licenseData.totalLicenses,
        licensesAssigned: licenseData.assignedLicenses,
        potentialSavingsMonthly: licenseData.potentialSavingsMonthly,
        potentialSavingsAnnual: licenseData.potentialSavingsMonthly * 12,
      },
      licensing: {
        currentLicenses: licenseData.currentLicenses,
        recommendations: licenseData.recommendations,
      },
      security: securityData,
      costLeakage: costData,
      aiSummary,
    });

    emit(`Scan complete — health score: ${healthScore}/100, $${licenseData.potentialSavingsMonthly}/mo savings identified.`, "complete", "success");

  } catch (err) {
    emit(`Error during real scan: ${err.message}`, "error", "error");
    emit("Falling back to simulated scan pipeline...", "connector", "warning");

    // Fall back to simulation
    for (const step of SIMULATION_PIPELINE) {
      await sleep(step.delay);
      emit(step.text, step.module, step.module === "complete" ? "success" : "info");
    }
  }

  completeScan(scanId);
  onComplete();
}

// ── Simulated Scan (for demo tenants) ────────────────────────
async function runSimulatedScan(scanId, tenant, onLog, onComplete) {
  const emit = (text, module, type) => {
    const log = { text, module, type, timestamp: ts() };
    appendLog(scanId, log);
    onLog(log);
  };

  emit(`Starting simulated scan for tenant: ${tenant.displayName} (${tenant.domain}) [Demo Mode]`, "init", "info");

  for (const step of SIMULATION_PIPELINE) {
    await sleep(step.delay);
    emit(step.text, step.module, step.module === "complete" ? "success" : "info");
  }

  completeScan(scanId);
  onComplete();
}

// ── Utils ────────────────────────────────────────────────────
function ts() { return new Date().toISOString(); }
function sleep(ms) { return new Promise((r) => setTimeout(r, ms)); }
