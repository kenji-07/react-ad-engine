import React from 'react';
import { Image, TouchableOpacity, StyleSheet, ViewStyle, ImageStyle } from 'react-native';
import type { CompanionAdProps } from '@react-ad-engine/core';

export interface VastCompanionAdProps extends CompanionAdProps {
  style?: ViewStyle;
  imageStyle?: ImageStyle;
}

export const VastCompanionAd: React.FC<VastCompanionAdProps> = ({
  companion,
  onClick,
  style,
  imageStyle,
}) => {
  if (!companion) return null;

  const width = companion.width || 300;
  const height = companion.height || 250;

  // React Native safely supports static image resources directly
  if (companion.staticResource?.url) {
    return (
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={onClick}
        style={[styles.container, { width, height }, style]}
      >
        <Image
          source={{ uri: companion.staticResource.url }}
          resizeMode="contain"
          style={[styles.image, imageStyle]}
          accessibilityLabel={companion.altText || 'Companion Advertisement'}
        />
      </TouchableOpacity>
    );
  }

  return null;
};

const styles = StyleSheet.create({
  container: {
    maxWidth: '100%',
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  image: {
    width: '100%',
    height: '100%',
  },
});
