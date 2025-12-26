import React from 'react';

interface LogoProps {
  variant?: 'full' | 'symbol' | 'wordmark';
  size?: 'small' | 'medium' | 'large' | 'custom';
  customSize?: number;
  darkMode?: boolean;
  inverted?: boolean;
}

// Team Essence: Idea Before Image
// Two strokes converging at precise point - claim aligns with evidence
export function ProposalC({ 
  variant = 'full', 
  size = 'medium',
  customSize,
  darkMode = false,
  inverted = false
}: LogoProps) {
  const sizeMap = {
    small: 28,
    medium: 48,
    large: 80
  };

  const symbolSize = size === 'custom' ? customSize : sizeMap[size];
  const wordmarkHeight = symbolSize ? symbolSize * 0.45 : 24;

  const getPrimaryColor = () => {
    if (inverted) return '#ffffff';
    if (darkMode) return '#14b8a6';
    return '#0D9488';
  };

  const getTextColor = () => {
    if (inverted) return '#ffffff';
    if (darkMode) return '#f1f5f9';
    return '#1e293b';
  };

  const primaryColor = getPrimaryColor();
  const textColor = getTextColor();

  const Symbol = ({ size }: { size: number }) => (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 100 100" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Left descending line (claim) */}
      <line 
        x1="35" 
        y1="25" 
        x2="50" 
        y2="50" 
        stroke={textColor}
        strokeWidth="3"
        strokeLinecap="round"
      />
      
      {/* Right descending line (evidence) */}
      <line 
        x1="65" 
        y1="25" 
        x2="50" 
        y2="50" 
        stroke={primaryColor}
        strokeWidth="3"
        strokeLinecap="round"
      />
      
      {/* Point of alignment */}
      <circle 
        cx="50" 
        cy="50" 
        r="3.5" 
        fill={primaryColor}
      />
      
      {/* Verified truth continuing down */}
      <line 
        x1="50" 
        y1="50" 
        x2="50" 
        y2="75" 
        stroke={primaryColor}
        strokeWidth="3"
        strokeLinecap="round"
      />
    </svg>
  );

  const Wordmark = ({ height }: { height: number }) => (
    <div 
      style={{ 
        fontFamily: 'Crimson Pro, serif',
        fontSize: `${height}px`,
        fontWeight: 400,
        letterSpacing: '0.02em',
        color: textColor,
        lineHeight: 1
      }}
    >
      Verity
    </div>
  );

  if (variant === 'symbol') {
    return <Symbol size={symbolSize || 48} />;
  }

  if (variant === 'wordmark') {
    return <Wordmark height={wordmarkHeight} />;
  }

  return (
    <div className="flex items-center gap-4">
      <Symbol size={symbolSize || 48} />
      <Wordmark height={wordmarkHeight} />
    </div>
  );
}
