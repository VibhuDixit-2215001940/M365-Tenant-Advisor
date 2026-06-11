import React, { useState, useEffect } from 'react';

export default function ScoreGauge({ score = 0 }) {
  const [displayValue, setDisplayValue] = useState(0);
  const size = 180;
  const strokeWidth = 12;
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;

  useEffect(() => {
    // Count up animation
    let start = 0;
    const duration = 1200; // ms
    const increment = score / (duration / 16); // ~60fps
    
    const timer = setInterval(() => {
      start += increment;
      if (start >= score) {
        setDisplayValue(score);
        clearInterval(timer);
      } else {
        setDisplayValue(Math.floor(start));
      }
    }, 16);

    return () => clearInterval(timer);
  }, [score]);

  // Dashoffset calculation
  const strokeDashoffset = circumference - (displayValue / 100) * circumference;

  // Determine color based on score
  let strokeColor = 'var(--accent-red)';
  if (displayValue >= 80) {
    strokeColor = 'var(--accent-teal)';
  } else if (displayValue >= 60) {
    strokeColor = 'var(--accent-orange)';
  }

  return (
    <div className="score-gauge-container" style={{ position: 'relative', width: size, height: size }}>
      <svg className="gauge-svg" width={size} height={size}>
        <circle
          className="gauge-bg"
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={strokeWidth}
        />
        <circle
          className="gauge-fill"
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          stroke={strokeColor}
        />
      </svg>
      <div className="gauge-text">
        <span className="gauge-val" style={{ color: strokeColor }}>{displayValue}</span>
        <span className="gauge-lbl">HEALTH SCORE</span>
      </div>
    </div>
  );
}
