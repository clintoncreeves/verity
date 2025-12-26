import React from 'react';

interface LogoProps {
  variant?: 'full' | 'symbol' | 'wordmark';
  size?: 'small' | 'medium' | 'large' | 'custom';
  customSize?: number;
  darkMode?: boolean;
  inverted?: boolean;
}

// Team Editorial: Context is Content
// Refined serif wordmark with subtle typographic mark
export function ProposalD({ 
  variant = 'full', 
  size = 'medium',
  customSize,
  darkMode = false,
  inverted = false
}: LogoProps) {
  const sizeMap = {
    small: 32,
    medium: 52,
    large: 88
  };

  const symbolSize = size === 'custom' ? customSize : sizeMap[size];
  const wordmarkHeight = symbolSize ? symbolSize * 0.65 : 32;

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

  // Subtle typographic mark - just a refined underscore/baseline
  const Symbol = ({ size }: { size: number }) => (
    <svg 
      width={size} 
      height={size * 0.3} 
      viewBox="0 0 100 30" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Simple baseline mark */}
      <line 
        x1="10" 
        y1="15" 
        x2="90" 
        y2="15" 
        stroke={primaryColor}
        strokeWidth="2.5"
        strokeLinecap="round"
      />
    </svg>
  );

  const Wordmark = ({ height }: { height: number }) => (
    <div className="relative">
      <div 
        style={{ 
          fontFamily: 'EB Garamond, serif',
          fontSize: `${height}px`,
          fontWeight: 500,
          letterSpacing: '0.01em',
          color: textColor,
          lineHeight: 1
        }}
      >
        Verity
      </div>
      {/* Subtle accent mark underneath the V */}
      <div 
        style={{
          position: 'absolute',
          bottom: '-4px',
          left: '0',
          width: `${height * 0.35}px`,
          height: '2px',
          backgroundColor: primaryColor,
          opacity: 0.6
        }}
      />
    </div>
  );

  if (variant === 'symbol') {
    return <Symbol size={symbolSize || 52} />;
  }

  if (variant === 'wordmark') {
    return <Wordmark height={wordmarkHeight} />;
  }

  return <Wordmark height={wordmarkHeight} />;
}
