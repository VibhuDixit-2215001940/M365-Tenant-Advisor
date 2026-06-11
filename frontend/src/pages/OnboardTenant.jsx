import React, { useState } from 'react';
import { Plus, Key, Shield, CheckCircle2, AlertCircle, ChevronDown, ChevronUp, ExternalLink, Copy, Loader2 } from 'lucide-react';
import { onboardTenant } from '../services/api';

export default function OnboardTenant({ onSuccess, onCancel }) {
  const [tenantId, setTenantId] = useState('');
  const [clientId, setClientId] = useState('');
  const [clientSecret, setClientSecret] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(null);
  const [showGuide, setShowGuide] = useState(false);

  const guidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess(null);

    // Client-side validation
    if (!guidRegex.test(tenantId.trim())) {
      setError('Tenant ID must be a valid GUID (e.g., xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx)');
      return;
    }
    if (!guidRegex.test(clientId.trim())) {
      setError('Client ID must be a valid GUID');
      return;
    }
    if (!clientSecret.trim()) {
      setError('Client Secret is required');
      return;
    }

    setLoading(true);
    try {
      const result = await onboardTenant(tenantId.trim(), clientId.trim(), clientSecret.trim());
      setSuccess(result);
      // Auto-redirect after 2 seconds
      setTimeout(() => {
        onSuccess(result.id, result.displayName);
      }, 2000);
    } catch (err) {
      setError(err.message || 'Failed to onboard tenant. Check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
  };

  // Required Graph API permissions
  const permissions = [
    { name: 'User.Read.All', desc: 'Read all user profiles, sign-in activity' },
    { name: 'Directory.Read.All', desc: 'Read directory data, licenses, devices' },
    { name: 'Organization.Read.All', desc: 'Read organization info' },
    { name: 'Policy.Read.All', desc: 'Read Conditional Access policies' },
    { name: 'SecurityEvents.Read.All', desc: 'Read Secure Score data' },
    { name: 'AuditLog.Read.All', desc: 'Read sign-in and audit logs' },
    { name: 'Reports.Read.All', desc: 'Read usage reports' },
  ];

  // Success State
  if (success) {
    return (
      <div className="glass-card fade-in-up" style={{ maxWidth: '600px', margin: '40px auto', textAlign: 'center' }}>
        <div style={{
          width: '90px', height: '90px', borderRadius: '50%',
          background: 'rgba(48, 209, 88, 0.1)', border: '2px solid rgba(48, 209, 88, 0.3)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 24px',
        }}>
          <CheckCircle2 size={42} color="var(--accent-teal)" />
        </div>
        <h2 style={{ fontSize: '1.6rem', marginBottom: '10px' }}>Tenant Onboarded Successfully</h2>
        <p style={{ fontSize: '1.1rem', color: 'var(--text-primary)', marginBottom: '6px' }}>
          {success.displayName}
        </p>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '24px' }}>
          {success.message}
        </p>
        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
          Redirecting to dashboard...
        </p>
      </div>
    );
  }

  return (
    <div className="fade-in-up" style={{ maxWidth: '700px', margin: '20px auto', width: '100%' }}>
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '32px' }}>
        <div style={{
          width: '72px', height: '72px', borderRadius: '50%',
          background: 'rgba(var(--accent-blue-rgb), 0.1)',
          border: '1px solid rgba(var(--accent-blue-rgb), 0.2)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 20px',
        }}>
          <Plus size={32} color="var(--accent-blue)" />
        </div>
        <h2 style={{ fontSize: '2rem', marginBottom: '8px', fontFamily: 'var(--font-display)' }}>
          Onboard a New Tenant
        </h2>
        <p style={{ maxWidth: '500px', margin: '0 auto' }}>
          Connect your Microsoft 365 tenant to pull real license, security, and usage data via the Graph API.
        </p>
      </div>

      {/* Form Card */}
      <div className="glass-card" style={{ marginBottom: '24px' }}>
        <form onSubmit={handleSubmit}>
          {/* Tenant ID */}
          <div style={{ marginBottom: '20px' }}>
            <label style={labelStyle}>
              <Key size={14} style={{ opacity: 0.6 }} />
              Azure Tenant ID (Directory ID)
            </label>
            <input
              id="input-tenant-id"
              type="text"
              value={tenantId}
              onChange={(e) => setTenantId(e.target.value)}
              placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
              style={inputStyle}
              disabled={loading}
              autoComplete="off"
            />
            <span style={hintStyle}>
              Azure Portal → Entra ID → Overview → Tenant ID
            </span>
          </div>

          {/* Client ID */}
          <div style={{ marginBottom: '20px' }}>
            <label style={labelStyle}>
              <Shield size={14} style={{ opacity: 0.6 }} />
              Application (Client) ID
            </label>
            <input
              id="input-client-id"
              type="text"
              value={clientId}
              onChange={(e) => setClientId(e.target.value)}
              placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
              style={inputStyle}
              disabled={loading}
              autoComplete="off"
            />
            <span style={hintStyle}>
              Azure Portal → App Registrations → Your App → Application (client) ID
            </span>
          </div>

          {/* Client Secret */}
          <div style={{ marginBottom: '24px' }}>
            <label style={labelStyle}>
              <Key size={14} style={{ opacity: 0.6 }} />
              Client Secret (Value)
            </label>
            <input
              id="input-client-secret"
              type="password"
              value={clientSecret}
              onChange={(e) => setClientSecret(e.target.value)}
              placeholder="Enter client secret value"
              style={inputStyle}
              disabled={loading}
              autoComplete="new-password"
            />
            <span style={hintStyle}>
              App Registration → Certificates & Secrets → Client secrets → Value (NOT Secret ID)
            </span>
          </div>

          {/* Error */}
          {error && (
            <div style={{
              background: 'rgba(255, 69, 58, 0.08)',
              border: '1px solid rgba(255, 69, 58, 0.25)',
              borderRadius: '10px', padding: '14px 16px', marginBottom: '20px',
              display: 'flex', alignItems: 'flex-start', gap: '10px',
              fontSize: '0.9rem', color: '#ff6b6b',
            }}>
              <AlertCircle size={18} style={{ flexShrink: 0, marginTop: '1px' }} />
              <span>{error}</span>
            </div>
          )}

          {/* Buttons */}
          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              type="submit"
              className="btn-primary"
              disabled={loading}
              style={{ flex: 1, justifyContent: 'center', padding: '14px', fontSize: '1rem' }}
            >
              {loading ? (
                <>
                  <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} />
                  Validating Credentials...
                </>
              ) : (
                <>
                  <Shield size={18} />
                  Connect & Onboard Tenant
                </>
              )}
            </button>
            <button
              type="button"
              className="btn-secondary"
              onClick={onCancel}
              disabled={loading}
              style={{ padding: '14px 24px' }}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>

      {/* Collapsible Setup Guide */}
      <div className="glass-card" style={{ padding: '0', overflow: 'hidden' }}>
        <button
          onClick={() => setShowGuide(!showGuide)}
          style={{
            width: '100%', background: 'none', border: 'none', color: 'var(--text-primary)',
            padding: '20px 24px', cursor: 'pointer', display: 'flex',
            justifyContent: 'space-between', alignItems: 'center',
            fontFamily: 'var(--font-sans)', fontSize: '0.95rem', fontWeight: 600,
          }}
        >
          <span style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <ExternalLink size={16} color="var(--accent-blue)" />
            How to Create an Azure App Registration
          </span>
          {showGuide ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </button>

        {showGuide && (
          <div style={{
            padding: '0 24px 24px', borderTop: '1px solid var(--border-color)',
            animation: 'fadeInUp 0.3s ease forwards',
          }}>
            {/* Steps */}
            <div style={{ marginTop: '20px' }}>
              {[
                {
                  step: 1,
                  title: 'Go to Azure Portal → Entra ID → App Registrations',
                  detail: 'Navigate to portal.azure.com → Microsoft Entra ID → App Registrations → + New registration',
                },
                {
                  step: 2,
                  title: 'Register the application',
                  detail: 'Name: "M365 Tenant Advisor" | Supported account types: "Accounts in this organizational directory only" | Leave Redirect URI blank → Register',
                },
                {
                  step: 3,
                  title: 'Copy the IDs',
                  detail: 'From the Overview page, copy the Application (client) ID and the Directory (tenant) ID.',
                },
                {
                  step: 4,
                  title: 'Create a Client Secret',
                  detail: 'Go to Certificates & secrets → + New client secret → Add description → Set expiry → Add → Copy the VALUE immediately (it won\'t be shown again).',
                },
                {
                  step: 5,
                  title: 'Grant API Permissions',
                  detail: 'Go to API permissions → + Add a permission → Microsoft Graph → Application permissions → Add the permissions listed below → Click "Grant admin consent".',
                },
              ].map((s) => (
                <div key={s.step} style={{
                  display: 'flex', gap: '14px', marginBottom: '16px',
                  padding: '12px 0', borderBottom: '1px solid rgba(255,255,255,0.04)',
                }}>
                  <div style={{
                    width: '28px', height: '28px', borderRadius: '50%', flexShrink: 0,
                    background: 'rgba(var(--accent-blue-rgb), 0.15)',
                    color: 'var(--accent-blue)', display: 'flex', alignItems: 'center',
                    justifyContent: 'center', fontWeight: 700, fontSize: '0.8rem',
                  }}>
                    {s.step}
                  </div>
                  <div>
                    <div style={{ fontWeight: 600, marginBottom: '4px', fontSize: '0.9rem' }}>{s.title}</div>
                    <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>{s.detail}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* Required Permissions Table */}
            <div style={{ marginTop: '8px' }}>
              <h4 style={{ fontSize: '0.9rem', marginBottom: '12px', color: 'var(--accent-blue)' }}>
                Required API Permissions (Application)
              </h4>
              <div style={{
                background: 'rgba(0,0,0,0.25)', borderRadius: '10px',
                border: '1px solid rgba(255,255,255,0.06)', overflow: 'hidden',
              }}>
                {permissions.map((p, i) => (
                  <div key={p.name} style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    padding: '10px 16px', borderBottom: i < permissions.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
                    fontSize: '0.82rem',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <code style={{
                        fontFamily: 'var(--font-mono)', fontSize: '0.78rem',
                        background: 'rgba(var(--accent-purple-rgb), 0.1)',
                        padding: '2px 8px', borderRadius: '4px', color: 'var(--accent-purple)',
                      }}>
                        {p.name}
                      </code>
                      <button
                        type="button"
                        onClick={() => copyToClipboard(p.name)}
                        style={{
                          background: 'none', border: 'none', color: 'var(--text-muted)',
                          cursor: 'pointer', padding: '2px',
                        }}
                        title="Copy permission name"
                      >
                        <Copy size={12} />
                      </button>
                    </div>
                    <span style={{ color: 'var(--text-secondary)' }}>{p.desc}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Direct link */}
            <a
              href="https://portal.azure.com/#view/Microsoft_AAD_RegisteredApps/ApplicationsListBlade"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '6px',
                color: 'var(--accent-blue)', fontSize: '0.85rem', marginTop: '16px',
                textDecoration: 'none', fontWeight: 500,
              }}
            >
              <ExternalLink size={14} />
              Open Azure Portal — App Registrations
            </a>
          </div>
        )}
      </div>

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

// ── Shared Styles ────────────────────────────────────────────
const labelStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '6px',
  fontSize: '0.85rem',
  fontWeight: 600,
  color: 'var(--text-primary)',
  marginBottom: '8px',
};

const inputStyle = {
  width: '100%',
  background: 'rgba(255, 255, 255, 0.04)',
  border: '1px solid var(--border-color)',
  color: 'var(--text-primary)',
  fontFamily: 'var(--font-mono)',
  fontSize: '0.9rem',
  padding: '12px 16px',
  borderRadius: '10px',
  outline: 'none',
  transition: 'border-color 0.2s, background 0.2s',
};

const hintStyle = {
  display: 'block',
  fontSize: '0.75rem',
  color: 'var(--text-muted)',
  marginTop: '6px',
  fontStyle: 'italic',
};
