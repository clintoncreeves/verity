import React from 'react';

interface LogoProps {
  variant?: 'full' | 'symbol' | 'wordmark';
  size?: 'small' | 'medium' | 'large' | 'custom';
  customSize?: number;
  darkMode?: boolean;
  inverted?: boolean;
}

export function Intersection({ 
  variant = 'full', 
  size = 'medium',
  customSize,
  darkMode = false,
  inverted = false
}: LogoProps) {
  const sizeMap = {
    small: 28,
    medium: 40,
    large: 72
  };

  const symbolSize = size === 'custom' ? customSize : sizeMap[size];
  const wordmarkHeight = symbolSize ? symbolSize * 0.5 : 24;

  const getPrimaryColor = () => {
    if (inverted) return '#ffffff';
    if (darkMode) return '#14b8a6';
    return '#0D9488';
  };

  const getSecondaryColor = () => {
    if (inverted) return 'rgba(255, 255, 255, 0.5)';
    if (darkMode) return '#64748b';
    return '#64748b';
  };

  const getTextColor = () => {
    if (inverted) return '#ffffff';
    if (darkMode) return '#f1f5f9';
    return '#1e293b';
  };

  const primaryColor = getPrimaryColor();
  const secondaryColor = getSecondaryColor();
  const textColor = getTextColor();

  const Symbol = ({ size }: { size: number }) => (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 100 100" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Two clean lines meeting - evidence meets claim */}
      
      {/* Descending line (claim/statement) */}
      <line 
        x1="30" 
        y1="20" 
        x2="50" 
        y2="60" 
        stroke={secondaryColor}
        strokeWidth="4"
        strokeLinecap="round"
      />
      
      {/* Ascending line (evidence/verification) */}
      <line 
        x1="70" 
        y1="20" 
        x2="50" 
        y2="60" 
        stroke={primaryColor}
        strokeWidth="4"
        strokeLinecap="round"
      />
      
      {/* Intersection point - moment of verification */}
      <circle 
        cx="50" 
        cy="60" 
        r="5" 
        fill={primaryColor}
      />
      
      {/* Resulting verified line continuing down */}
      <line 
        x1="50" 
        y1="60" 
        x2="50" 
        y2="80" 
        stroke={primaryColor}
        strokeWidth="4"
        strokeLinecap="round"
      />
      
      {/* Grounding element */}
      <rect 
        x="45" 
        y="80" 
        width="10" 
        height="2" 
        fill={primaryColor}
        opacity="0.4"
      />
    </svg>
  );

  const Wordmark = ({ height }: { height: number }) => (
    <div 
      style={{ 
        fontFamily: 'Crimson Pro, serif',
        fontSize: `${height}px`,
        fontWeight: 500,
        letterSpacing: '0.01em',
        color: textColor,
        lineHeight: 1
      }}
    >
      Verity
    </div>
  );

  if (variant === 'symbol') {
    return <Symbol size={symbolSize || 40} />;
  }

  if (variant === 'wordmark') {
    return <Wordmark height={wordmarkHeight} />;
  }

  return (
    <div className="flex items-center gap-3">
      <Symbol size={symbolSize || 40} />
      <Wordmark height={wordmarkHeight} />
    </div>
  );
}
