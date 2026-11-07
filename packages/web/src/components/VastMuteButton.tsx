import React from 'react';
import type { MuteButtonProps, MuteButtonConfig } from '@react-ad-engine/core';

export interface VastMuteButtonProps extends MuteButtonProps {
  config?: Partial<MuteButtonConfig>;
  style?: React.CSSProperties;
}

export const VastMuteButton: React.FC<VastMuteButtonProps> = ({
  isMuted,
  onToggleMute,
  config,
  style,
}) => {
  if (config?.enabled === false) return null;

  const size = config?.size || 32;

  const btnStyle: React.CSSProperties = {
    position: 'absolute',
    top: 16,
    right: 80,
    width: size,
    height: size,
    backgroundColor: config?.backgroundColor || 'rgba(0, 0, 0, 0.6)',
    color: config?.iconColor || '#ffffff',
    border: '1px solid rgba(255, 255, 255, 0.2)',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    userSelect: 'none',
    zIndex: 100,
    padding: 0,
    ...style,
  };

  return (
    <button
      type="button"
      style={btnStyle}
      onClick={onToggleMute}
      aria-label={isMuted ? 'Unmute' : 'Mute'}
    >
      {isMuted ? '🔇' : '🔊'}
    </button>
  );
};
