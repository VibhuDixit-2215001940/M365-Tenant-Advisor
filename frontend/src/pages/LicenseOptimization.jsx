import React, { useState, useEffect } from 'react';
import { ShieldAlert, ArrowRight, CreditCard, PiggyBank, Sparkles, Check, CheckSquare, Square } from 'lucide-react';

export default function LicenseOptimization({ tenant }) {
  const { currentLicenses, recommendations } = tenant.licensing;
  
  // State to track applied recommendations
  const [appliedRecs, setAppliedRecs] = useState({});
  const [customDowngrades, setCustomDowngrades] = useState(0);
  
  // Max downgradable users is the number of remaining E5 licenses that aren't already recommended for downgrade
  const maxE5Assigned = currentLicenses.find(l => l.skuId === 'M365_E5')?.assigned || 100;
  const recommendedDowngrades = recommendations.find(r => r.type === 'downgrade')?.affectedUsers || 0;
  const maxCustomDowngrades = Math.max(0, maxE5Assigned - recommendedDowngrades);

  useEffect(() => {
    // Reset applied recommendations when tenant changes
    setAppliedRecs({});
    setCustomDowngrades(0);
  }, [tenant]);

  const toggleRecommendation = (id) => {
    setAppliedRecs(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  // Calculate current baseline monthly cost
  const baselineCost = currentLicenses.reduce((sum, lic) => sum + (lic.total * lic.price), 0);

  // Calculate savings from applied recommendations
  const recommendationSavings = recommendations.reduce((sum, rec) => {
    if (appliedRecs[rec.id]) {
      return sum + rec.monthlySavings;
    }
    return sum;
  }, 0);

  // Calculate custom slider savings ($35 difference per E5 user downgraded to Business Premium)
  // E5 = $57, Business Premium = $22. Saving = $35/user/month.
  const customSavingsRate = 35; 
  const customSavings = customDowngrades * customSavingsRate;

  const totalMonthlySavings = recommendationSavings + customSavings;
  const totalAnnualSavings = totalMonthlySavings * 12;

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(val);
  };

  return (
    <div className="fade-in-up">
      <div className="dashboard-hero" style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '2.5rem', marginBottom: '4px' }}>License Optimization</h1>
        <p className="dashboard-subtitle">Optimize subscription plans, downgrade underutilized E5 tiers, and eliminate redundant mailboxes.</p>
      </div>

      <div className="licensing-grid">
        {/* Left Side: SKU distribution and recommendations list */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
          
          {/* Current SKU Distribution Visualizer */}
          <div className="glass-card">
            <h3 style={{ fontSize: '1.25rem', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <CreditCard size={20} color="var(--accent-blue)" />
              Active Subscription Inventory
            </h3>
            
            <div className="sku-list">
              {currentLicenses.map(lic => {
                const assignedPercent = Math.round((lic.assigned / lic.total) * 100);
                return (
                  <div key={lic.skuId} className="sku-row" style={{ display: 'block', padding: '20px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                      <div>
                        <span className="sku-name">{lic.name}</span>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block', marginTop: '2px' }}>
                          {formatCurrency(lic.price)} / user / month
                        </span>
                      </div>
                      <div className="sku-price-count">
                        <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                          Total: <strong style={{ color: 'var(--text-primary)' }}>{lic.total}</strong> | Assigned: <strong style={{ color: 'var(--text-primary)' }}>{lic.assigned}</strong>
                        </span>
                      </div>
                    </div>
                    
                    {/* Linear Progress Bar */}
                    <div style={{ height: '6px', background: 'rgba(255, 255, 255, 0.05)', borderRadius: '3px', overflow: 'hidden', position: 'relative' }}>
                      <div style={{
                        height: '100%',
                        width: `${assignedPercent}%`,
                        background: 'var(--accent-blue)',
                        borderRadius: '3px'
                      }} />
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '6px' }}>
                      <span>Allocation Ratio: {assignedPercent}%</span>
                      <span>{lic.total - lic.assigned} unassigned</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Recommendations List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <h3 style={{ fontSize: '1.25rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Sparkles size={20} color="var(--accent-purple)" />
              Optimization Recommendations
            </h3>

            {recommendations.map(rec => {
              const isApplied = !!appliedRecs[rec.id];
              return (
                <div 
                  key={rec.id} 
                  className="glass-card" 
                  style={{ 
                    borderLeft: isApplied ? '4px solid var(--accent-teal)' : '1px solid var(--border-color)',
                    background: isApplied ? 'rgba(48, 209, 88, 0.02)' : 'var(--bg-card)',
                    padding: '24px'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '20px', marginBottom: '12px' }}>
                    <div style={{ display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
                      <button 
                        onClick={() => toggleRecommendation(rec.id)}
                        style={{ 
                          background: 'none', 
                          border: 'none', 
                          color: isApplied ? 'var(--accent-teal)' : 'var(--text-muted)', 
                          cursor: 'pointer',
                          marginTop: '2px'
                        }}
                      >
                        {isApplied ? <CheckSquare size={22} /> : <Square size={22} />}
                      </button>
                      <div>
                        <h4 style={{ fontSize: '1.1rem', fontWeight: 600, color: isApplied ? 'var(--text-primary)' : 'var(--text-primary)' }}>{rec.title}</h4>
                        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '4px' }}>{rec.description}</p>
                      </div>
                    </div>
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <span style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--accent-teal)', display: 'block' }}>
                        +{formatCurrency(rec.monthlySavings)}<span style={{ fontSize: '0.8rem', fontWeight: 500, color: 'var(--text-secondary)' }}>/mo</span>
                      </span>
                      <span className="badge badge-low" style={{ fontSize: '0.65rem', marginTop: '6px' }}>
                        Diff: {rec.difficulty}
                      </span>
                    </div>
                  </div>

                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center', 
                    background: 'rgba(255, 255, 255, 0.02)',
                    borderRadius: '8px',
                    padding: '10px 16px',
                    fontSize: '0.8rem',
                    border: '1px solid rgba(255, 255, 255, 0.04)'
                  }}>
                    <span>Affected Seats: <strong>{rec.affectedUsers} users</strong></span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      {rec.currentSku} <ArrowRight size={12} /> {rec.targetSku === 'None' ? 'De-provision' : rec.targetSku}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

        </div>

        {/* Right Side: Interactive Savings Calculator */}
        <div style={{ position: 'sticky', top: '100px' }}>
          <div className="glass-card" style={{ border: '1px dashed var(--accent-teal)' }}>
            <h3 style={{ fontSize: '1.25rem', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <PiggyBank size={20} color="var(--accent-teal)" />
              Simulation Calculator
            </h3>

            <div className="calc-container">
              {maxCustomDowngrades > 0 && (
                <div className="calc-slider-group">
                  <div className="slider-labels">
                    <span>Downgrade Additional E5 Users</span>
                    <span style={{ fontWeight: 600 }}>{customDowngrades} / {maxCustomDowngrades}</span>
                  </div>
                  <input 
                    type="range"
                    min="0"
                    max={maxCustomDowngrades}
                    value={customDowngrades}
                    onChange={(e) => setCustomDowngrades(parseInt(e.target.value))}
                    className="range-input"
                  />
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                    Downgrading E5 to Business Premium saves $35/user/month.
                  </span>
                </div>
              )}

              <div style={{ borderTop: '1px solid rgba(255, 255, 255, 0.06)', paddingTop: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Baseline Cost</span>
                  <span>{formatCurrency(baselineCost)}/mo</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Recommendation Actions</span>
                  <span style={{ color: 'var(--accent-teal)' }}>-{formatCurrency(recommendationSavings)}/mo</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Custom Simulation Downgrades</span>
                  <span style={{ color: 'var(--accent-teal)' }}>-{formatCurrency(customSavings)}/mo</span>
                </div>
              </div>

              <div className="calc-result-box">
                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase' }}>Target Monthly Savings</span>
                <div className="calc-savings-value">{formatCurrency(totalMonthlySavings)}</div>
                
                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block', marginTop: '12px' }}>
                  Target Annual Reduction: <strong style={{ color: 'var(--accent-teal)' }}>{formatCurrency(totalAnnualSavings)}</strong>
                </span>
              </div>

              <button 
                className="btn-primary" 
                style={{ width: '100%', justifyContent: 'center', marginTop: '10px' }}
                onClick={() => {
                  alert(`Successfully drafted configuration updates. Recommended monthly savings: ${formatCurrency(totalMonthlySavings)}. Prepare transition documentation.`);
                }}
              >
                Draft Optimization Plan
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
