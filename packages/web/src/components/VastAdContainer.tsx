import React from 'react';

export interface VastAdContainerProps {
  children?: React.ReactNode;
  style?: React.CSSProperties;
  className?: string;
  onClick?: (e: React.MouseEvent) => void;
}

export const VastAdContainer: React.FC<VastAdContainerProps> = ({
  children,
  style,
  className,
  onClick,
}) => {
  const containerStyle: React.CSSProperties = {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
    overflow: 'hidden',
    pointerEvents: 'none', // children enable pointer-events as needed
    userSelect: 'none',
    zIndex: 50,
    ...style,
  };

  return (
    <div style={containerStyle} className={className} onClick={onClick}>
      {children}
    </div>
  );
};
