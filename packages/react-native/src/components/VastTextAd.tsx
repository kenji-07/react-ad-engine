import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import type { TextAdProps } from '@react-ad-engine/core';
import { VastCloseButton } from './VastCloseButton';

export interface VastTextAdProps extends TextAdProps {
  style?: ViewStyle;
  titleStyle?: TextStyle;
  descStyle?: TextStyle;
}

export const VastTextAd: React.FC<VastTextAdProps> = ({
  textAd,
  onClick,
  onClose,
  style,
  titleStyle,
  descStyle,
}) => {
  if (!textAd || !textAd.enabled) return null;

  return (
    <View style={[styles.card, style]}>
      <VastCloseButton onClose={onClose} state={{} as any} />
      {Boolean(textAd.title) && <Text style={[styles.title, titleStyle]}>{textAd.title}</Text>}
      {Boolean(textAd.description) && (
        <Text style={[styles.description, descStyle]}>{textAd.description}</Text>
      )}
      {Boolean(textAd.ctaButton) && (
        <TouchableOpacity activeOpacity={0.8} style={styles.button} onPress={onClick}>
          <Text style={styles.buttonText}>{textAd.ctaButton}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    position: 'absolute',
    bottom: 24,
    alignSelf: 'center',
    width: '90%',
    maxWidth: 420,
    backgroundColor: 'rgba(17, 24, 39, 0.95)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 8,
    padding: 16,
    zIndex: 90,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: '#f9fafb',
    paddingRight: 28,
    marginBottom: 4,
  },
  description: {
    fontSize: 13,
    color: '#d1d5db',
    lineHeight: 18,
    marginBottom: 8,
  },
  button: {
    alignSelf: 'flex-start',
    backgroundColor: '#3b82f6',
    borderRadius: 6,
    paddingVertical: 6,
    paddingHorizontal: 14,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '600',
  },
});
