import React from 'react';
import type { TextAdProps } from '@react-ad-engine/core';
import { VastCloseButton } from './VastCloseButton';

export interface VastTextAdProps extends TextAdProps {
  style?: React.CSSProperties;
}

export const VastTextAd: React.FC<VastTextAdProps> = ({
  textAd,
  onClick,
  onClose,
  style,
}) => {
  if (!textAd || !textAd.enabled) return null;

  const cardStyle: React.CSSProperties = {
    position: 'absolute',
    bottom: 24,
    left: '50%',
    transform: 'translateX(-50%)',
    width: '90%',
    maxWidth: 420,
    backgroundColor: 'rgba(17, 24, 39, 0.95)',
    border: '1px solid rgba(255, 255, 255, 0.15)',
    borderRadius: 8,
    padding: '16px 20px',
    boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.6)',
    zIndex: 90,
    color: '#ffffff',
    fontFamily: 'system-ui, -apple-system, sans-serif',
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
    ...style,
  };

  const titleStyle: React.CSSProperties = {
    margin: 0,
    fontSize: 16,
    fontWeight: 700,
    color: '#f9fafb',
    paddingRight: 28,
  };

  const descStyle: React.CSSProperties = {
    margin: 0,
    fontSize: 13,
    color: '#d1d5db',
    lineHeight: 1.4,
  };

  const btnStyle: React.CSSProperties = {
    alignSelf: 'flex-start',
    marginTop: 6,
    backgroundColor: '#3b82f6',
    color: '#ffffff',
    border: 'none',
    borderRadius: 6,
    padding: '6px 14px',
    fontSize: 13,
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'background-color 0.15s ease',
  };

  return (
    <div style={cardStyle}>
      <VastCloseButton onClose={onClose} state={{} as any} />
      {textAd.title && <h4 style={titleStyle}>{textAd.title}</h4>}
      {textAd.description && <p style={descStyle}>{textAd.description}</p>}
      {textAd.ctaButton && (
        <button type="button" style={btnStyle} onClick={onClick}>
          {textAd.ctaButton}
        </button>
      )}
    </div>
  );
};
