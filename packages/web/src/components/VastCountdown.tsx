import React from 'react';
import type { CountdownProps, CountdownConfig } from '@react-ad-engine/core';

export interface VastCountdownProps extends CountdownProps {
  config?: Partial<CountdownConfig>;
  style?: React.CSSProperties;
}

export const VastCountdown: React.FC<VastCountdownProps> = ({
  remainingSeconds,
  formattedTime,
  config,
  style,
}) => {
  if (config?.enabled === false) return null;

  const display = config?.format ? config.format(remainingSeconds) : formattedTime;

  const containerStyle: React.CSSProperties = {
    position: 'absolute',
    top: 16,
    right: 16,
    backgroundColor: config?.backgroundColor || 'rgba(0, 0, 0, 0.6)',
    color: config?.textColor || '#ffffff',
    fontSize: config?.fontSize || 13,
    fontWeight: 600,
    fontVariantNumeric: 'tabular-nums',
    padding: '4px 10px',
    borderRadius: 4,
    border: '1px solid rgba(255, 255, 255, 0.2)',
    userSelect: 'none',
    zIndex: 100,
    ...style,
  };

  return <div style={containerStyle}>{display}</div>;
};
