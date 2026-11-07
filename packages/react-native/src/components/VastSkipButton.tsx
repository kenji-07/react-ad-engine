import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import type { SkipButtonProps, SkipButtonConfig } from '@react-ad-engine/core';

export interface VastSkipButtonProps extends SkipButtonProps {
  config?: Partial<SkipButtonConfig>;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export const VastSkipButton: React.FC<VastSkipButtonProps> = ({
  canSkip,
  skipCountdown,
  onSkip,
  text,
  config,
  style,
  textStyle,
}) => {
  if (config?.enabled === false) return null;

  const displayText = canSkip
    ? text || config?.text || 'Skip Ad'
    : (config?.countdownTemplate || 'Skip in {countdown}s').replace('{countdown}', String(skipCountdown));

  return (
    <TouchableOpacity
      activeOpacity={canSkip ? 0.7 : 1}
      onPress={canSkip ? onSkip : undefined}
      disabled={!canSkip}
      style={[
        styles.button,
        config?.backgroundColor ? { backgroundColor: config.backgroundColor } : null,
        config?.borderRadius ? { borderRadius: config.borderRadius } : null,
        !canSkip && styles.disabledButton,
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
    right: 24,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    borderRadius: 6,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    paddingVertical: 8,
    paddingHorizontal: 16,
    zIndex: 100,
  },
  disabledButton: {
    opacity: 0.85,
  },
  text: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
});
