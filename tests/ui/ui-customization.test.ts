import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { mergeUIConfig, DARK_THEME_COLORS, LIGHT_THEME_COLORS } from '../../packages/react/src/default-ui-config';
import { VastAdOverlay } from '../../packages/web/src/components/VastAdOverlay';
import type { AdStateSnapshot } from '../../packages/core/src/types/lifecycle';

describe('UI Theme System, Customization & Headless Mode', () => {
  const dummyState: AdStateSnapshot = {
    state: 'adPlaying',
    isAdActive: true,
    shouldPauseContent: true,
    currentCreative: {
      id: 'cr-1',
      linear: {
        duration: 30,
        skipoffset: 5,
        mediaFiles: [],
        trackingEvents: [],
      },
    },
    currentMediaFile: null,
    currentTime: 2,
    duration: 30,
    progress: 2 / 30,
    isSkippable: true,
    canSkip: false,
    skipCountdown: 3,
    isPaused: false,
    isMuted: false,
    companionAds: [],
    nonLinearAds: [],
    textAd: null,
    error: null,
  };

  it('merges default UI config and applies dark/light themes', () => {
    // Default
    const defaultMerged = mergeUIConfig();
    expect(defaultMerged.enabled).toBe(true);
    expect(defaultMerged.theme).toBe('dark');
    expect(defaultMerged.colors?.primary).toBe(DARK_THEME_COLORS.primary);

    // Light theme
    const lightMerged = mergeUIConfig({ theme: 'light' });
    expect(lightMerged.theme).toBe('light');
    expect(lightMerged.colors?.primary).toBe(LIGHT_THEME_COLORS.primary);

    // Custom overrides
    const customMerged = mergeUIConfig({
      skipButton: {
        text: 'Алгасах',
        backgroundColor: '#ff0000',
        borderRadius: 12,
      },
      ctaButton: {
        text: 'Дэлгэрэнгүй',
      },
    });

    expect(customMerged.skipButton?.text).toBe('Алгасах');
    expect(customMerged.skipButton?.backgroundColor).toBe('#ff0000');
    expect(customMerged.skipButton?.borderRadius).toBe(12);
    expect(customMerged.ctaButton?.text).toBe('Дэлгэрэнгүй');
  });

  it('Headless mode: VastAdOverlay returns null when ui.enabled === false', () => {
    const result = VastAdOverlay({
      state: dummyState,
      ui: { enabled: false },
    });

    expect(result).toBeNull();
  });

  it('VastAdOverlay returns null when state.isAdActive === false', () => {
    const inactiveState: AdStateSnapshot = {
      ...dummyState,
      isAdActive: false,
      state: 'contentPlaying',
    };

    const result = VastAdOverlay({
      state: inactiveState,
      ui: { enabled: true },
    });

    expect(result).toBeNull();
  });

  it('supports custom render props for skip button, badge, countdown, and CTA', () => {
    const mockRenderSkip = vi.fn((props) => (
      React.createElement('div', { id: 'custom-skip' }, `Skip in ${props.skipCountdown}s`)
    ));

    const mockRenderBadge = vi.fn((props) => (
      React.createElement('span', { id: 'custom-badge' }, props.text)
    ));

    const mockRenderCTA = vi.fn((props) => (
      React.createElement('button', { id: 'custom-cta', onClick: props.onClick }, props.text)
    ));

    const element = VastAdOverlay({
      state: dummyState,
      ui: { enabled: true },
      renderSkipButton: mockRenderSkip,
      renderAdBadge: mockRenderBadge,
      renderCTA: mockRenderCTA,
    });

    expect(element).not.toBeNull();
    expect(mockRenderSkip).toHaveBeenCalledWith(
      expect.objectContaining({
        canSkip: false,
        skipCountdown: 3,
      })
    );
    expect(mockRenderBadge).toHaveBeenCalledWith(
      expect.objectContaining({
        text: 'ADVERTISEMENT',
      })
    );
    expect(mockRenderCTA).toHaveBeenCalled();
  });

  it('renders custom TextAd and NonLinear image banner render props', () => {
    const textAdState: AdStateSnapshot = {
      ...dummyState,
      currentCreative: null,
      textAd: {
        enabled: true,
        title: 'Special Promo',
        description: 'Subscribe now',
        ctaButton: 'Get Started',
        clickUrl: 'https://example.com/promo',
      },
    };

    const mockRenderTextAd = vi.fn((props) => (
      React.createElement('div', { id: 'my-text-ad' }, props.textAd.title)
    ));

    VastAdOverlay({
      state: textAdState,
      ui: { enabled: true },
      renderTextAd: mockRenderTextAd,
    });

    expect(mockRenderTextAd).toHaveBeenCalledWith(
      expect.objectContaining({
        textAd: expect.objectContaining({ title: 'Special Promo' }),
      })
    );
  });
});
