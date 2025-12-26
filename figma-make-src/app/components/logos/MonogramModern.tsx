import React from 'react';

interface LogoProps {
  variant?: 'full' | 'symbol' | 'wordmark';
  size?: 'small' | 'medium' | 'large' | 'custom';
  customSize?: number;
  darkMode?: boolean;
  inverted?: boolean;
}

export function MonogramModern({ 
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
      {/* Bold, confident V monogram with subtle architectural details */}
      
      {/* Main V structure - thick and ownable */}
      <path 
        d="M 20 15 L 42 70 L 50 70 L 50 65 L 45 65 L 28 20 L 20 15 Z" 
        fill={primaryColor}
      />
      
      <path 
        d="M 80 15 L 58 70 L 50 70 L 50 65 L 55 65 L 72 20 L 80 15 Z" 
        fill={primaryColor}
      />
      
      {/* Central spine - architectural detail */}
      <rect 
        x="48" 
        y="60" 
        width="4" 
        height="25" 
        fill={primaryColor}
      />
      
      {/* Base platform */}
      <rect 
        x="35" 
        y="82" 
        width="30" 
        height="3" 
        fill={primaryColor}
      />
      
      {/* Subtle notches at top for character */}
      <circle 
        cx="28" 
        cy="20" 
        r="2" 
        fill={primaryColor}
        opacity="0.5"
      />
      <circle 
        cx="72" 
        cy="20" 
        r="2" 
        fill={primaryColor}
        opacity="0.5"
      />
    </svg>
  );

  const Wordmark = ({ height }: { height: number }) => (
    <div 
      style={{ 
        fontFamily: 'Fraunces, serif',
        fontSize: `${height}px`,
        fontWeight: 600,
        letterSpacing: '-0.01em',
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
