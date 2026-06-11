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
  return json.data;
}

// ── Tenant API ───────────────────────────────────────────────

/** Fetch all onboarded tenants (summary). */
export async function fetchTenants() {
  return apiFetch("/tenants");
}

/** Fetch full tenant data by ID. */
export async function fetchTenant(tenantId) {
  return apiFetch(`/tenants/${tenantId}`);
}

// ── Scan API ─────────────────────────────────────────────────

/**
 * Start a tenant scan.
 * @returns {Promise<string>} scanId
 */
export async function startScan(tenantId) {
  const data = await apiFetch("/scans/start", {
    method: "POST",
    body: JSON.stringify({ tenantId }),
  });
  return data.scanId;
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
  return apiFetch(`/scans/${scanId}/results`);
}

/** Check API health. */
export async function fetchHealth() {
  return apiFetch("/health");
}
