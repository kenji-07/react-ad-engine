import React from 'react';
import type { SkipButtonProps, SkipButtonConfig } from '@react-ad-engine/core';

export interface VastSkipButtonProps extends SkipButtonProps {
  config?: Partial<SkipButtonConfig>;
  style?: React.CSSProperties;
}

export const VastSkipButton: React.FC<VastSkipButtonProps> = ({
  canSkip,
  skipCountdown,
  onSkip,
  text,
  config,
  style,
}) => {
  if (config?.enabled === false) return null;

  const btnStyle: React.CSSProperties = {
    position: 'absolute',
    bottom: 24,
    right: 24,
    backgroundColor: config?.backgroundColor || 'rgba(0, 0, 0, 0.75)',
    color: config?.textColor || '#ffffff',
    border: '1px solid rgba(255, 255, 255, 0.3)',
    borderRadius: config?.borderRadius || 6,
    padding: config?.padding || '8px 16px',
    fontSize: config?.fontSize || 14,
    fontWeight: 600,
    cursor: canSkip ? 'pointer' : 'default',
    opacity: canSkip ? 1 : 0.85,
    pointerEvents: canSkip ? 'auto' : 'none',
    userSelect: 'none',
    zIndex: 100,
    transition: 'all 0.2s ease',
    ...style,
  };

  const displayText = canSkip
    ? text || config?.text || 'Skip Ad'
    : (config?.countdownTemplate || 'Skip in {countdown}s').replace('{countdown}', String(skipCountdown));

  return (
    <button
      type="button"
      style={btnStyle}
      onClick={canSkip ? onSkip : undefined}
      disabled={!canSkip}
      aria-label="Skip Advertisement"
    >
      {displayText}
    </button>
  );
};
