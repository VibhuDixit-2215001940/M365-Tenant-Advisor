import React, { useState, useEffect } from 'react';
import Navigation from './components/Navigation';
import Dashboard from './pages/Dashboard';
import LicenseOptimization from './pages/LicenseOptimization';
import SecurityAnalysis from './pages/SecurityAnalysis';
import CostLeakage from './pages/CostLeakage';
import AISummary from './pages/AISummary';
import OnboardTenant from './pages/OnboardTenant';
import ScanProgress from './components/ScanProgress';
import { mockTenants } from './mockData';
import { fetchTenants, fetchTenant, startScan } from './services/api';

export default function App() {
  const [activeTenantId, setActiveTenantId] = useState('contoso');
  const [currentTab, setCurrentTab] = useState('dashboard');
  const [isScanning, setIsScanning] = useState(false);
  const [showProgress, setShowProgress] = useState(false);
  const [currentScanId, setCurrentScanId] = useState(null);
  const [scanMode, setScanMode] = useState('simulation'); // 'live' | 'simulation'
  const [showOnboard, setShowOnboard] = useState(false);

  // Tenant data — seeded from mockData, augmented with backend real tenants
  const [tenantsData, setTenantsData] = useState(mockTenants);
  const [backendOnline, setBackendOnline] = useState(false);

  // Load tenants from backend on mount (and after onboarding)
  const loadTenants = async () => {
    try {
      const list = await fetchTenants();
      if (list && list.length > 0) {
        setBackendOnline(true);
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
      setBackendOnline(false);
    }
  };

  useEffect(() => {
    loadTenants();
  }, []);

  // Active Tenant
  const activeTenant = tenantsData[activeTenantId] || mockTenants[activeTenantId];

  // Tenant switch
  const handleTenantChange = (tenantId) => {
    setActiveTenantId(tenantId);
    setCurrentTab('dashboard');
  };

  // Trigger scan
  const handleTriggerScan = async () => {
    setIsScanning(true);
    setShowProgress(true);

    if (backendOnline) {
      try {
        const { scanId, mode } = await startScan(activeTenantId);
        setCurrentScanId(scanId);
        setScanMode(mode || 'simulation');
      } catch (_) {
        setCurrentScanId(null);
        setScanMode('simulation');
      }
    } else {
      setCurrentScanId(null);
      setScanMode('simulation');
    }
  };

  // Scan complete — refresh tenant data
  const handleScanComplete = async () => {
    setIsScanning(false);
    setShowProgress(false);
    setCurrentScanId(null);
    setScanMode('simulation');

    if (backendOnline) {
      try {
        const fresh = await fetchTenant(activeTenantId);
        setTenantsData((prev) => ({ ...prev, [activeTenantId]: fresh }));
      } catch (_) { /* ignore */ }
    }

    setCurrentTab('dashboard');
  };

  // Onboarding success — refresh tenants and switch to new one
  const handleOnboardSuccess = async (newTenantId, displayName) => {
    setShowOnboard(false);
    await loadTenants();
    setActiveTenantId(newTenantId);
    setCurrentTab('dashboard');
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Background Blobs */}
      <div className="bg-blobs">
        <div className="blob blob-1" />
        <div className="blob blob-2" />
        <div className="blob blob-3" />
      </div>

      {/* Backend status pill */}
      {backendOnline && !showOnboard && (
        <div style={{
          position: 'fixed', top: '10px', right: '16px', zIndex: 9999,
          fontSize: '0.68rem', fontFamily: 'var(--font-mono)',
          background: 'rgba(16, 185, 129, 0.12)',
          border: '1px solid rgba(16, 185, 129, 0.3)',
          color: '#10b981', padding: '3px 10px', borderRadius: '20px',
          display: 'flex', alignItems: 'center', gap: '5px',
          pointerEvents: 'none',
        }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#10b981', display: 'inline-block' }} />
          API Connected
        </div>
      )}

      {/* Navigation */}
      {!showOnboard && (
        <Navigation
          currentTab={currentTab}
          setCurrentTab={setCurrentTab}
          activeTenantId={activeTenantId}
          onTenantChange={handleTenantChange}
          mockTenants={tenantsData}
          isScanning={isScanning}
          onTriggerScan={handleTriggerScan}
          onAddTenant={() => setShowOnboard(true)}
        />
      )}

      {/* Main Page Area */}
      <main className="app-container">
        {/* Onboarding overlay */}
        {showOnboard && (
          <OnboardTenant
            onSuccess={handleOnboardSuccess}
            onCancel={() => setShowOnboard(false)}
          />
        )}

        {/* Scan progress */}
        {!showOnboard && showProgress && (
          <ScanProgress
            scanId={currentScanId}
            scanMode={scanMode}
            tenantName={activeTenant?.displayName}
            onScanComplete={handleScanComplete}
          />
        )}

        {/* Main tabs */}
        {!showOnboard && !showProgress && (
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
