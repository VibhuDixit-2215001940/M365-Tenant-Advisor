import React, { useState } from 'react';
import Navigation from './components/Navigation';
import Dashboard from './pages/Dashboard';
import LicenseOptimization from './pages/LicenseOptimization';
import SecurityAnalysis from './pages/SecurityAnalysis';
import CostLeakage from './pages/CostLeakage';
import AISummary from './pages/AISummary';
import ScanProgress from './components/ScanProgress';
import { mockTenants } from './mockData';

export default function App() {
  const [activeTenantId, setActiveTenantId] = useState('contoso');
  const [currentTab, setCurrentTab] = useState('dashboard');
  const [isScanning, setIsScanning] = useState(false);
  const [showProgress, setShowProgress] = useState(false);

  // Active Tenant
  const activeTenant = mockTenants[activeTenantId];

  // Handler for tenant switch
  const handleTenantChange = (tenantId) => {
    setActiveTenantId(tenantId);
    // Automatically reset back to dashboard
    setCurrentTab('dashboard');
  };

  // Handler for trigger scan
  const handleTriggerScan = () => {
    setIsScanning(true);
    setShowProgress(true);
  };

  const handleScanComplete = () => {
    setIsScanning(false);
    setShowProgress(false);
    // Navigate to dashboard
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

      {/* Navigation */}
      <Navigation
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        activeTenantId={activeTenantId}
        onTenantChange={handleTenantChange}
        mockTenants={mockTenants}
        isScanning={isScanning}
        onTriggerScan={handleTriggerScan}
      />

      {/* Main Page Area */}
      <main className="app-container">
        {showProgress ? (
          <ScanProgress onScanComplete={handleScanComplete} />
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
