import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';

export interface VastAdContainerProps {
  children?: React.ReactNode;
  style?: ViewStyle;
}

export const VastAdContainer: React.FC<VastAdContainerProps> = ({ children, style }) => {
  return (
    <View pointerEvents="box-none" style={[styles.container, style]}>
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 50,
  },
});
