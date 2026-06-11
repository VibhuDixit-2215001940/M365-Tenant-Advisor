import React, { useState, useEffect } from 'react';
import Navigation from './components/Navigation';
import Dashboard from './pages/Dashboard';
import LicenseOptimization from './pages/LicenseOptimization';
import SecurityAnalysis from './pages/SecurityAnalysis';
import CostLeakage from './pages/CostLeakage';
import AISummary from './pages/AISummary';
import ScanProgress from './components/ScanProgress';
import { mockTenants } from './mockData';
import { fetchTenants, fetchTenant, startScan } from './services/api';

export default function App() {
  const [activeTenantId, setActiveTenantId] = useState('contoso');
  const [currentTab, setCurrentTab] = useState('dashboard');
  const [isScanning, setIsScanning] = useState(false);
  const [showProgress, setShowProgress] = useState(false);
  const [currentScanId, setCurrentScanId] = useState(null);

  // Tenant data — seeded from mockData, optionally refreshed from backend
  const [tenantsData, setTenantsData] = useState(mockTenants);
  const [backendOnline, setBackendOnline] = useState(false);

  // On mount: try to load tenant data from backend; fall back to mock silently
  useEffect(() => {
    const loadFromBackend = async () => {
      try {
        const list = await fetchTenants();
        if (list && list.length > 0) {
          setBackendOnline(true);
          // Fetch full data for each tenant
          const fullData = {};
          await Promise.all(
            list.map(async (t) => {
              try {
                const full = await fetchTenant(t.id);
                fullData[t.id] = full;
              } catch (_) {
                fullData[t.id] = mockTenants[t.id] || t;
              }
            })
          );
          setTenantsData(fullData);
        }
      } catch (_) {
        // Backend not running — silently use mock data
        setBackendOnline(false);
      }
    };
    loadFromBackend();
  }, []);

  // Active Tenant
  const activeTenant = tenantsData[activeTenantId] || mockTenants[activeTenantId];

  // Handler for tenant switch
  const handleTenantChange = (tenantId) => {
    setActiveTenantId(tenantId);
    setCurrentTab('dashboard');
  };

  // Handler for trigger scan — uses backend SSE if online, otherwise timer simulation
  const handleTriggerScan = async () => {
    setIsScanning(true);
    setShowProgress(true);

    if (backendOnline) {
      try {
        const scanId = await startScan(activeTenantId);
        setCurrentScanId(scanId);
      } catch (_) {
        // Backend call failed mid-session — fall through to simulation mode
        setCurrentScanId(null);
      }
    } else {
      setCurrentScanId(null);
    }
  };

  const handleScanComplete = async () => {
    setIsScanning(false);
    setShowProgress(false);
    setCurrentScanId(null);

    // Refresh tenant data from backend after scan completes
    if (backendOnline) {
      try {
        const fresh = await fetchTenant(activeTenantId);
        setTenantsData((prev) => ({ ...prev, [activeTenantId]: fresh }));
      } catch (_) { /* ignore */ }
    }

    setCurrentTab('dashboard');
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Dynamic Background Blobs */}
      <div className="bg-blobs">
        <div className="blob blob-1" />
        <div className="blob blob-2" />
        <div className="blob blob-3" />
      </div>

      {/* Backend status indicator (subtle pill) */}
      {backendOnline && (
        <div style={{
          position: 'fixed', top: '10px', right: '16px', zIndex: 9999,
          fontSize: '0.68rem', fontFamily: 'var(--font-mono)',
          background: 'rgba(16, 185, 129, 0.12)',
          border: '1px solid rgba(16, 185, 129, 0.3)',
          color: '#10b981', padding: '3px 10px', borderRadius: '20px',
          display: 'flex', alignItems: 'center', gap: '5px',
        }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#10b981', display: 'inline-block' }} />
          API Connected
        </div>
      )}

      {/* Navigation */}
      <Navigation
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        activeTenantId={activeTenantId}
        onTenantChange={handleTenantChange}
        mockTenants={tenantsData}
        isScanning={isScanning}
        onTriggerScan={handleTriggerScan}
      />

      {/* Main Page Area */}
      <main className="app-container">
        {showProgress ? (
          <ScanProgress
            scanId={currentScanId}
            tenantName={activeTenant?.displayName}
            onScanComplete={handleScanComplete}
          />
        ) : (
          <>
            {currentTab === 'dashboard' && (
              <Dashboard tenant={activeTenant} onNavigate={setCurrentTab} />
            )}
            {currentTab === 'licensing' && (
              <LicenseOptimization tenant={activeTenant} />
            )}
            {currentTab === 'security' && (
              <SecurityAnalysis tenant={activeTenant} />
            )}
            {currentTab === 'cost' && (
              <CostLeakage tenant={activeTenant} />
            )}
            {currentTab === 'ai-summary' && (
              <AISummary tenant={activeTenant} />
            )}
          </>
        )}
      </main>
    </div>
  );
}
