import React, { useState, useEffect } from 'react';
import { Shield, ShieldCheck, ShieldAlert, Check, RefreshCw } from 'lucide-react';

export default function SecurityAnalysis({ tenant }) {
  const { score: baseScore, findings } = tenant.security;
  
  // State to track resolved findings
  const [resolvedFindings, setResolvedFindings] = useState({});
  const [currentScore, setCurrentScore] = useState(baseScore);

  useEffect(() => {
    // Reset state on tenant switch
    setResolvedFindings({});
    setCurrentScore(baseScore);
  }, [tenant, baseScore]);

  const toggleResolveFinding = (id, severity) => {
    const isNowResolved = !resolvedFindings[id];
    
    // Update resolved status
    setResolvedFindings(prev => ({
      ...prev,
      [id]: isNowResolved
    }));

    // Calculate score change
    let scoreDelta = 0;
    if (severity === 'Critical') scoreDelta = 15;
    else if (severity === 'High') scoreDelta = 10;
    else if (severity === 'Medium') scoreDelta = 6;
    else if (severity === 'Low') scoreDelta = 3;

    setCurrentScore(prev => {
      const nextScore = isNowResolved ? prev + scoreDelta : prev - scoreDelta;
      return Math.min(100, Math.max(0, nextScore));
    });
  };

  const activeFindings = findings.filter(f => !resolvedFindings[f.id]);
  const solvedCount = Object.values(resolvedFindings).filter(Boolean).length;

  return (
    <div className="fade-in-up">
      {/* Page Header */}
      <div className="dashboard-hero" style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '2.5rem', marginBottom: '4px' }}>Security Analysis</h1>
        <p className="dashboard-subtitle">Audit authentication rules, administrative access permissions, and app permissions integration.</p>
      </div>

      {/* Security Overview Grid */}
      <div className="dashboard-grid" style={{ marginBottom: '40px' }}>
        {/* Left: Security Score Visual */}
        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '130px', height: '130px' }}>
            <div style={{
              position: 'absolute',
              width: '100%',
              height: '100%',
              borderRadius: '50%',
              border: `6px solid ${currentScore >= 80 ? 'rgba(48, 209, 88, 0.1)' : 'rgba(255, 159, 10, 0.1)'}`,
            }} />
            <div style={{
              position: 'absolute',
              width: '100%',
              height: '100%',
              borderRadius: '50%',
              border: `6px solid ${currentScore >= 80 ? 'var(--accent-teal)' : currentScore >= 60 ? 'var(--accent-orange)' : 'var(--accent-red)'}`,
              borderTopColor: 'transparent',
              borderLeftColor: 'transparent',
              transform: `rotate(${(currentScore / 100) * 360 - 90}deg)`,
              transition: 'transform 0.8s var(--ease-apple), border-color 0.4s ease'
            }} />
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <span style={{ fontSize: '2.4rem', fontWeight: 800, fontFamily: 'var(--font-display)', color: currentScore >= 80 ? 'var(--accent-teal)' : currentScore >= 60 ? 'var(--accent-orange)' : 'var(--accent-red)' }}>
                {currentScore}
              </span>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600 }}>POSTURE</span>
            </div>
          </div>

          <h4 style={{ fontSize: '1.2rem', marginTop: '20px', marginBottom: '6px' }}>
            {currentScore >= 80 ? 'Robust Security' : currentScore >= 60 ? 'Needs Attention' : 'Critical Risks'}
          </h4>
          <p style={{ fontSize: '0.85rem' }}>
            {activeFindings.length === 0 
              ? 'All audited security vulnerabilities resolved!' 
              : `Found ${activeFindings.length} open issues needing remediation.`}
          </p>
        </div>

        {/* Right: Security stats breakdown */}
        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '20px' }}>
          <h3 style={{ fontSize: '1.15rem' }}>Audit Severity Breakdown</h3>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
            <div style={{ background: 'rgba(255, 69, 58, 0.04)', border: '1px solid rgba(255, 69, 58, 0.1)', borderRadius: '12px', padding: '16px', textAlign: 'center' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--accent-red)', display: 'block', fontWeight: 600 }}>Critical</span>
              <span style={{ fontSize: '1.8rem', fontWeight: 800, fontFamily: 'var(--font-display)', marginTop: '4px', display: 'block' }}>
                {findings.filter(f => f.severity === 'Critical' && !resolvedFindings[f.id]).length}
              </span>
            </div>
            
            <div style={{ background: 'rgba(255, 159, 10, 0.04)', border: '1px solid rgba(255, 159, 10, 0.1)', borderRadius: '12px', padding: '16px', textAlign: 'center' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--accent-orange)', display: 'block', fontWeight: 600 }}>High</span>
              <span style={{ fontSize: '1.8rem', fontWeight: 800, fontFamily: 'var(--font-display)', marginTop: '4px', display: 'block' }}>
                {findings.filter(f => f.severity === 'High' && !resolvedFindings[f.id]).length}
              </span>
            </div>

            <div style={{ background: 'rgba(191, 90, 242, 0.04)', border: '1px solid rgba(191, 90, 242, 0.1)', borderRadius: '12px', padding: '16px', textAlign: 'center' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--accent-purple)', display: 'block', fontWeight: 600 }}>Medium</span>
              <span style={{ fontSize: '1.8rem', fontWeight: 800, fontFamily: 'var(--font-display)', marginTop: '4px', display: 'block' }}>
                {findings.filter(f => f.severity === 'Medium' && !resolvedFindings[f.id]).length}
              </span>
            </div>

            <div style={{ background: 'rgba(0, 113, 227, 0.04)', border: '1px solid rgba(0, 113, 227, 0.1)', borderRadius: '12px', padding: '16px', textAlign: 'center' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--accent-blue)', display: 'block', fontWeight: 600 }}>Low</span>
              <span style={{ fontSize: '1.8rem', fontWeight: 800, fontFamily: 'var(--font-display)', marginTop: '4px', display: 'block' }}>
                {findings.filter(f => f.severity === 'Low' && !resolvedFindings[f.id]).length}
              </span>
            </div>
          </div>
          
          {solvedCount > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--accent-teal)', fontSize: '0.9rem', fontWeight: 500 }}>
              <ShieldCheck size={16} />
              <span>Simulated remediation of {solvedCount} items. Net score improved by +{currentScore - baseScore} points.</span>
            </div>
          )}
        </div>
      </div>

      {/* Findings List */}
      <div className="findings-container">
        <h3 style={{ fontSize: '1.25rem', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Shield size={20} color="var(--accent-blue)" />
          Vulnerability Audit Log
        </h3>

        {findings.map(finding => {
          const isResolved = !!resolvedFindings[finding.id];
          const severityClass = `badge-${finding.severity.toLowerCase()}`;
          
          return (
            <div 
              key={finding.id} 
              className="finding-card" 
              style={{
                opacity: isResolved ? 0.55 : 1,
                borderLeft: isResolved ? '4px solid var(--accent-teal)' : `3px solid var(--accent-${finding.severity === 'Critical' ? 'red' : finding.severity === 'High' ? 'orange' : finding.severity === 'Medium' ? 'purple' : 'blue'})`,
                background: isResolved ? 'rgba(48, 209, 88, 0.01)' : 'var(--bg-card)',
                transition: 'all 0.4s var(--ease-apple)'
              }}
            >
              <div className="finding-header">
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span className={`badge ${severityClass}`}>{finding.severity}</span>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{finding.category}</span>
                  </div>
                  <h4 style={{ 
                    fontSize: '1.15rem', 
                    fontWeight: 600, 
                    marginTop: '4px',
                    textDecoration: isResolved ? 'line-through' : 'none'
                  }}>
                    {finding.title}
                  </h4>
                </div>

                <button 
                  className={isResolved ? 'btn-secondary' : 'btn-primary'}
                  style={{ 
                    padding: '8px 16px', 
                    fontSize: '0.8rem', 
                    borderRadius: '8px',
                    background: isResolved ? 'rgba(48, 209, 88, 0.1)' : undefined,
                    color: isResolved ? 'var(--accent-teal)' : undefined,
                    borderColor: isResolved ? 'rgba(48, 209, 88, 0.2)' : undefined,
                  }}
                  onClick={() => toggleResolveFinding(finding.id, finding.severity)}
                >
                  {isResolved ? (
                    <>
                      <Check size={14} />
                      <span>Remediation Sim</span>
                    </>
                  ) : (
                    <span>Simulate Fix</span>
                  )}
                </button>
              </div>

              {!isResolved && (
                <>
                  <p className="finding-desc">{finding.description}</p>
                  
                  <div className="finding-details">
                    <div>
                      <span className="details-label">Security Threat Impact:</span>
                      <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '2px' }}>{finding.impact}</p>
                    </div>
                    <div style={{ marginTop: '8px', borderTop: '1px solid rgba(255, 255, 255, 0.05)', paddingTop: '8px' }}>
                      <span className="details-label" style={{ color: 'var(--accent-teal)' }}>Remediation Instructions:</span>
                      <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '2px' }}>{finding.remediation}</p>
                    </div>
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
