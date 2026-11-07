declare module 'react-native' {
  export interface ViewStyle {
    [key: string]: any;
  }
  export interface TextStyle {
    [key: string]: any;
  }
  export interface ImageStyle {
    [key: string]: any;
  }

  export interface ViewProps {
    style?: ViewStyle | (ViewStyle | null | undefined)[] | undefined;
    pointerEvents?: 'box-none' | 'none' | 'box-only' | 'auto';
    children?: any;
    [key: string]: any;
  }

  export interface TextProps {
    style?: TextStyle | (TextStyle | null | undefined)[] | undefined;
    children?: any;
    [key: string]: any;
  }

  export interface TouchableOpacityProps {
    onPress?: () => void;
    activeOpacity?: number;
    disabled?: boolean;
    style?: ViewStyle | (ViewStyle | null | undefined)[] | undefined;
    children?: any;
    [key: string]: any;
  }

  export interface ImageProps {
    source: { uri: string } | number;
    resizeMode?: 'cover' | 'contain' | 'stretch' | 'repeat' | 'center';
    style?: ImageStyle | (ImageStyle | null | undefined)[] | undefined;
    accessibilityLabel?: string;
    [key: string]: any;
  }

  export const View: (props: ViewProps) => any;
  export const Text: (props: TextProps) => any;
  export const TouchableOpacity: (props: TouchableOpacityProps) => any;
  export const Image: (props: ImageProps) => any;

  export namespace StyleSheet {
    export function create<T extends Record<string, any>>(styles: T): T;
    export const hairlineWidth: number;
    export const absoluteFillObject: ViewStyle;
    export const absoluteFill: ViewStyle;
  }
}
