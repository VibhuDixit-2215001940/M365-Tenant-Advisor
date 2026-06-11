import React, { useState, useEffect } from 'react';
import { Cpu, Printer, Sparkles, AlertCircle, ArrowDownToLine, CheckCircle2 } from 'lucide-react';

export default function AISummary({ tenant }) {
  const { overallHealth, costAnalysis, securityAnalysis, recommendations } = tenant.aiSummary;
  
  // Simulated typewriter loading effect
  const [displayedText, setDisplayedText] = useState({
    health: '',
    cost: '',
    security: '',
    recsLoaded: false
  });
  
  const [isTyping, setIsTyping] = useState(true);

  useEffect(() => {
    // Reset typing state on tenant change
    setIsTyping(true);
    setDisplayedText({
      health: '',
      cost: '',
      security: '',
      recsLoaded: false
    });

    let healthTimer, costTimer, securityTimer, recsTimer;

    // Phase 1: Type Health Summary
    let currentHealth = '';
    let healthWords = overallHealth.split(' ');
    let wordIndex = 0;
    
    healthTimer = setInterval(() => {
      if (wordIndex < healthWords.length) {
        currentHealth += (wordIndex === 0 ? '' : ' ') + healthWords[wordIndex];
        setDisplayedText(prev => ({ ...prev, health: currentHealth }));
        wordIndex++;
      } else {
        clearInterval(healthTimer);
        
        // Phase 2: Type Cost Analysis
        let currentCost = '';
        let costWords = costAnalysis.split(' ');
        let costWordIndex = 0;
        
        costTimer = setInterval(() => {
          if (costWordIndex < costWords.length) {
            currentCost += (costWordIndex === 0 ? '' : ' ') + costWords[costWordIndex];
            setDisplayedText(prev => ({ ...prev, cost: currentCost }));
            costWordIndex++;
          } else {
            clearInterval(costTimer);
            
            // Phase 3: Type Security Analysis
            let currentSec = '';
            let secWords = securityAnalysis.split(' ');
            let secWordIndex = 0;
            
            securityTimer = setInterval(() => {
              if (secWordIndex < secWords.length) {
                currentSec += (secWordIndex === 0 ? '' : ' ') + secWords[secWordIndex];
                setDisplayedText(prev => ({ ...prev, security: currentSec }));
                secWordIndex++;
              } else {
                clearInterval(securityTimer);
                setIsTyping(false);
                
                // Phase 4: Load Recommendations
                recsTimer = setTimeout(() => {
                  setDisplayedText(prev => ({ ...prev, recsLoaded: true }));
                }, 400);
              }
            }, 8); // Speedy typing
          }
        }, 8);
      }
    }, 8);

    return () => {
      clearInterval(healthTimer);
      clearInterval(costTimer);
      clearInterval(securityTimer);
      clearTimeout(recsTimer);
    };
  }, [tenant, overallHealth, costAnalysis, securityAnalysis]);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fade-in-up">
      {/* Page Header */}
      <div className="ai-summary-header">
        <div>
          <h1 style={{ fontSize: '2.5rem', marginBottom: '4px' }}>AI Advisory Report</h1>
          <p className="dashboard-subtitle">Generative executive analysis powered by Azure OpenAI services.</p>
        </div>

        <div style={{ display: 'flex', gap: '12px' }}>
          <button className="btn-secondary" onClick={handlePrint}>
            <Printer size={16} />
            <span>Print Report</span>
          </button>
          
          <button 
            className="btn-primary"
            onClick={() => {
              alert("Exporting advisory report as PDF. Preparing components...");
            }}
          >
            <ArrowDownToLine size={16} />
            <span>Export PDF</span>
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '32px', alignItems: 'start' }}>
        
        {/* Left: AI Narrative Content */}
        <div className="glass-card" style={{ padding: '40px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px', borderBottom: '1px solid var(--border-color)', paddingBottom: '20px' }}>
            <div className="ai-meta">
              <Cpu size={18} color="var(--accent-purple)" />
              <span>Engine: <strong style={{ color: 'var(--text-primary)' }}>GPT-4o (Azure OpenAI)</strong></span>
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span className="dot" style={{ backgroundColor: isTyping ? 'var(--accent-purple)' : 'var(--accent-teal)', animation: isTyping ? 'pulse 1s infinite' : 'none' }} />
              <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                {isTyping ? 'Synthesizing recommendations...' : 'Analysis Active'}
              </span>
            </div>
          </div>

          <div className="ai-narrative">
            <div>
              <h3 style={{ fontSize: '1.25rem', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Sparkles size={16} color="var(--accent-purple)" />
                Executive Summary
              </h3>
              <p style={{ fontSize: '1rem', lineHeight: '1.7', color: 'var(--text-primary)' }}>
                {displayedText.health}
                {isTyping && !displayedText.cost && <span className="typewriter-cursor">|</span>}
              </p>
            </div>

            {displayedText.cost && (
              <div style={{ marginTop: '24px' }}>
                <h3 style={{ fontSize: '1.25rem', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <AlertCircle size={16} color="var(--accent-orange)" />
                  Licensing & Cost Audit
                </h3>
                <p style={{ fontSize: '1rem', lineHeight: '1.7', color: 'var(--text-primary)' }}>
                  {displayedText.cost}
                  {isTyping && !displayedText.security && <span className="typewriter-cursor">|</span>}
                </p>
              </div>
            )}

            {displayedText.security && (
              <div style={{ marginTop: '24px' }}>
                <h3 style={{ fontSize: '1.25rem', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <AlertCircle size={16} color="var(--accent-red)" />
                  Security Configuration Review
                </h3>
                <p style={{ fontSize: '1rem', lineHeight: '1.7', color: 'var(--text-primary)' }}>
                  {displayedText.security}
                  {isTyping && <span className="typewriter-cursor">|</span>}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Right: Prioritized Recommendations Roadmap */}
        <div style={{ position: 'sticky', top: '100px' }}>
          <div className="glass-card" style={{ padding: '28px' }}>
            <h3 style={{ fontSize: '1.15rem', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <CheckCircle2 size={18} color="var(--accent-teal)" />
              Prioritized Action Plan
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {displayedText.recsLoaded ? (
                recommendations.map((rec, index) => (
                  <div 
                    key={index}
                    className="fade-in-up"
                    style={{ 
                      padding: '16px', 
                      background: 'rgba(255, 255, 255, 0.02)', 
                      borderRadius: '10px', 
                      border: '1px solid var(--border-color)',
                      fontSize: '0.85rem',
                      lineHeight: '1.5',
                      animationDelay: `${index * 150}ms`
                    }}
                  >
                    {rec}
                  </div>
                ))
              ) : (
                <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                  {isTyping ? 'Generating action steps...' : 'Waiting for core analysis...'}
                </div>
              )}
            </div>
          </div>
        </div>

      </div>

      <style>{`
        .typewriter-cursor {
          display: inline-block;
          width: 2px;
          background-color: var(--accent-purple);
          margin-left: 4px;
          animation: blink 0.8s infinite;
        }
        @keyframes blink {
          50% { opacity: 0; }
        }
        @keyframes pulse {
          0% { transform: scale(0.9); opacity: 0.5; }
          50% { transform: scale(1.1); opacity: 1; }
          100% { transform: scale(0.9); opacity: 0.5; }
        }
      `}</style>
    </div>
  );
}
