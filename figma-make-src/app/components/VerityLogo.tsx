import React from 'react';

interface VerityLogoProps {
  variant?: 'full' | 'symbol' | 'wordmark';
  size?: 'small' | 'medium' | 'large' | 'custom';
  customSize?: number;
  darkMode?: boolean;
  inverted?: boolean; // for use on colored backgrounds
}

export function VerityLogo({ 
  variant = 'full', 
  size = 'medium',
  customSize,
  darkMode = false,
  inverted = false
}: VerityLogoProps) {
  // Size mappings
  const sizeMap = {
    small: 16,
    medium: 32,
    large: 64
  };

  const symbolSize = size === 'custom' ? customSize : sizeMap[size];
  const wordmarkHeight = symbolSize ? symbolSize * 0.65 : 32;

  // Color selection
  const getPrimaryColor = () => {
    if (inverted) return '#ffffff';
    if (darkMode) return '#14b8a6'; // Lighter teal for dark mode
    return '#0D9488'; // Primary teal
  };

  const getTextColor = () => {
    if (inverted) return '#ffffff';
    if (darkMode) return '#f1f5f9';
    return '#1e293b';
  };

  const primaryColor = getPrimaryColor();
  const textColor = getTextColor();

  // Symbol Component
  const Symbol = ({ size }: { size: number }) => (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 100 100" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* The V with grounded baseline */}
      {/* Horizontal ground/baseline */}
      <rect 
        x="20" 
        y="75" 
        width="60" 
        height="4" 
        fill={primaryColor}
        opacity="0.4"
      />
      
      {/* Left stroke of V */}
      <path 
        d="M 26 25 L 46 70 L 54 70 L 34 25 Z" 
        fill={primaryColor}
      />
      
      {/* Right stroke of V */}
      <path 
        d="M 74 25 L 54 70 L 46 70 L 66 25 Z" 
        fill={primaryColor}
      />
      
      {/* Subtle focal point at the apex */}
      <circle 
        cx="50" 
        cy="67" 
        r="2.5" 
        fill={primaryColor}
        opacity="0.6"
      />
      
      {/* Ground anchor points */}
      <rect 
        x="23" 
        y="75" 
        width="2" 
        height="8" 
        fill={primaryColor}
        opacity="0.3"
      />
      <rect 
        x="75" 
        y="75" 
        width="2" 
        height="8" 
        fill={primaryColor}
        opacity="0.3"
      />
    </svg>
  );

  // Wordmark Component
  const Wordmark = ({ height }: { height: number }) => {
    const fontSize = height;
    
    return (
      <div 
        style={{ 
          fontFamily: 'Crimson Pro, serif',
          fontSize: `${fontSize}px`,
          fontWeight: 500,
          letterSpacing: '0.02em',
          color: textColor,
          lineHeight: 1
        }}
      >
        Verity
      </div>
    );
  };

  // Render based on variant
  if (variant === 'symbol') {
    return <Symbol size={symbolSize || 32} />;
  }

  if (variant === 'wordmark') {
    return <Wordmark height={wordmarkHeight} />;
  }

  // Full logo (symbol + wordmark)
  return (
    <div className="flex items-center gap-3">
      <Symbol size={symbolSize || 32} />
      <Wordmark height={wordmarkHeight} />
    </div>
  );
}
