import type { VastUIConfig, UIThemeColors } from '@react-ad-engine/core';

export const DARK_THEME_COLORS: UIThemeColors = {
  primary: '#3b82f6',
  background: 'rgba(0, 0, 0, 0.75)',
  text: '#ffffff',
  accent: '#2563eb',
  progress: '#3b82f6',
  overlay: 'rgba(0, 0, 0, 0.5)',
  border: 'rgba(255, 255, 255, 0.2)',
};

export const LIGHT_THEME_COLORS: UIThemeColors = {
  primary: '#2563eb',
  background: 'rgba(255, 255, 255, 0.9)',
  text: '#111827',
  accent: '#1d4ed8',
  progress: '#2563eb',
  overlay: 'rgba(255, 255, 255, 0.5)',
  border: 'rgba(0, 0, 0, 0.15)',
};

export const DEFAULT_UI_CONFIG: VastUIConfig = {
  enabled: true,
  theme: 'dark',
  colors: DARK_THEME_COLORS,
  adBadge: {
    enabled: true,
    text: 'ADVERTISEMENT',
    position: 'top-left',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    textColor: '#ffffff',
    fontSize: 11,
    borderRadius: 4,
    padding: '4px 8px',
  },
  skipButton: {
    enabled: true,
    text: 'Skip Ad',
    countdownTemplate: 'Skip in {countdown}s',
    position: 'bottom-right',
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    textColor: '#ffffff',
    fontSize: 14,
    borderRadius: 6,
    padding: '8px 16px',
  },
  countdown: {
    enabled: true,
    position: 'top-right',
    textColor: '#ffffff',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    fontSize: 13,
  },
  progressBar: {
    enabled: true,
    color: '#3b82f6',
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    height: 4,
    position: 'bottom',
  },
  ctaButton: {
    enabled: true,
    text: 'Learn More',
    position: 'bottom-left',
    backgroundColor: '#3b82f6',
    textColor: '#ffffff',
    borderRadius: 6,
    fontSize: 13,
    padding: '8px 16px',
  },
  muteButton: {
    enabled: true,
    position: 'top-right',
    iconColor: '#ffffff',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    size: 32,
  },
  closeButton: {
    enabled: true,
    position: 'top-right',
    iconColor: '#ffffff',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    size: 28,
  },
};

export function mergeUIConfig(userConfig?: Partial<VastUIConfig>): VastUIConfig {
  if (!userConfig) return DEFAULT_UI_CONFIG;

  const themeColors =
    userConfig.theme === 'light'
      ? LIGHT_THEME_COLORS
      : { ...DARK_THEME_COLORS, ...userConfig.colors };

  return {
    enabled: userConfig.enabled ?? DEFAULT_UI_CONFIG.enabled,
    theme: userConfig.theme ?? DEFAULT_UI_CONFIG.theme,
    colors: themeColors,
    adBadge: { ...DEFAULT_UI_CONFIG.adBadge, ...userConfig.adBadge },
    skipButton: { ...DEFAULT_UI_CONFIG.skipButton, ...userConfig.skipButton },
    countdown: { ...DEFAULT_UI_CONFIG.countdown, ...userConfig.countdown },
    progressBar: { ...DEFAULT_UI_CONFIG.progressBar, ...userConfig.progressBar },
    ctaButton: { ...DEFAULT_UI_CONFIG.ctaButton, ...userConfig.ctaButton },
    muteButton: { ...DEFAULT_UI_CONFIG.muteButton, ...userConfig.muteButton },
    closeButton: { ...DEFAULT_UI_CONFIG.closeButton, ...userConfig.closeButton },
    customStyles: userConfig.customStyles || {},
  };
}
