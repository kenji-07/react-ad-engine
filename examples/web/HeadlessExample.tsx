import { useVastAds } from '@react-ad-engine/react';

/**
 * PRODUCTION EXAMPLE: Headless Advertising Integration
 * In this mode, ui.enabled is false so built-in UI is disabled.
 * The developer builds 100% bespoke advertising UI while the engine
 * handles scheduling, VAST/VMAP parsing, tracking quartiles, and lifecycle.
 */
export function HeadlessAdvertisingPlayer() {
  const ads = useVastAds({
    adTagUrl: 'https://example.com/ad-response.xml',
    ui: {
      enabled: false, // Disables all built-in UI
    },
    tracking: {
      enabled: true,
      impression: true,
      start: true,
      firstQuartile: true,
      midpoint: true,
      thirdQuartile: true,
      complete: true,
      skip: true,
    },
  });

  return (
    <div style={{ position: 'relative', width: 640, height: 360, background: '#111' }}>
      {/* Content video */}
      <video
        src="https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4"
        style={{ width: '100%', height: '100%' }}
      />

      {/* Bespoke developer advertising UI */}
      {ads.isAdActive && (
        <div style={{ position: 'absolute', top: 10, right: 10, color: '#fff', background: '#e11d48', padding: '6px 12px' }}>
          <span>LIVE AD: {ads.state.duration - ads.state.currentTime}s remaining</span>
          {ads.state.canSkip && (
            <button type="button" onClick={ads.skipAd} style={{ marginLeft: 8 }}>
              Custom Skip
            </button>
          )}
        </div>
      )}
    </div>
  );
}
