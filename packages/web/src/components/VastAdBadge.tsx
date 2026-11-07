import React from 'react';
import type { AdBadgeProps, AdBadgeConfig } from '@react-ad-engine/core';

export interface VastAdBadgeProps extends AdBadgeProps {
  config?: Partial<AdBadgeConfig>;
  style?: React.CSSProperties;
}

export const VastAdBadge: React.FC<VastAdBadgeProps> = ({ text, config, style }) => {
  if (config?.enabled === false) return null;

  const badgeStyle: React.CSSProperties = {
    position: 'absolute',
    top: 16,
    left: 16,
    backgroundColor: config?.backgroundColor || 'rgba(0, 0, 0, 0.75)',
    color: config?.textColor || '#ffffff',
    fontSize: config?.fontSize || 11,
    fontWeight: 700,
    letterSpacing: '0.05em',
    padding: config?.padding || '4px 8px',
    borderRadius: config?.borderRadius || 4,
    border: '1px solid rgba(255, 255, 255, 0.2)',
    userSelect: 'none',
    zIndex: 100,
    ...style,
  };

  return <div style={badgeStyle}>{text || config?.text || 'ADVERTISEMENT'}</div>;
};
