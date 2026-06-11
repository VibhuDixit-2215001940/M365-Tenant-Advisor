import React from 'react';
import { CreditCard, Shield, AlertCircle, TrendingUp, CheckCircle, ChevronRight, Users, Laptop } from 'lucide-react';
import ScoreGauge from '../components/ScoreGauge';

export default function Dashboard({ tenant, onNavigate }) {
  const { displayName, domain, healthScore, metrics, lastScanAt } = tenant;

  // Format currency
  const formatCurrency = (val) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(val);
  };

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="fade-in-up dashboard-grid">
      {/* Sidebar: Overall Health Score Panel */}
      <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <ScoreGauge score={healthScore} />
        
        <div style={{ textAlign: 'center', marginTop: '24px', width: '100%' }}>
          <h3 style={{ fontSize: '1.4rem', marginBottom: '4px' }}>{displayName}</h3>
          <p style={{ fontSize: '0.85rem', marginBottom: '16px' }}>{domain}</p>
          
          <div style={{
            background: 'rgba(255, 255, 255, 0.03)',
            borderRadius: '12px',
            padding: '16px',
            border: '1px solid var(--border-color)',
            textAlign: 'left',
            marginBottom: '20px'
          }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block', textTransform: 'uppercase', marginBottom: '4px' }}>Last Audited</span>
            <span style={{ fontSize: '0.9rem', fontWeight: 500 }}>{formatDate(lastScanAt)}</span>
          </div>

          <div style={{
            background: 'rgba(48, 209, 88, 0.06)',
            borderRadius: '16px',
            padding: '20px',
            border: '1px solid rgba(48, 209, 88, 0.15)',
            textAlign: 'center'
          }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--accent-teal)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Optimize Potential</span>
            <div style={{
              fontSize: '2rem',
              fontWeight: 800,
              fontFamily: 'var(--font-display)',
              color: 'var(--accent-teal)',
              margin: '6px 0'
            }}>
              {formatCurrency(metrics.potentialSavingsMonthly)}
              <span style={{ fontSize: '1rem', fontWeight: 500, color: 'var(--text-secondary)' }}>/mo</span>
            </div>
            <p style={{ fontSize: '0.8rem' }}>Estimated annual savings of {formatCurrency(metrics.potentialSavingsAnnual)}</p>
          </div>
        </div>
      </div>

      {/* Main Grid: Categories Summaries */}
      <div className="dashboard-main">
        <div className="dashboard-hero">
          <h1 style={{ fontSize: '2.5rem', marginBottom: '4px' }}>Tenant Advisor Overview</h1>
          <p className="dashboard-subtitle">Active recommendations to optimize your licensing budget and secure Entra policies.</p>
        </div>

        {/* Top metrics bar */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px' }}>
          <div className="glass-card" style={{ padding: '20px 24px', display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ background: 'rgba(0, 113, 227, 0.1)', border: '1px solid rgba(0, 113, 227, 0.2)', padding: '12px', borderRadius: '12px' }}>
              <Users size={24} color="var(--accent-blue)" />
            </div>
            <div>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Total Directory Users</span>
              <h4 style={{ fontSize: '1.4rem', marginTop: '2px' }}>{metrics.users}</h4>
            </div>
          </div>

          <div className="glass-card" style={{ padding: '20px 24px', display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ background: 'rgba(191, 90, 242, 0.1)', border: '1px solid rgba(191, 90, 242, 0.2)', padding: '12px', borderRadius: '12px' }}>
              <Laptop size={24} color="var(--accent-purple)" />
            </div>
            <div>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Enrolled Devices</span>
              <h4 style={{ fontSize: '1.4rem', marginTop: '2px' }}>{metrics.devices}</h4>
            </div>
          </div>

          <div className="glass-card" style={{ padding: '20px 24px', display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ background: 'rgba(48, 209, 88, 0.1)', border: '1px solid rgba(48, 209, 88, 0.2)', padding: '12px', borderRadius: '12px' }}>
              <TrendingUp size={24} color="var(--accent-teal)" />
            </div>
            <div>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>License Optimization</span>
              <h4 style={{ fontSize: '1.4rem', marginTop: '2px' }}>{Math.round((metrics.licensesAssigned / metrics.licensesTotal) * 100)}%</h4>
            </div>
          </div>
        </div>

        {/* 2x2 Category Summary Cards */}
        <div className="summary-cards-grid">
          
          {/* Card 1: Licensing Optimization */}
          <div className="glass-card" style={{ cursor: 'pointer' }} onClick={() => onNavigate('licensing')}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ background: 'rgba(0, 113, 227, 0.1)', padding: '8px', borderRadius: '8px' }}>
                  <CreditCard size={20} color="var(--accent-blue)" />
                </div>
                <h3 style={{ fontSize: '1.15rem' }}>Licensing Gaps</h3>
              </div>
              <span className="badge badge-low" style={{ fontSize: '0.65rem' }}>
                {tenant.licensing.recommendations.length} items
              </span>
            </div>
            <p style={{ fontSize: '0.9rem', marginBottom: '16px' }}>
              We analyzed your assigned subscriptions. 80 accounts are currently over-licensed or assigned E5 without feature use.
            </p>
            <div className="metric-strip">
              <div className="metric-item">
                <span className="metric-label">Downgrades</span>
                <span className="metric-val" style={{ color: 'var(--accent-blue)' }}>80 Users</span>
              </div>
              <div className="metric-item">
                <span className="metric-label">Licensing Waste</span>
                <span className="metric-val">{formatCurrency(tenant.licensing.recommendations.reduce((sum, item) => sum + item.monthlySavings, 0))}/mo</span>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.85rem', color: 'var(--accent-blue)', fontWeight: 500, marginTop: '20px' }}>
              <span>View details & chart</span>
              <ChevronRight size={14} />
            </div>
          </div>

          {/* Card 2: Security Analysis */}
          <div className="glass-card" style={{ cursor: 'pointer' }} onClick={() => onNavigate('security')}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ background: 'rgba(255, 69, 58, 0.1)', padding: '8px', borderRadius: '8px' }}>
                  <Shield size={20} color="var(--accent-red)" />
                </div>
                <h3 style={{ fontSize: '1.15rem' }}>Security Posture</h3>
              </div>
              <span className="badge badge-critical" style={{ fontSize: '0.65rem' }}>
                {tenant.security.findings.filter(f => f.severity === 'Critical' || f.severity === 'High').length} high risk
              </span>
            </div>
            <p style={{ fontSize: '0.9rem', marginBottom: '16px' }}>
              Detected critical security configurations. Administrative users are accessing the tenant without MFA enforced.
            </p>
            <div className="metric-strip">
              <div className="metric-item">
                <span className="metric-label">Audit Score</span>
                <span className="metric-val" style={{ color: 'var(--accent-orange)' }}>{tenant.security.score}/100</span>
              </div>
              <div className="metric-item">
                <span className="metric-label">Vulnerabilities</span>
                <span className="metric-val">{tenant.security.findings.length} Open</span>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.85rem', color: 'var(--accent-blue)', fontWeight: 500, marginTop: '20px' }}>
              <span>Audit security gaps</span>
              <ChevronRight size={14} />
            </div>
          </div>

          {/* Card 3: Cost Leakage */}
          <div className="glass-card" style={{ cursor: 'pointer' }} onClick={() => onNavigate('cost')}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ background: 'rgba(48, 209, 88, 0.1)', padding: '8px', borderRadius: '8px' }}>
                  <TrendingUp size={20} color="var(--accent-teal)" />
                </div>
                <h3 style={{ fontSize: '1.15rem' }}>Cost Leakage</h3>
              </div>
              <span className="badge badge-success" style={{ fontSize: '0.65rem' }}>
                Optimizable
              </span>
            </div>
            <p style={{ fontSize: '0.9rem', marginBottom: '16px' }}>
              Identify direct money leakages. Disabled staff, inactive mailboxes, and orphaned licenses are costing monthly.
            </p>
            <div className="metric-strip">
              <div className="metric-item">
                <span className="metric-label">Orphaned SKUs</span>
                <span className="metric-val" style={{ color: 'var(--accent-teal)' }}>{tenant.costLeakage.items.find(i => i.category === 'Unassigned Licenses')?.count || 0} Subscriptions</span>
              </div>
              <div className="metric-item">
                <span className="metric-label">Immediate Saving</span>
                <span className="metric-val">{formatCurrency(tenant.costLeakage.items.filter(i => i.category !== 'Underutilized downgrades').reduce((sum, item) => sum + item.monthlyCost, 0))}/mo</span>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.85rem', color: 'var(--accent-blue)', fontWeight: 500, marginTop: '20px' }}>
              <span>Investigate cost leaks</span>
              <ChevronRight size={14} />
            </div>
          </div>

          {/* Card 4: AI Advisory */}
          <div className="glass-card" style={{ cursor: 'pointer' }} onClick={() => onNavigate('ai-summary')}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ background: 'rgba(191, 90, 242, 0.1)', padding: '8px', borderRadius: '8px' }}>
                  <AlertCircle size={20} color="var(--accent-purple)" />
                </div>
                <h3 style={{ fontSize: '1.15rem' }}>AI Advisory</h3>
              </div>
              <span className="badge badge-medium" style={{ fontSize: '0.65rem' }}>
                GPT-4o
              </span>
            </div>
            <p style={{ fontSize: '0.9rem', marginBottom: '16px' }}>
              Generate structured executive summaries, benchmarking, and transition roadmaps matching your tenant structure.
            </p>
            <div className="metric-strip" style={{ display: 'flex', alignItems: 'center', gap: '8px', borderTop: 'none', marginTop: '0', paddingTop: '0' }}>
              <CheckCircle size={16} color="var(--accent-teal)" />
              <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Prioritized roadmap generated</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.85rem', color: 'var(--accent-blue)', fontWeight: 500, marginTop: '20px' }}>
              <span>Read AI Summary</span>
              <ChevronRight size={14} />
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
