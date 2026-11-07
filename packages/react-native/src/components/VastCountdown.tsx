import React from 'react';
import { View, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import type { CountdownProps, CountdownConfig } from '@react-ad-engine/core';

export interface VastCountdownProps extends CountdownProps {
  config?: Partial<CountdownConfig>;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export const VastCountdown: React.FC<VastCountdownProps> = ({
  remainingSeconds,
  formattedTime,
  config,
  style,
  textStyle,
}) => {
  if (config?.enabled === false) return null;

  const display = config?.format ? config.format(remainingSeconds) : formattedTime;

  return (
    <View
      style={[
        styles.container,
        config?.backgroundColor ? { backgroundColor: config.backgroundColor } : null,
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
        {display}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 16,
    right: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 4,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    paddingVertical: 4,
    paddingHorizontal: 10,
    zIndex: 100,
  },
  text: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '600',
  },
});
