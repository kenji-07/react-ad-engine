import React from 'react';
import type { ProgressBarProps, ProgressBarConfig } from '@react-ad-engine/core';

export interface VastProgressBarProps extends ProgressBarProps {
  config?: Partial<ProgressBarConfig>;
  style?: React.CSSProperties;
}

export const VastProgressBar: React.FC<VastProgressBarProps> = ({
  progress,
  config,
  style,
}) => {
  if (config?.enabled === false) return null;

  const height = config?.height || 4;
  const pos = config?.position || 'bottom';

  const trackStyle: React.CSSProperties = {
    position: 'absolute',
    left: 0,
    right: 0,
    [pos]: 0,
    height,
    backgroundColor: config?.backgroundColor || 'rgba(255, 255, 255, 0.25)',
    zIndex: 100,
    overflow: 'hidden',
    ...style,
  };

  const fillStyle: React.CSSProperties = {
    height: '100%',
    width: `${Math.min(100, Math.max(0, progress * 100))}%`,
    backgroundColor: config?.color || '#3b82f6',
    transition: 'width 0.15s linear',
  };

  return (
    <div style={trackStyle}>
      <div style={fillStyle} />
    </div>
  );
};
