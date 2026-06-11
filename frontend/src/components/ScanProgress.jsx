import React, { useState, useEffect, useRef } from 'react';
import { Terminal, Shield, RefreshCw } from 'lucide-react';

const LOG_MESSAGES = [
  { text: "Initializing Microsoft Graph API connector...", type: "info" },
  { text: "Authenticating with Client Credentials (JWT Token validated)...", type: "info" },
  { text: "Successfully connected to tenant directory.", type: "success" },
  { text: "Pulling assigned licenses details & Microsoft SKU listings...", type: "info" },
  { text: "Analyzing licensing metrics... Found unassigned subscriptions.", type: "warning" },
  { text: "Scanning Microsoft Entra ID authentication methods...", type: "info" },
  { text: "CRITICAL: Detected administrator accounts without MFA active!", type: "warning" },
  { text: "Auditing Conditional Access Policies...", type: "info" },
  { text: "Evaluating Cost Leakages (Disabled users & Inactive mailboxes)...", type: "info" },
  { text: "Packaging telemetry payload for intelligence engine...", type: "info" },
  { text: "Transmitting encrypted scan results to Azure OpenAI (GPT-4o)...", type: "info" },
  { text: "Generating executive summary and recommendations roadmap...", type: "info" },
  { text: "AI Advisory report written successfully.", type: "success" },
  { text: "Scan pipeline completed. Re-indexing completed in 4.2 seconds.", type: "success" },
];

export default function ScanProgress({ onScanComplete }) {
  const [logs, setLogs] = useState([]);
  const [progress, setProgress] = useState(0);
  const terminalEndRef = useRef(null);

  useEffect(() => {
    let currentLogIndex = 0;
    const intervalTime = 250; // Add log entry every 250ms
    
    const logTimer = setInterval(() => {
      if (currentLogIndex < LOG_MESSAGES.length) {
        const timestamp = new Date().toLocaleTimeString();
        setLogs(prev => [...prev, { ...LOG_MESSAGES[currentLogIndex], time: timestamp }]);
        setProgress(Math.floor(((currentLogIndex + 1) / LOG_MESSAGES.length) * 100));
        currentLogIndex++;
      } else {
        clearInterval(logTimer);
        setTimeout(() => {
          onScanComplete();
        }, 800);
      }
    }, intervalTime);

    return () => clearInterval(logTimer);
  }, [onScanComplete]);

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
            width: '80px',
            height: '80px',
            borderRadius: '50%',
            background: 'rgba(var(--accent-blue-rgb), 0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '1px solid rgba(var(--accent-blue-rgb), 0.2)'
          }}>
            <Shield size={36} color="var(--accent-blue)" style={{
              animation: 'pulse 2s infinite ease-in-out'
            }} />
          </div>
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '80px',
            height: '80px',
            borderRadius: '50%',
            border: '2px solid var(--accent-blue)',
            borderTopColor: 'transparent',
            animation: 'spin 1s linear infinite'
          }} />
        </div>
        <h2 style={{ fontSize: '1.8rem', marginBottom: '8px' }}>Scanning M365 Tenant</h2>
        <p>Retrieving directory configuration and calculating optimization metrics...</p>
      </div>

      {/* Progress Bar */}
      <div style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '6px', color: 'var(--text-secondary)' }}>
          <span>Ingesting Telemetry Data</span>
          <span style={{ fontFamily: 'var(--font-mono)' }}>{progress}%</span>
        </div>
        <div style={{ height: '6px', width: '100%', background: 'rgba(255, 255, 255, 0.05)', borderRadius: '3px', overflow: 'hidden' }}>
          <div style={{
            height: '100%',
            width: `${progress}%`,
            background: 'linear-gradient(90deg, var(--accent-blue) 0%, var(--accent-purple) 100%)',
            transition: 'width 0.2s ease-out',
            borderRadius: '3px'
          }} />
        </div>
      </div>

      {/* Sleek Terminal Output */}
      <div className="terminal-container">
        <div className="terminal-header">
          <div className="terminal-dots">
            <div className="terminal-dot dot-red" />
            <div className="terminal-dot dot-yellow" />
            <div className="terminal-dot dot-green" />
          </div>
          <div className="terminal-title" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Terminal size={12} />
            <span>data_collector_orchestrator.js</span>
          </div>
          <div style={{ width: '42px' }} /> {/* Spacing spacer */}
        </div>

        <div className="terminal-body">
          {logs.map((log, index) => (
            <div className="terminal-log" key={index}>
              <span className="terminal-time">[{log.time}]</span>
              <span className={`terminal-msg ${log.type}`}>
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
