import React from 'react';

interface LogoProps {
  variant?: 'full' | 'symbol' | 'wordmark';
  size?: 'small' | 'medium' | 'large' | 'custom';
  customSize?: number;
  darkMode?: boolean;
  inverted?: boolean;
}

export function FocalAperture({ 
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
      {/* Outer circle - the lens */}
      <circle 
        cx="50" 
        cy="50" 
        r="35" 
        stroke={primaryColor}
        strokeWidth="3"
        fill="none"
      />
      
      {/* Aperture blades forming a V in negative space */}
      {/* Top left blade */}
      <path 
        d="M 50 50 L 25 20 L 35 20 L 50 40 Z" 
        fill={primaryColor}
        opacity="0.25"
      />
      
      {/* Top right blade */}
      <path 
        d="M 50 50 L 75 20 L 65 20 L 50 40 Z" 
        fill={primaryColor}
        opacity="0.25"
      />
      
      {/* Bottom blades creating depth */}
      <path 
        d="M 50 50 L 20 70 L 25 80 L 50 60 Z" 
        fill={primaryColor}
        opacity="0.15"
      />
      
      <path 
        d="M 50 50 L 80 70 L 75 80 L 50 60 Z" 
        fill={primaryColor}
        opacity="0.15"
      />
      
      {/* Central focal point */}
      <circle 
        cx="50" 
        cy="50" 
        r="4" 
        fill={primaryColor}
      />
      
      {/* Inner circle suggesting depth of field */}
      <circle 
        cx="50" 
        cy="50" 
        r="15" 
        stroke={primaryColor}
        strokeWidth="1.5"
        fill="none"
        opacity="0.3"
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
