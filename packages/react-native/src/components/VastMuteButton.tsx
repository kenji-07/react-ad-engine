import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ViewStyle } from 'react-native';
import type { MuteButtonProps, MuteButtonConfig } from '@react-ad-engine/core';

export interface VastMuteButtonProps extends MuteButtonProps {
  config?: Partial<MuteButtonConfig>;
  style?: ViewStyle;
}

export const VastMuteButton: React.FC<VastMuteButtonProps> = ({
  isMuted,
  onToggleMute,
  config,
  style,
}) => {
  if (config?.enabled === false) return null;

  const size = config?.size || 34;

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={onToggleMute}
      style={[
        styles.button,
        { width: size, height: size, borderRadius: size / 2 },
        config?.backgroundColor ? { backgroundColor: config.backgroundColor } : null,
        style,
      ]}
    >
      <Text style={styles.icon}>{isMuted ? '🔇' : '🔊'}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    position: 'absolute',
    top: 16,
    right: 80,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 100,
  },
  icon: {
    fontSize: 16,
  },
});
