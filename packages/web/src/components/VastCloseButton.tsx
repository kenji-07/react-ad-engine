import React from 'react';
import type { CloseButtonProps, CloseButtonConfig } from '@react-ad-engine/core';

export interface VastCloseButtonProps extends CloseButtonProps {
  config?: Partial<CloseButtonConfig>;
  style?: React.CSSProperties;
}

export const VastCloseButton: React.FC<VastCloseButtonProps> = ({
  onClose,
  config,
  style,
}) => {
  if (config?.enabled === false) return null;

  const size = config?.size || 28;

  const btnStyle: React.CSSProperties = {
    position: 'absolute',
    top: 8,
    right: 8,
    width: size,
    height: size,
    backgroundColor: config?.backgroundColor || 'rgba(0, 0, 0, 0.75)',
    color: config?.iconColor || '#ffffff',
    border: '1px solid rgba(255, 255, 255, 0.3)',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    userSelect: 'none',
    zIndex: 110,
    fontSize: 14,
    fontWeight: 'bold',
    lineHeight: 1,
    padding: 0,
    ...style,
  };

  return (
    <button
      type="button"
      style={btnStyle}
      onClick={onClose}
      aria-label="Close Advertisement"
    >
      ✕
    </button>
  );
};
