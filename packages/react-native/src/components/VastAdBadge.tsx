import React from 'react';
import { View, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import type { AdBadgeProps, AdBadgeConfig } from '@react-ad-engine/core';

export interface VastAdBadgeProps extends AdBadgeProps {
  config?: Partial<AdBadgeConfig>;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export const VastAdBadge: React.FC<VastAdBadgeProps> = ({ text, config, style, textStyle }) => {
  if (config?.enabled === false) return null;

  return (
    <View
      style={[
        styles.badge,
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
        {text || config?.text || 'ADVERTISEMENT'}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    position: 'absolute',
    top: 16,
    left: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    borderRadius: 4,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    paddingVertical: 4,
    paddingHorizontal: 8,
    zIndex: 100,
  },
  text: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
});
