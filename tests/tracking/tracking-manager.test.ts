import { describe, it, expect, vi } from 'vitest';
import { TrackingManager } from '../../packages/core/src/tracking/tracking-manager';
import { MacroReplacer } from '../../packages/core/src/tracking/macro-replacer';
import type { TrackingTransport } from '../../packages/core/src/types/tracking';

describe('Tracking Engine & Macro Replacer', () => {
  it('MacroReplacer replaces standard and custom macros correctly', () => {
    const template = 'https://track.example.com?ts=[TIMESTAMP]&cb=[CACHEBUSTING]&code=[ERRORCODE]&pos=[CONTENTPLAYHEAD]&asset=[ASSETURI]&custom=[MY_KEY]';
    const result = MacroReplacer.replaceMacros(template, {
      timestamp: 1700000000000,
      errorCode: 405,
      contentPlayhead: 65.5, // 00:01:05.500
      assetUri: 'https://cdn.example.com/ad.mp4',
      customMacros: {
        MY_KEY: 'custom_val',
      },
    });

    expect(result).toContain('ts=1700000000000');
    expect(result).toContain('code=405');
    expect(result).toContain('pos=00%3A01%3A05.500');
    expect(result).toContain('asset=https%3A%2F%2Fcdn.example.com%2Fad.mp4');
    expect(result).toContain('custom=custom_val');
    expect(result).not.toContain('[CACHEBUSTING]');
  });

  it('TrackingManager fires events and prevents duplicate firings (quartiles, start)', async () => {
    const sentUrls: string[] = [];
    const mockTransport: TrackingTransport = {
      send: async (url: string) => {
        sentUrls.push(url);
        return true;
      },
    };

    const tracking = new TrackingManager({
      enabled: true,
      transport: mockTransport,
    });
    tracking.setAdContext('ad-1', 'https://video.mp4');

    const trackingEvents = [
      { event: 'start', url: 'https://track.example.com/start' },
      { event: 'firstQuartile', url: 'https://track.example.com/q1' },
      { event: 'midpoint', url: 'https://track.example.com/mid' },
      { event: 'thirdQuartile', url: 'https://track.example.com/q3' },
      { event: 'complete', url: 'https://track.example.com/complete' },
    ];

    // Fire start
    tracking.trackStart(trackingEvents);
    expect(sentUrls).toContain('https://track.example.com/start');

    // Duplicate start call should be deduplicated
    tracking.trackStart(trackingEvents);
    expect(sentUrls.filter((u) => u.includes('start'))).toHaveLength(1);

    // Progress to 26% (Q1)
    tracking.onAdProgress(2.6, 10, trackingEvents);
    expect(sentUrls).toContain('https://track.example.com/q1');

    // Re-reporting progress at 28% should not re-fire Q1
    tracking.onAdProgress(2.8, 10, trackingEvents);
    expect(sentUrls.filter((u) => u.includes('q1'))).toHaveLength(1);

    // Progress to 50% (Midpoint)
    tracking.onAdProgress(5.0, 10, trackingEvents);
    expect(sentUrls).toContain('https://track.example.com/mid');

    // Progress to 75% (Q3)
    tracking.onAdProgress(7.5, 10, trackingEvents);
    expect(sentUrls).toContain('https://track.example.com/q3');

    // Progress to 100% (Complete)
    tracking.onAdProgress(10.0, 10, trackingEvents);
    expect(sentUrls).toContain('https://track.example.com/complete');
    expect(sentUrls.filter((u) => u.includes('complete'))).toHaveLength(1);
  });

  it('respects individual event toggles', async () => {
    const sentUrls: string[] = [];
    const mockTransport: TrackingTransport = {
      send: async (url: string) => {
        sentUrls.push(url);
        return true;
      },
    };

    const tracking = new TrackingManager({
      enabled: true,
      firstQuartile: false, // Disabled
      transport: mockTransport,
    });
    tracking.setAdContext('ad-2');

    const trackingEvents = [
      { event: 'firstQuartile', url: 'https://track.example.com/q1' },
      { event: 'midpoint', url: 'https://track.example.com/mid' },
    ];

    tracking.onAdProgress(2.5, 10, trackingEvents);
    // Q1 should be ignored
    expect(sentUrls).toHaveLength(0);

    tracking.onAdProgress(5.0, 10, trackingEvents);
    // Midpoint should fire
    expect(sentUrls).toContain('https://track.example.com/mid');
  });

  it('tracks impressions only once per ad lifecycle', () => {
    const sentUrls: string[] = [];
    const mockTransport: TrackingTransport = {
      send: async (url: string) => {
        sentUrls.push(url);
        return true;
      },
    };

    const tracking = new TrackingManager({ transport: mockTransport });
    tracking.setAdContext('ad-3');

    const impressions = [
      { url: 'https://track.example.com/imp-1' },
      { url: 'https://track.example.com/imp-2' },
    ];

    tracking.trackImpressions(impressions);
    expect(sentUrls).toHaveLength(2);

    // Re-call
    tracking.trackImpressions(impressions);
    expect(sentUrls).toHaveLength(2);
  });

  it('tracks error URLs with error code replacement', () => {
    const sentUrls: string[] = [];
    const mockTransport: TrackingTransport = {
      send: async (url: string) => {
        sentUrls.push(url);
        return true;
      },
    };

    const tracking = new TrackingManager({ transport: mockTransport });
    tracking.trackError(['https://track.example.com/err?code=[ERRORCODE]'], 405);

    expect(sentUrls[0]).toContain('err?code=405');
  });

  it('does not throw when transport fails', async () => {
    const mockFailingTransport: TrackingTransport = {
      send: async () => {
        throw new Error('Network error');
      },
    };

    const onFailed = vi.fn();
    const tracking = new TrackingManager({
      transport: mockFailingTransport,
      onTrackFailed: onFailed,
    });

    expect(() => {
      tracking.fireUrls(['https://track.example.com/test'], 'testEvent');
    }).not.toThrow();
  });
});
