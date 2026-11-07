import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import type { ProgressBarProps, ProgressBarConfig } from '@react-ad-engine/core';

export interface VastProgressBarProps extends ProgressBarProps {
  config?: Partial<ProgressBarConfig>;
  style?: ViewStyle;
}

export const VastProgressBar: React.FC<VastProgressBarProps> = ({ progress, config, style }) => {
  if (config?.enabled === false) return null;

  const height = config?.height || 4;
  const pos = config?.position || 'bottom';
  const pct = Math.min(100, Math.max(0, progress * 100));

  return (
    <View
      style={[
        styles.track,
        { height, [pos]: 0 },
        config?.backgroundColor ? { backgroundColor: config.backgroundColor } : null,
        style,
      ]}
    >
      <View
        style={[
          styles.fill,
          { width: `${pct}%` },
          config?.color ? { backgroundColor: config.color } : null,
        ]}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  track: {
    position: 'absolute',
    left: 0,
    right: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    zIndex: 100,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    backgroundColor: '#3b82f6',
  },
});
