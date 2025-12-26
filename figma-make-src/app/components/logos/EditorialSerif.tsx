import React from 'react';

interface LogoProps {
  variant?: 'full' | 'symbol' | 'wordmark';
  size?: 'small' | 'medium' | 'large' | 'custom';
  customSize?: number;
  darkMode?: boolean;
  inverted?: boolean;
}

export function EditorialSerif({ 
  variant = 'full', 
  size = 'medium',
  customSize,
  darkMode = false,
  inverted = false
}: LogoProps) {
  const sizeMap = {
    small: 32,
    medium: 48,
    large: 84
  };

  const symbolSize = size === 'custom' ? customSize : sizeMap[size];
  const wordmarkHeight = symbolSize ? symbolSize * 0.7 : 32;

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

  // For pure editorial serif, the symbol is a decorative V initial
  const Symbol = ({ size }: { size: number }) => (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 100 100" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Decorative V with serif details */}
      <path 
        d="M 15 20 L 25 20 L 25 22 L 20 22 L 45 75 L 50 75 L 75 22 L 70 22 L 70 20 L 85 20 L 85 22 L 80 22 L 50 85 L 45 85 L 15 22 Z" 
        fill={textColor}
      />
      
      {/* Subtle teal accent bar */}
      <rect 
        x="35" 
        y="78" 
        width="30" 
        height="1.5" 
        fill={primaryColor}
      />
    </svg>
  );

  const Wordmark = ({ height }: { height: number }) => (
    <div 
      style={{ 
        fontFamily: 'DM Serif Display, serif',
        fontSize: `${height}px`,
        fontWeight: 400,
        letterSpacing: '-0.01em',
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

  return <Wordmark height={wordmarkHeight} />;
}
