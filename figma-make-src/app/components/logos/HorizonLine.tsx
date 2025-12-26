import React from 'react';

interface LogoProps {
  variant?: 'full' | 'symbol' | 'wordmark';
  size?: 'small' | 'medium' | 'large' | 'custom';
  customSize?: number;
  darkMode?: boolean;
  inverted?: boolean;
}

export function HorizonLine({ 
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
      {/* Strong horizontal ground line */}
      <rect 
        x="15" 
        y="68" 
        width="70" 
        height="3.5" 
        fill={primaryColor}
      />
      
      {/* V sitting on the horizon */}
      <path 
        d="M 30 25 L 45 62 L 55 62 L 70 25 L 65 25 L 50 57 L 35 25 Z" 
        fill={primaryColor}
      />
      
      {/* Vertical grounding stakes */}
      <rect 
        x="30" 
        y="62" 
        width="2" 
        height="6" 
        fill={primaryColor}
        opacity="0.4"
      />
      <rect 
        x="68" 
        y="62" 
        width="2" 
        height="6" 
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
