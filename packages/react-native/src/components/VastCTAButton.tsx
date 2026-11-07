import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import type { CTAButtonProps, CTAButtonConfig } from '@react-ad-engine/core';

export interface VastCTAButtonProps extends CTAButtonProps {
  config?: Partial<CTAButtonConfig>;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export const VastCTAButton: React.FC<VastCTAButtonProps> = ({
  text,
  onClick,
  config,
  style,
  textStyle,
}) => {
  if (config?.enabled === false) return null;

  const displayText = text || config?.text || 'Learn More';

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={onClick}
      style={[
        styles.button,
        config?.backgroundColor ? { backgroundColor: config.backgroundColor } : null,
        config?.borderRadius ? { borderRadius: config.borderRadius } : null,
        style,
      ]}
    >
      <Text
        style={[
          styles.text,
          config?.textColor ? { color: config.textColor } : null,
          config?.fontSize ? { fontSize: config.fontSize } : null,
          textStyle,
        ]}
      >
        {displayText}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    position: 'absolute',
    bottom: 24,
    left: 24,
    backgroundColor: '#3b82f6',
    borderRadius: 6,
    paddingVertical: 8,
    paddingHorizontal: 16,
    zIndex: 100,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  text: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '600',
  },
});
