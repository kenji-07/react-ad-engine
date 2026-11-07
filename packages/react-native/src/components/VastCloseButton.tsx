import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ViewStyle } from 'react-native';
import type { CloseButtonProps, CloseButtonConfig } from '@react-ad-engine/core';

export interface VastCloseButtonProps extends CloseButtonProps {
  config?: Partial<CloseButtonConfig>;
  style?: ViewStyle;
}

export const VastCloseButton: React.FC<VastCloseButtonProps> = ({ onClose, config, style }) => {
  if (config?.enabled === false) return null;

  const size = config?.size || 28;

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={onClose}
      style={[
        styles.button,
        { width: size, height: size, borderRadius: size / 2 },
        config?.backgroundColor ? { backgroundColor: config.backgroundColor } : null,
        style,
      ]}
    >
      <Text style={styles.text}>✕</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 110,
  },
  text: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: 'bold',
  },
});
