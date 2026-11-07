import React from 'react';
import type { ImageAdProps } from '@react-ad-engine/core';
import { VastCloseButton } from './VastCloseButton';

export interface VastImageAdProps extends ImageAdProps {
  style?: React.CSSProperties;
}

export const VastImageAd: React.FC<VastImageAdProps> = ({
  nonLinear,
  imageUrl,
  onClick,
  onClose,
  style,
}) => {
  if (!imageUrl) return null;

  const containerStyle: React.CSSProperties = {
    position: 'absolute',
    bottom: 24,
    left: '50%',
    transform: 'translateX(-50%)',
    width: nonLinear.width > 0 ? nonLinear.width : 'auto',
    maxWidth: '90%',
    height: nonLinear.height > 0 ? nonLinear.height : 'auto',
    maxHeight: '40%',
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    borderRadius: 8,
    boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.6)',
    overflow: 'hidden',
    zIndex: 90,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    ...style,
  };

  const imgStyle: React.CSSProperties = {
    maxWidth: '100%',
    maxHeight: '100%',
    objectFit: nonLinear.maintainAspectRatio ? 'contain' : 'fill',
    cursor: 'pointer',
    display: 'block',
  };

  return (
    <div style={containerStyle}>
      <VastCloseButton onClose={onClose} state={{} as any} />
      <img
        src={imageUrl}
        alt="Advertisement Banner"
        style={imgStyle}
        onClick={onClick}
      />
    </div>
  );
};
