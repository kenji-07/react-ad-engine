import React from 'react';
import type { CTAButtonProps, CTAButtonConfig } from '@react-ad-engine/core';

export interface VastCTAButtonProps extends CTAButtonProps {
  config?: Partial<CTAButtonConfig>;
  style?: React.CSSProperties;
}

export const VastCTAButton: React.FC<VastCTAButtonProps> = ({
  text,
  onClick,
  url,
  config,
  style,
}) => {
  if (config?.enabled === false) return null;

  const btnStyle: React.CSSProperties = {
    position: 'absolute',
    bottom: 24,
    left: 24,
    backgroundColor: config?.backgroundColor || '#3b82f6',
    color: config?.textColor || '#ffffff',
    fontSize: config?.fontSize || 13,
    fontWeight: 600,
    padding: config?.padding || '8px 16px',
    borderRadius: config?.borderRadius || 6,
    border: 'none',
    cursor: 'pointer',
    userSelect: 'none',
    zIndex: 100,
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.3)',
    transition: 'transform 0.15s ease, background-color 0.15s ease',
    ...style,
  };

  const displayText = text || config?.text || 'Learn More';

  return (
    <button
      type="button"
      style={btnStyle}
      onClick={onClick}
      aria-label={displayText}
      data-url={url}
    >
      {displayText}
    </button>
  );
};
