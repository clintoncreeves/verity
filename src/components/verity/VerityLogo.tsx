import React from 'react';

// Verification states that affect the V-void fill
export type VerificationState =
  | 'default'      // Empty void - no verification yet
  | 'verified'     // Fully filled - solid ground found
  | 'likely-verified'
  | 'inconclusive'  // Unable to determine
  | 'mixed-evidence'
  | 'unverifiable' // Empty with question - still searching
  | 'likely-false'
  | 'false'        // Void with break/crack
  | 'satire-parody';

interface VerityLogoProps {
  variant?: 'full' | 'symbol' | 'wordmark';
  size?: 'small' | 'medium' | 'large' | 'custom';
  customSize?: number;
  darkMode?: boolean;
  inverted?: boolean; // for use on colored backgrounds
  className?: string;
  state?: VerificationState; // Dynamic state based on verification result
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
  className = '',
  state = 'default'
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

  // Get fill color based on verification state (for the V-void fill)
  const getStateColor = (): string | null => {
    switch (state) {
      case 'verified':
      case 'likely-verified':
        return '#0D9488'; // Teal - solid ground
      case 'inconclusive':
      case 'mixed-evidence':
        return '#F59E0B'; // Amber - uncertain
      case 'unverifiable':
        return '#64748B'; // Gray - uncertain
      case 'likely-false':
      case 'false':
        return '#BE123C'; // Crimson - contradicted
      case 'satire-parody':
        return '#8B5CF6'; // Purple - satire
      default:
        return null; // No fill for default state
    }
  };

  // Calculate fill level (0-1) based on state
  const getFillLevel = (): number => {
    switch (state) {
      case 'verified':
        return 1.0;
      case 'likely-verified':
        return 0.85;
      case 'inconclusive':
        return 0.5;
      case 'mixed-evidence':
        return 0.4;
      case 'unverifiable':
        return 0.1; // Just a hint
      case 'likely-false':
        return 0.7;
      case 'false':
        return 1.0;
      case 'satire-parody':
        return 0.6;
      default:
        return 0;
    }
  };

  const primaryColor = getPrimaryColor();
  const textColor = getTextColor();
  const stateColor = getStateColor();
  const fillLevel = getFillLevel();

  // Symbol Component - Square frame with V-shaped void
  // The void fills based on verification state - representing "finding solid ground"
  const Symbol = ({ symbolSize }: { symbolSize: number }) => {
    // The V goes from y=80 (bottom) to y=55 (apex) = 25 units height
    const voidHeight = 25;

    return (
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

        {/* V-void fill - represents solid ground found */}
        {stateColor && fillLevel > 0 && (
          <path
            d={`M 35 80 L 50 ${80 - voidHeight * Math.min(fillLevel, 1)} L 65 80 Z`}
            fill={stateColor}
            opacity={0.3 + (fillLevel * 0.4)} // 0.3 to 0.7 opacity
            style={{ transition: 'all 0.5s ease-out' }}
          />
        )}

        {/* V-shaped void outline */}
        <path
          d="M 35 80 L 50 55 L 65 80"
          stroke={stateColor || primaryColor}
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
          style={{ transition: 'stroke 0.3s ease' }}
        />

        {/* Apex marker - changes based on state */}
        <circle
          cx="50"
          cy="55"
          r={state === 'default' ? 2 : 3}
          fill={stateColor || primaryColor}
          style={{ transition: 'all 0.3s ease' }}
        />

        {/* For "false" state, add a subtle break/crack indicator */}
        {(state === 'false' || state === 'likely-false') && (
          <line
            x1="47"
            y1="67"
            x2="53"
            y2="63"
            stroke={stateColor || undefined}
            strokeWidth="2"
            strokeLinecap="round"
            opacity={0.6}
          />
        )}
      </svg>
    );
  };

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
