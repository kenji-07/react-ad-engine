import { useRef, useEffect } from 'react';
import { useVastAds } from '@react-ad-engine/react';
import { VastAdOverlay, Html5VideoAdapter } from '@react-ad-engine/web';

/**
 * PRODUCTION EXAMPLE: Web / HTML5 Video Integration
 */
export function WebVideoPlayerWithAds() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const adapterRef = useRef<Html5VideoAdapter | null>(null);

  if (!adapterRef.current) {
    adapterRef.current = new Html5VideoAdapter();
  }

  const ads = useVastAds({
    vastUrl: 'https://example.com/linear-ad.vast.xml',
    playerAdapter: adapterRef.current,
    ui: {
      theme: 'dark',
      adBadge: { text: 'ADVERTISEMENT' },
      skipButton: { text: 'Skip Ad' },
      progressBar: { color: '#3b82f6', height: 4 },
    },
  });

  useEffect(() => {
    if (videoRef.current && adapterRef.current) {
      adapterRef.current.attach(videoRef.current);
    }
  }, []);

  return (
    <div style={{ position: 'relative', width: '100%', maxWidth: 800, aspectRatio: '16/9', background: '#000' }}>
      <video
        ref={videoRef}
        src="https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4"
        controls
        style={{ width: '100%', height: '100%' }}
      />

      <VastAdOverlay
        state={ads.state}
        ui={ads.ui}
        onSkip={ads.skipAd}
        onClick={ads.clickAd}
      />
    </div>
  );
}
