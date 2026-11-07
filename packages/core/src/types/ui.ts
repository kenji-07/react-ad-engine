import type { AdStateSnapshot } from './lifecycle';
import type { TextAdData } from './custom-extensions';
import type { VastNonLinear, VastCompanion } from './vast';

export type UIPosition =
  | 'top-left'
  | 'top-right'
  | 'bottom-left'
  | 'bottom-right'
  | 'top-center'
  | 'bottom-center'
  | 'center';

export interface UIThemeColors {
  primary: string;
  background: string;
  text: string;
  accent: string;
  progress: string;
  overlay: string;
  border: string;
}

export interface AdBadgeConfig {
  enabled: boolean;
  text: string;
  position: UIPosition;
  backgroundColor?: string;
  textColor?: string;
  fontSize?: number;
  borderRadius?: number;
  padding?: string | number;
}

export interface SkipButtonConfig {
  enabled: boolean;
  text: string;
  countdownTemplate: string; // e.g. "Skip in {countdown}s" or "Та {countdown} сек дараа алгасаж болно"
  position: UIPosition;
  backgroundColor?: string;
  textColor?: string;
  fontSize?: number;
  borderRadius?: number;
  padding?: string | number;
}

export interface CountdownConfig {
  enabled: boolean;
  position: UIPosition;
  textColor?: string;
  backgroundColor?: string;
  fontSize?: number;
  format?: (remainingSeconds: number) => string;
}

export interface ProgressBarConfig {
  enabled: boolean;
  color?: string;
  backgroundColor?: string;
  height?: number;
  position?: 'top' | 'bottom';
}

export interface CTAButtonConfig {
  enabled: boolean;
  text: string;
  position: UIPosition;
  backgroundColor?: string;
  textColor?: string;
  borderRadius?: number;
  fontSize?: number;
  padding?: string | number;
}

export interface MuteButtonConfig {
  enabled: boolean;
  position: UIPosition;
  iconColor?: string;
  backgroundColor?: string;
  size?: number;
}

export interface CloseButtonConfig {
  enabled: boolean;
  position: UIPosition;
  iconColor?: string;
  backgroundColor?: string;
  size?: number;
}

export interface VastUIConfig {
  enabled: boolean; // if false, headless mode
  theme?: 'dark' | 'light' | 'custom';
  colors?: Partial<UIThemeColors>;
  adBadge?: Partial<AdBadgeConfig>;
  skipButton?: Partial<SkipButtonConfig>;
  countdown?: Partial<CountdownConfig>;
  progressBar?: Partial<ProgressBarConfig>;
  ctaButton?: Partial<CTAButtonConfig>;
  muteButton?: Partial<MuteButtonConfig>;
  closeButton?: Partial<CloseButtonConfig>;
  customStyles?: Record<string, any>;
}

// Props for custom render props
export interface BaseUIComponentProps {
  state: AdStateSnapshot;
}

export interface SkipButtonProps extends BaseUIComponentProps {
  canSkip: boolean;
  skipCountdown: number;
  onSkip: () => void;
  text: string;
}

export interface AdBadgeProps extends BaseUIComponentProps {
  text: string;
}

export interface CountdownProps extends BaseUIComponentProps {
  remainingSeconds: number;
  formattedTime: string;
}

export interface ProgressBarProps extends BaseUIComponentProps {
  progress: number; // 0 to 1
  currentTime: number;
  duration: number;
}

export interface CTAButtonProps extends BaseUIComponentProps {
  text: string;
  onClick: () => void;
  url?: string;
}

export interface MuteButtonProps extends BaseUIComponentProps {
  isMuted: boolean;
  onToggleMute: () => void;
}

export interface CloseButtonProps extends BaseUIComponentProps {
  onClose: () => void;
}

export interface ImageAdProps extends BaseUIComponentProps {
  nonLinear: VastNonLinear;
  imageUrl: string;
  onClick: () => void;
  onClose: () => void;
}

export interface TextAdProps extends BaseUIComponentProps {
  textAd: TextAdData;
  onClick: () => void;
  onClose: () => void;
}

export interface CompanionAdProps extends BaseUIComponentProps {
  companion: VastCompanion;
  onClick: () => void;
}

export interface VastUIRenderProps {
  renderSkipButton?: (props: SkipButtonProps) => any;
  renderAdBadge?: (props: AdBadgeProps) => any;
  renderCountdown?: (props: CountdownProps) => any;
  renderCTA?: (props: CTAButtonProps) => any;
  renderProgressBar?: (props: ProgressBarProps) => any;
  renderMuteButton?: (props: MuteButtonProps) => any;
  renderCloseButton?: (props: CloseButtonProps) => any;
  renderImageAd?: (props: ImageAdProps) => any;
  renderTextAd?: (props: TextAdProps) => any;
  renderCompanionAd?: (props: CompanionAdProps) => any;
}
