import React from 'react';

interface LogoProps {
  variant?: 'full' | 'symbol' | 'wordmark';
  size?: 'small' | 'medium' | 'large' | 'custom';
  customSize?: number;
  darkMode?: boolean;
  inverted?: boolean;
}

export function GeometricMinimal({ 
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
      {/* Two triangular shapes forming a V with negative space */}
      {/* Left triangle */}
      <path 
        d="M 20 20 L 20 50 L 45 70 L 45 40 Z" 
        fill={primaryColor}
      />
      
      {/* Right triangle */}
      <path 
        d="M 80 20 L 80 50 L 55 70 L 55 40 Z" 
        fill={primaryColor}
      />
      
      {/* Central focus point - subtle circle */}
      <circle 
        cx="50" 
        cy="55" 
        r="3" 
        fill={primaryColor}
        opacity="0.5"
      />
      
      {/* Bottom stabilizing element */}
      <rect 
        x="35" 
        y="75" 
        width="30" 
        height="2" 
        fill={primaryColor}
        opacity="0.3"
      />
    </svg>
  );

  const Wordmark = ({ height }: { height: number }) => (
    <div 
      style={{ 
        fontFamily: 'Inter, sans-serif',
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
