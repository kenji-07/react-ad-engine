import { useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import { useVastAds } from '@react-ad-engine/react';
import { VastAdOverlay } from '@react-ad-engine/react-native';
import { ExpoVideoAdapter } from '@react-ad-engine/integrations';

/**
 * PRODUCTION EXAMPLE: Expo Video Integration
 * Works with expo-video or expo-av players via the generic ExpoVideoAdapter.
 */
export function ExpoPlayerWithAds({ expoPlayerInstance }: { expoPlayerInstance?: any }) {
  const adapter = useMemo(() => new ExpoVideoAdapter(expoPlayerInstance), [expoPlayerInstance]);

  const ads = useVastAds({
    adTagUrl: 'https://example.com/vmap-schedule.xml',
    playerAdapter: adapter,
    options: {
      autoResumeContent: true,
    },
    ui: {
      theme: 'dark',
      adBadge: { text: 'РЕКЛАМ' },
      skipButton: { text: 'Алгасах' },
    },
  });

  return (
    <View style={styles.container}>
      {/* Developer's Expo VideoView component is placed here */}

      {/* Built-in advertising overlay */}
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
    backgroundColor: '#000000',
    position: 'relative',
  },
});
