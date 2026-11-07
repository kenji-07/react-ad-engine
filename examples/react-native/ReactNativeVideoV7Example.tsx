import { useRef } from 'react';
import { View, StyleSheet } from 'react-native';
import { useVastAds } from '@react-ad-engine/react';
import { VastAdOverlay } from '@react-ad-engine/react-native';
import { ReactNativeVideoV7Adapter } from '@react-ad-engine/integrations';

/**
 * PRODUCTION EXAMPLE: React Native integration with react-native-video v7.
 *
 * NOTE: The application developer installs and owns react-native-video.
 * The SDK never installs, imports, or depends on react-native-video!
 */
export function ReactNativeVideoPlayerWithAds() {
  const adapterRef = useRef(new ReactNativeVideoV7Adapter());

  const ads = useVastAds({
    vastUrl: 'https://example.com/linear-ad.vast.xml',
    playerAdapter: adapterRef.current,
    ui: {
      theme: 'dark',
      adBadge: { text: 'ЗАР СУРТАЛЧИЛГАА' },
      skipButton: { text: 'Алгасах', countdownTemplate: '{countdown}с дараа алгасах' },
      ctaButton: { text: 'Дэлгэрэнгүй үзэх' },
    },
    tracking: {
      enabled: true,
      impression: true,
      start: true,
      firstQuartile: true,
      midpoint: true,
      thirdQuartile: true,
      complete: true,
    },
  });

  return (
    <View style={styles.container}>
      {/* 
        The developer uses their own Video component:
        <Video
          ref={(ref) => {
            videoRef.current = ref;
            adapterRef.current.attachRef(ref);
          }}
          source={{ uri: 'https://example.com/content-video.mp4' }}
          paused={ads.shouldPauseContent}
          onLoad={adapterRef.current.handleLoad}
          onProgress={adapterRef.current.handleProgress}
          onEnd={adapterRef.current.handleEnd}
          onSeek={adapterRef.current.handleSeek}
          onError={adapterRef.current.handleError}
          style={styles.video}
        />
      */}

      {/* Built-in Advertising UI automatically handles visibility & skip logic */}
      <VastAdOverlay
        state={ads.state}
        ui={ads.ui}
        onSkip={ads.skipAd}
        onClick={ads.clickAd}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    aspectRatio: 16 / 9,
    backgroundColor: '#000',
    position: 'relative',
  },
  video: {
    ...StyleSheet.absoluteFillObject,
  },
});
