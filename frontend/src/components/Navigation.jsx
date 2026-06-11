import React from 'react';
import { ShieldCheck, RefreshCw, Plus } from 'lucide-react';

export default function Navigation({ 
  currentTab, 
  setCurrentTab, 
  activeTenantId, 
  onTenantChange, 
  mockTenants, 
  isScanning, 
  onTriggerScan,
  onAddTenant
}) {
  return (
    <header className="nav-header">
      <div className="nav-logo" onClick={() => setCurrentTab('dashboard')}>
        <ShieldCheck size={28} color="var(--accent-blue)" />
        <span>M365 Advisor</span>
      </div>

      <nav className="nav-links">
        <button 
          className={`nav-link ${currentTab === 'dashboard' ? 'active' : ''}`}
          onClick={() => setCurrentTab('dashboard')}
        >
          Dashboard
        </button>
        <button 
          className={`nav-link ${currentTab === 'licensing' ? 'active' : ''}`}
          onClick={() => setCurrentTab('licensing')}
        >
          License Optimization
        </button>
        <button 
          className={`nav-link ${currentTab === 'security' ? 'active' : ''}`}
          onClick={() => setCurrentTab('security')}
        >
          Security Analysis
        </button>
        <button 
          className={`nav-link ${currentTab === 'cost' ? 'active' : ''}`}
          onClick={() => setCurrentTab('cost')}
        >
          Cost Leakage
        </button>
        <button 
          className={`nav-link ${currentTab === 'ai-summary' ? 'active' : ''}`}
          onClick={() => setCurrentTab('ai-summary')}
        >
          AI Advisory
        </button>
      </nav>

      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <select 
          className="tenant-selector"
          value={activeTenantId}
          onChange={(e) => onTenantChange(e.target.value)}
          disabled={isScanning}
        >
          {Object.values(mockTenants).map(tenant => (
            <option key={tenant.id} value={tenant.id}>
              {tenant.displayName} ({tenant.domain}){tenant.isReal ? ' ★' : ''}
            </option>
          ))}
        </select>

        {/* Add Tenant Button */}
        <button 
          className="btn-secondary"
          onClick={onAddTenant}
          disabled={isScanning}
          style={{ padding: '8px 12px', fontSize: '0.82rem', gap: '5px' }}
          title="Onboard a new M365 tenant"
        >
          <Plus size={14} />
          Add Tenant
        </button>

        <button 
          className="btn-primary" 
          onClick={onTriggerScan}
          disabled={isScanning}
          style={{ padding: '8px 16px', fontSize: '0.85rem' }}
        >
          <RefreshCw className={isScanning ? 'spin-anim' : ''} size={14} style={{
            animation: isScanning ? 'spin 1.5s linear infinite' : 'none'
          }} />
          {isScanning ? 'Scanning...' : 'Re-Scan Tenant'}
        </button>
      </div>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </header>
  );
}
