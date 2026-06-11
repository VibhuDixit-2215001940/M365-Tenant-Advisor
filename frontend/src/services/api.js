// ============================================================
//  api.js — Unified Frontend API Client
//  Wraps fetch calls and SSE connections to the Express backend.
// ============================================================

const BASE_URL = "/api"; // Proxied via Vite to http://localhost:5000

// ── Helper ───────────────────────────────────────────────────
async function apiFetch(path, options = {}) {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { "Content-Type": "application/json", ...options.headers },
    ...options,
  });
  const json = await res.json();
  if (!res.ok || !json.success) {
    throw new Error(json.error || `HTTP ${res.status}`);
  }
  return json;
}

// ── Tenant API ───────────────────────────────────────────────

/** Fetch all onboarded tenants (summary). */
export async function fetchTenants() {
  const result = await apiFetch("/tenants");
  return result.data;
}

/** Fetch full tenant data by ID. */
export async function fetchTenant(tenantId) {
  const result = await apiFetch(`/tenants/${tenantId}`);
  return result.data;
}

/**
 * Onboard a new tenant with Azure credentials.
 * @returns {{ id, displayName, domain, isNew, message }}
 */
export async function onboardTenant(tenantId, clientId, clientSecret) {
  const result = await apiFetch("/tenants/onboard", {
    method: "POST",
    body: JSON.stringify({ tenantId, clientId, clientSecret }),
  });
  return { ...result.data, message: result.message };
}

/** Remove a tenant by ID. */
export async function removeTenant(tenantId) {
  const result = await apiFetch(`/tenants/${tenantId}`, {
    method: "DELETE",
  });
  return result;
}

// ── Scan API ─────────────────────────────────────────────────

/**
 * Start a tenant scan.
 * @returns {Promise<{ scanId, mode }>}
 */
export async function startScan(tenantId) {
  const result = await apiFetch("/scans/start", {
    method: "POST",
    body: JSON.stringify({ tenantId }),
  });
  return { scanId: result.scanId, mode: result.mode };
}

/**
 * Open an SSE stream for real-time scan progress.
 * @param {string} scanId
 * @param {Function} onLog  - Called with each log { text, module, type, timestamp }
 * @param {Function} onDone - Called when scan completes
 * @returns {EventSource} - Call .close() to cancel early
 */
export function subscribeScanProgress(scanId, onLog, onDone) {
  const es = new EventSource(`${BASE_URL}/scans/${scanId}/progress`);

  es.onmessage = (e) => {
    try {
      const log = JSON.parse(e.data);
      onLog(log);
    } catch (_) { /* ignore malformed */ }
  };

  es.addEventListener("done", (e) => {
    try { JSON.parse(e.data); } catch (_) { /* ignore */ }
    es.close();
    onDone();
  });

  es.addEventListener("error", () => {
    es.close();
    onDone();
  });

  return es;
}

/** Fetch completed scan results. */
export async function fetchScanResults(scanId) {
  const result = await apiFetch(`/scans/${scanId}/results`);
  return result.data;
}

/** Check API health. */
export async function fetchHealth() {
  const result = await apiFetch("/health");
  return result.data;
}
