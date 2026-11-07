import React from 'react';
import { View, Image, TouchableOpacity, StyleSheet, ViewStyle, ImageStyle } from 'react-native';
import type { ImageAdProps } from '@react-ad-engine/core';
import { VastCloseButton } from './VastCloseButton';

export interface VastImageAdProps extends ImageAdProps {
  style?: ViewStyle;
  imageStyle?: ImageStyle;
}

export const VastImageAd: React.FC<VastImageAdProps> = ({
  nonLinear,
  imageUrl,
  onClick,
  onClose,
  style,
  imageStyle,
}) => {
  if (!imageUrl) return null;

  return (
    <View
      style={[
        styles.container,
        nonLinear.width > 0 ? { width: nonLinear.width } : null,
        nonLinear.height > 0 ? { height: nonLinear.height } : null,
        style,
      ]}
    >
      <VastCloseButton onClose={onClose} state={{} as any} />
      <TouchableOpacity activeOpacity={0.9} onPress={onClick} style={styles.touchable}>
        <Image
          source={{ uri: imageUrl }}
          resizeMode={nonLinear.maintainAspectRatio ? 'contain' : 'stretch'}
          style={[styles.image, imageStyle]}
          accessibilityLabel="Advertisement Banner"
        />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 24,
    alignSelf: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    borderRadius: 8,
    overflow: 'hidden',
    zIndex: 90,
    maxWidth: '90%',
    maxHeight: '40%',
  },
  touchable: {
    width: '100%',
    height: '100%',
  },
  image: {
    width: '100%',
    height: '100%',
  },
});
