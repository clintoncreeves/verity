import React from 'react';

interface VerityLogoProps {
  variant?: 'full' | 'symbol' | 'wordmark';
  size?: 'small' | 'medium' | 'large' | 'custom';
  customSize?: number;
  darkMode?: boolean;
  inverted?: boolean; // for use on colored backgrounds
  className?: string;
}

/**
 * Verity Logo - ProposalB Design
 * "Structure Over Style" - Square frame with V-shaped void
 * The square frame represents the structured system, while the V-shaped void
 * reveals what's missing—the gap that needs verification.
 */
export function VerityLogo({
  variant = 'full',
  size = 'medium',
  customSize,
  darkMode = false,
  inverted = false,
  className = ''
}: VerityLogoProps) {
  const sizeMap: Record<'small' | 'medium' | 'large', number> = {
    small: 28,
    medium: 48,
    large: 80
  };

  const symbolSize = size === 'custom' && customSize ? customSize : sizeMap[size as 'small' | 'medium' | 'large'];
  const wordmarkHeight = symbolSize * 0.45;

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

  // Symbol Component - Square frame with V-shaped void
  const Symbol = ({ symbolSize }: { symbolSize: number }) => (
    <svg
      width={symbolSize}
      height={symbolSize}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Outer square frame */}
      <rect
        x="20"
        y="20"
        width="60"
        height="60"
        stroke={primaryColor}
        strokeWidth="2.5"
        fill="none"
      />

      {/* V-shaped void cut from bottom */}
      <path
        d="M 35 80 L 50 55 L 65 80"
        stroke={primaryColor}
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />

      {/* Small marker at apex showing the gap */}
      <circle
        cx="50"
        cy="55"
        r="2"
        fill={primaryColor}
      />
    </svg>
  );

  // Wordmark Component
  const Wordmark = ({ height }: { height: number }) => (
    <span
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
    </span>
  );

  if (variant === 'symbol') {
    return <Symbol symbolSize={symbolSize} />;
  }

  if (variant === 'wordmark') {
    return <Wordmark height={wordmarkHeight} />;
  }

  // Full logo (symbol + wordmark)
  return (
    <div className={`flex items-center gap-4 ${className}`}>
      <Symbol symbolSize={symbolSize} />
      <Wordmark height={wordmarkHeight} />
    </div>
  );
}

export default VerityLogo;
