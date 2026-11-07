import React from 'react';
import type { CompanionAdProps } from '@react-ad-engine/core';
import { HtmlSanitizer } from '@react-ad-engine/core';

export interface VastCompanionAdProps extends CompanionAdProps {
  style?: React.CSSProperties;
  className?: string;
}

export const VastCompanionAd: React.FC<VastCompanionAdProps> = ({
  companion,
  onClick,
  style,
  className,
}) => {
  if (!companion) return null;

  const width = companion.width || 300;
  const height = companion.height || 250;

  const containerStyle: React.CSSProperties = {
    width,
    height,
    maxWidth: '100%',
    overflow: 'hidden',
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    ...style,
  };

  // 1. Static Image Resource
  if (companion.staticResource?.url) {
    return (
      <div style={containerStyle} className={className} onClick={onClick}>
        <img
          src={companion.staticResource.url}
          alt={companion.altText || 'Companion Advertisement'}
          style={{ width: '100%', height: '100%', objectFit: 'contain' }}
        />
      </div>
    );
  }

  // 2. HTML Resource (sanitized for security)
  if (companion.htmlResource?.html) {
    const cleanHtml = HtmlSanitizer.sanitize(companion.htmlResource.html);
    return (
      <div
        style={containerStyle}
        className={className}
        onClick={onClick}
        dangerouslySetInnerHTML={{ __html: cleanHtml }}
      />
    );
  }

  return null;
};
