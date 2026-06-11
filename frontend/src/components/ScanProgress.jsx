import React, { useState, useEffect, useRef } from 'react';
import { Terminal, Shield, RefreshCw } from 'lucide-react';
import { subscribeScanProgress } from '../services/api';

// Fallback simulation logs (used when backend is offline)
const SIMULATION_LOGS = [
  { text: "Initializing Microsoft Graph API connector...", type: "info" },
  { text: "Authenticating with Client Credentials (JWT Token validated)...", type: "info" },
  { text: "Successfully connected to tenant directory.", type: "success" },
  { text: "Fetching user directory — enumerating all accounts...", type: "info" },
  { text: "Identifying inactive accounts (90d+ login gap)...", type: "info" },
  { text: "Identifying disabled accounts with active license assignments...", type: "info" },
  { text: "Auditing Microsoft 365 SKU subscriptions...", type: "info" },
  { text: "Calculating unassigned license overhead...", type: "info" },
  { text: "Analyzing per-user feature utilization data...", type: "info" },
  { text: "Generating downgrade recommendations...", type: "info" },
  { text: "Running security posture audit via Secure Score API...", type: "info" },
  { text: "CRITICAL: Detected administrator accounts without MFA active!", type: "warning" },
  { text: "Auditing Conditional Access policies...", type: "info" },
  { text: "Auditing OAuth application consent permissions...", type: "info" },
  { text: "Auditing Unified Audit Log configuration...", type: "info" },
  { text: "Calculating cost leakage breakdown...", type: "info" },
  { text: "Cross-referencing billing data with usage telemetry...", type: "info" },
  { text: "Generating AI advisory report via Azure OpenAI...", type: "info" },
  { text: "Synthesizing executive summary and recommendations...", type: "info" },
  { text: "AI Advisory report written successfully.", type: "success" },
  { text: "Scan pipeline completed. All findings recorded.", type: "success" },
];

/**
 * ScanProgress component
 * Props:
 *   scanId      — if provided, connects to real SSE backend stream
 *   tenantName  — display name for the header
 *   onScanComplete — called when scan finishes
 */
export default function ScanProgress({ scanId, tenantName, onScanComplete }) {
  const [logs, setLogs] = useState([]);
  const [progress, setProgress] = useState(0);
  const [statusLabel, setStatusLabel] = useState('Ingesting Telemetry Data');
  const terminalEndRef = useRef(null);

  useEffect(() => {
    let cleanup = () => {};

    if (scanId) {
      // ── Real SSE mode ──────────────────────────────────────
      let logCount = 0;
      const totalExpected = SIMULATION_LOGS.length; // approx for progress bar

      const es = subscribeScanProgress(
        scanId,
        (log) => {
          const timestamp = new Date().toLocaleTimeString();
          setLogs((prev) => [...prev, { ...log, time: timestamp }]);
          logCount++;
          setProgress(Math.min(99, Math.floor((logCount / totalExpected) * 100)));

          // Update status label based on module
          const moduleLabels = {
            connector: 'Connecting to Microsoft Graph API',
            users: 'Scanning User Directory',
            licensing: 'Auditing License Subscriptions',
            security: 'Running Security Posture Audit',
            cost: 'Calculating Cost Leakage',
            ai: 'Generating AI Advisory Report',
            complete: 'Finalizing Scan Results',
          };
          if (log.module && moduleLabels[log.module]) {
            setStatusLabel(moduleLabels[log.module]);
          }
        },
        () => {
          setProgress(100);
          setStatusLabel('Scan Complete ✓');
          setTimeout(() => onScanComplete(), 1000);
        }
      );

      cleanup = () => es.close();
    } else {
      // ── Simulation fallback mode ───────────────────────────
      let currentIndex = 0;

      const timer = setInterval(() => {
        if (currentIndex < SIMULATION_LOGS.length) {
          const entry = SIMULATION_LOGS[currentIndex];
          const timestamp = new Date().toLocaleTimeString();
          setLogs((prev) => [...prev, { ...entry, time: timestamp }]);
          setProgress(Math.floor(((currentIndex + 1) / SIMULATION_LOGS.length) * 100));
          currentIndex++;
        } else {
          clearInterval(timer);
          setStatusLabel('Scan Complete ✓');
          setTimeout(() => onScanComplete(), 800);
        }
      }, 260);

      cleanup = () => clearInterval(timer);
    }

    return cleanup;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scanId]);

  // Auto-scroll terminal
  useEffect(() => {
    if (terminalEndRef.current) {
      terminalEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs]);

  return (
    <div className="glass-card fade-in-up" style={{ maxWidth: '750px', margin: '40px auto', width: '100%' }}>
      <div style={{ textAlign: 'center', marginBottom: '32px' }}>
        <div style={{ position: 'relative', display: 'inline-flex', marginBottom: '20px' }}>
          <div style={{
            width: '80px', height: '80px', borderRadius: '50%',
            background: 'rgba(var(--accent-blue-rgb), 0.1)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            border: '1px solid rgba(var(--accent-blue-rgb), 0.2)',
          }}>
            <Shield size={36} color="var(--accent-blue)" style={{ animation: 'pulse 2s infinite ease-in-out' }} />
          </div>
          <div style={{
            position: 'absolute', top: 0, left: 0, width: '80px', height: '80px',
            borderRadius: '50%', border: '2px solid var(--accent-blue)',
            borderTopColor: 'transparent', animation: 'spin 1s linear infinite',
          }} />
        </div>
        <h2 style={{ fontSize: '1.8rem', marginBottom: '8px' }}>
          Scanning M365 Tenant
        </h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
          {tenantName ? `Analyzing ${tenantName}` : 'Retrieving directory configuration and calculating optimization metrics...'}
        </p>
        {scanId && (
          <p style={{ color: 'var(--text-muted, rgba(255,255,255,0.35))', fontSize: '0.72rem', fontFamily: 'var(--font-mono)', marginTop: '6px' }}>
            Job ID: {scanId}
          </p>
        )}
      </div>

      {/* Progress Bar */}
      <div style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '6px', color: 'var(--text-secondary)' }}>
          <span>{statusLabel}</span>
          <span style={{ fontFamily: 'var(--font-mono)' }}>{progress}%</span>
        </div>
        <div style={{ height: '6px', width: '100%', background: 'rgba(255, 255, 255, 0.05)', borderRadius: '3px', overflow: 'hidden' }}>
          <div style={{
            height: '100%', width: `${progress}%`,
            background: 'linear-gradient(90deg, var(--accent-blue) 0%, var(--accent-purple) 100%)',
            transition: 'width 0.3s ease-out', borderRadius: '3px',
          }} />
        </div>
      </div>

      {/* Terminal Output */}
      <div className="terminal-container">
        <div className="terminal-header">
          <div className="terminal-dots">
            <div className="terminal-dot dot-red" />
            <div className="terminal-dot dot-yellow" />
            <div className="terminal-dot dot-green" />
          </div>
          <div className="terminal-title" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Terminal size={12} />
            <span>scan_orchestrator.js{scanId ? ' — live' : ' — simulation'}</span>
          </div>
          <div style={{ width: '42px' }} />
        </div>

        <div className="terminal-body">
          {logs.map((log, index) => (
            <div className="terminal-log" key={index}>
              <span className="terminal-time">[{log.time}]</span>
              <span className={`terminal-msg ${log.type === 'success' ? 'success' : log.type === 'warning' || log.type === 'error' ? 'warning' : 'info'}`}>
                {log.text}
              </span>
            </div>
          ))}
          <div ref={terminalEndRef} />
        </div>
      </div>

      <style>{`
        @keyframes pulse {
          0% { transform: scale(0.95); opacity: 0.8; }
          50% { transform: scale(1.05); opacity: 1; }
          100% { transform: scale(0.95); opacity: 0.8; }
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
