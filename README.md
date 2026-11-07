# React Ad Engine

> **Production-Ready, Player-Agnostic Custom VAST / VMAP Advertising SDK for React Native and Web**

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-Strict%20TypeChecked-brightgreen.svg)](tsconfig.json)
[![Tests](https://img.shields.io/badge/Tests-28%20Passed-success.svg)](tests/)

---

## 🌟 Core Philosophy

> **"The developer owns the video player. Our SDK owns the advertising experience."**

`react-ad-engine` is an **Advertising SDK**, NOT a video player. 

The application developer remains responsible for creating, configuring, and rendering their own video player instance. Our SDK handles VAST and VMAP XML parsing, ad scheduling, lifecycle state management, tracking quartiles, skip offset timers, overlays, and modern customizable advertising UI.

### Critical Design Principles

- **Zero Player Dependency**: Does NOT import, install, or require `react-native-video`, Google IMA SDK, or any third-party player SDK.
- **Player-Agnostic**: Connects to any video player through a lightweight, event-driven `PlayerAdapter` interface.
- **Unified Single Ad Tag**: Supply a single `adTagUrl` parameter—the SDK automatically detects whether the endpoint serves VAST or VMAP and executes the appropriate flow.
- **Dynamic Ad Loading**: Seamlessly switch or load new ads on the fly using `await ads.loadAdTag('https://...')`.
- **Full UI Customization**: Includes modern, responsive built-in UI for Linear Video, NonLinear Banners, and Text Ads, plus support for custom themes, render props, and 100% Headless mode.

---

## 🚀 Compatibility

| Environment | Supported Versions | Notes |
| :--- | :--- | :--- |
| **React** | `>=18.0.0` | 100% compatible with React 18.x, **React 19.3.0, 19.3.1**, and future versions. |
| **React Native** | `>=0.70.0` | Fully compatible with **0.73.x, 0.74.x, 0.76.x, 0.80+ (including 0.88+)** and the New Architecture (Fabric/TurboModules). |
| **Web** | Modern Browsers | Chrome, Safari, Firefox, Edge, Mobile Safari, Chrome Android. |
| **Video Players** | Any player | Examples included for `react-native-video` v7 and standard HTML5 `<video>`. |

---

## 📦 Installation

```bash
# Using npm
npm install react-ad-engine fast-xml-parser

# Using yarn
yarn add react-ad-engine fast-xml-parser

# Using pnpm
pnpm add react-ad-engine fast-xml-parser
```

---

## 🏗 Architecture & Package Structure

The SDK is designed modularly to ensure that the core advertising logic remains completely independent of React, React Native, and DOM environments:

```text
packages/
  ├── core/            # Pure TypeScript engine (zero DOM, zero React Native)
  │   ├── parser/      # VAST 3.0/4.x, VMAP 1.0.1, Custom Extensions, Wrapper Resolver
  │   ├── scheduler/   # Ad Break Scheduler, Seek Detection, Missed-break policies
  │   ├── tracking/    # Configurable Tracking Manager, Deduplication, Macro Replacer
  │   ├── lifecycle/   # 13-state Finite State Machine (FSM)
  │   ├── media/       # Media Selector (Bitrate, Resolution, MimeType)
  │   ├── security/    # HTML Sanitizer (XSS protection), Safe URL Protocol Validator
  │   ├── adapters/    # BasePlayerAdapter & PlayerAdapter contracts
  │   └── engine/      # Master VastEngine coordinator
  │
  ├── react/           # React Hooks (useVastAds, useVmapAds, UI Theme system)
  ├── web/             # Web Built-in UI components, HTML5 Video Adapter
  ├── react-native/    # React Native Built-in UI, Native TextAd & ImageAd
  └── integrations/    # react-native-video v7 and HTML5 Video adapters

examples/
  ├── react-native/    # ReactNativeVideoV7Example.tsx
  └── web/             # Html5VideoExample.tsx & HeadlessExample.tsx

tests/                 # 28 automated test suites covering all fixtures & features
```

---

## ⚡️ Quick Start

### 1. React Native with `react-native-video` v7

> **Note**: Install and own `react-native-video` in your application. Our SDK connects to it via `ReactNativeVideoV7Adapter` without adding it as a dependency.

```tsx
import React, { useRef } from 'react';
import { View, StyleSheet } from 'react-native';
import Video from 'react-native-video';
import { useVastAds } from 'react-ad-engine/react';
import { VastAdOverlay } from 'react-ad-engine/react-native';
import { ReactNativeVideoV7Adapter } from 'react-ad-engine/integrations';

export function MyVideoScreen() {
  const adapterRef = useRef(new ReactNativeVideoV7Adapter());

  const ads = useVastAds({
    // Provide a single unified ad tag URL (auto-detects VAST or VMAP)
    adTagUrl: 'https://example.com/preroll.vast.xml',
    playerAdapter: adapterRef.current,
    ui: {
      theme: 'dark',
      adBadge: { text: 'ADVERTISEMENT' },
      skipButton: { text: 'Skip Ad', countdownTemplate: 'Skip in {countdown}s' },
      ctaButton: { text: 'Learn More' },
    },
  });

  return (
    <View style={styles.container}>
      {/* Developer's own Video player */}
      <Video
        ref={(ref) => adapterRef.current.attachRef(ref)}
        source={{ uri: 'https://example.com/main-content.mp4' }}
        paused={ads.shouldPauseContent}
        onLoad={adapterRef.current.handleLoad}
        onProgress={adapterRef.current.handleProgress}
        onEnd={adapterRef.current.handleEnd}
        onSeek={adapterRef.current.handleSeek}
        onError={adapterRef.current.handleError}
        style={styles.video}
      />

      {/* Built-in Advertising UI (Automatically rendered during ad playback) */}
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
  container: { width: '100%', aspectRatio: 16 / 9, backgroundColor: '#000' },
  video: { ...StyleSheet.absoluteFillObject },
});
```

---

### 2. Web (HTML5) Video

```tsx
import React, { useRef, useEffect } from 'react';
import { useVastAds } from 'react-ad-engine/react';
import { VastAdOverlay, Html5VideoAdapter } from 'react-ad-engine/web';

export function WebPlayer() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const adapterRef = useRef(new Html5VideoAdapter());

  const ads = useVastAds({
    adTagUrl: 'https://example.com/linear-ad.vast.xml',
    playerAdapter: adapterRef.current,
    ui: {
      theme: 'dark',
      progressBar: { color: '#3b82f6', height: 4 },
    },
  });

  useEffect(() => {
    if (videoRef.current) {
      adapterRef.current.attach(videoRef.current);
    }
  }, []);

  return (
    <div style={{ position: 'relative', width: '100%', maxWidth: 800, aspectRatio: '16/9', background: '#000' }}>
      <video
        ref={videoRef}
        src="https://example.com/content.mp4"
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
```

---

## 🔄 Dynamic Ad Loading (`ads.loadAdTag`)

You can dynamically fetch and switch ad tags at runtime without re-mounting the component. The SDK automatically inspects the payload and routes it to either the VAST or VMAP pipeline:

```tsx
function MyPlayer() {
  const ads = useVastAds({ playerAdapter: myAdapter });

  const onSelectNextEpisode = async (episodeVideoUrl: string, adUrl: string) => {
    // 1. Load new Ad Tag (supports both VAST and VMAP URLs or raw XML strings)
    await ads.loadAdTag(adUrl);

    // 2. Play content video
    setVideoSource(episodeVideoUrl);
  };

  return (/* ... */);
}
```

---

## 🧩 Built-in Advertising UI

The SDK provides ready-to-use, responsive components that manage their own visibility based on the ad state:

- **`VastAdOverlay`**: Master container managing controls for Linear, NonLinear, and Text ads.
- **`VastAdContainer`**: Responsive absolute bounds wrapper with touch management.
- **`VastAdBadge`**: Customizable "ADVERTISEMENT" badge.
- **`VastCountdown`**: Remaining ad duration timer (`0:15`).
- **`VastSkipButton`**: Displays a countdown before the `skipoffset` is reached (e.g., `"Skip in 5s"`), transforming into an active `"Skip Ad"` button once allowed.
- **`VastProgressBar`**: Real-time progress bar showing elapsed ad time.
- **`VastMuteButton`**: Audio mute/unmute control.
- **`VastCTAButton`**: Click-to-action button ("Learn More") triggering validated click-through.
- **`VastCloseButton`**: Dismiss control for NonLinear banners and Text ads.
- **`VastImageAd`**: Responsive NonLinear banner preserving aspect ratios.
- **`VastTextAd`**: Native/HTML card rendering the custom `TextAd` extension.
- **`VastCompanionAd`**: Outside-player or inline companion ad unit supporting image and HTML.

---

## 🎨 UI Customization, Themes & Render Props

### 1. Theme Configuration

```tsx
<VastAdOverlay
  state={ads.state}
  ui={{
    enabled: true,
    theme: 'dark', // 'dark' | 'light' | 'custom'
    adBadge: {
      enabled: true,
      text: 'SPONSORED',
      position: 'top-left',
      backgroundColor: '#000000',
      textColor: '#ffffff',
    },
    skipButton: {
      enabled: true,
      text: 'Skip',
      countdownTemplate: 'Skip in {countdown}s',
      position: 'bottom-right',
      backgroundColor: '#1f2937',
      borderRadius: 8,
      fontSize: 14,
    },
    progressBar: {
      enabled: true,
      color: '#ef4444',
      height: 4,
    },
    ctaButton: {
      enabled: true,
      text: 'Explore Deal',
      backgroundColor: '#2563eb',
    },
  }}
/>
```

### 2. Custom Render Props

Replace any built-in control with your own component while retaining typed props and state:

```tsx
<VastAdOverlay
  state={ads.state}
  renderSkipButton={(props) => (
    <MyCustomSkipButton
      canSkip={props.canSkip}
      countdown={props.skipCountdown}
      onPress={props.onSkip}
    />
  )}
  renderAdBadge={(props) => (
    <MyCustomBadge label={props.text} />
  )}
  renderCTA={(props) => (
    <MyCustomCTA label={props.text} onPress={props.onClick} />
  )}
  renderCountdown={(props) => (
    <MyCustomCountdown formattedTime={props.formattedTime} />
  )}
/>
```

### 3. Headless Mode

Disable all built-in UI by setting `ui: { enabled: false }`. The advertising engine, VAST/VMAP parser, scheduler, and tracking quartiles continue operating normally:

```tsx
const ads = useVastAds({
  adTagUrl: 'https://example.com/ad-response.xml',
  ui: { enabled: false }, // Headless mode
});

return (
  <View>
    <Video paused={ads.shouldPauseContent} ... />

    {/* Custom developer UI built completely from scratch */}
    {ads.isAdActive && (
      <MyBespokeAdBanner
        remaining={ads.state.duration - ads.state.currentTime}
        canSkip={ads.state.canSkip}
        onSkip={ads.skipAd}
      />
    )}
  </View>
);
```

---

## 📜 VAST 3.0 / 4.x Specification Support

- **Elements Supported**: `VAST`, `Ad`, `InLine`, `Wrapper`, `AdSystem`, `AdTitle`, `Description`, `Error`, `Impression`, `Creatives`, `Linear`, `NonLinearAds`, `CompanionAds`, `MediaFiles`, `Duration`, `skipoffset`, `VideoClicks`, `TrackingEvents`, `Icons`.
- **Media File Selection**: Automatically evaluates progressive and streaming files, sorting by resolution, bitrate match, and device MIME type support.
- **Robust Parsing**: Handles CDATA tags, XML namespaces, missing/empty values, and malformed tags gracefully using `fast-xml-parser`.
- **Recursive Wrapper Resolution**:
  - Follows wrapper chains up to `maxWrapperDepth` (default: 5).
  - Detects circular wrapper redirection loops.
  - Merges tracking events, impressions, and error URLs down the chain.
  - Applies fallback behavior when no ads are returned.

---

## 🎯 Custom VAST Extensions

The SDK natively parses our advertising system's custom extensions:

### 1. `RollPlacement`
```xml
<Extension type="RollPlacement">
  <Placement>preroll</Placement> <!-- preroll, midroll, postroll -->
</Extension>
```

### 2. `BannerPlacement`
```xml
<Extension type="BannerPlacement">
  <Placement>overlay_banner</Placement>
</Extension>
```

### 3. `TextAd`
```xml
<Extension type="TextAd">
  <TextOverlay enabled="true">
    <Title>Special Promotion</Title>
    <Description>Subscribe today and get a 50% discount!</Description>
    <CtaButton>Learn More</CtaButton>
    <ClickUrl>https://example.com/promo</ClickUrl>
  </TextOverlay>
</Extension>
```

### 4. `CompanionDisplay`
```xml
<Extension type="CompanionDisplay">
  <Position>outside_player</Position>
  <Width>300</Width>
  <Height>250</Height>
</Extension>
```

---

## ⏱ VMAP 1.0.1 Support & Ad Scheduler

- **Supported Offsets**:
  - `timeOffset="start"` (Pre-roll)
  - `timeOffset="end"` (Post-roll)
  - `timeOffset="00:05:00"` (Timecode Mid-roll)
  - `timeOffset="25%"` (Percentage Mid-roll)
  - `timeOffset="#1"` (Sequence position)
- **Seek Detection & Missed Breaks**:
  - When a user seeks forward across mid-rolls, the scheduler detects missed breaks according to `missedBreakPolicy`:
    - `'play-last'` (default): Plays the most recently missed break before resuming playback.
    - `'play-all'`: Queues all missed breaks in order.
    - `'ignore'`: Marks missed breaks as skipped and jumps directly to the seek target.
- **Concurrency & Duplication Protection**:
  - Never plays the same break twice unless configured with `repeatAfter`.
  - Protects active ads from being interrupted by concurrent break requests.

---

## 📊 Configurable Tracking Engine

Every tracking event has an independent toggle:

```ts
tracking: {
  enabled: true,

  impression: true,
  creativeView: true,

  start: true,
  firstQuartile: true,
  midpoint: true,
  thirdQuartile: true,
  complete: true,

  skip: true,
  mute: true,
  unmute: true,
  pause: true,
  resume: true,
  fullscreen: true,
  exitFullscreen: true,

  clickTracking: true,
  error: true,
  companionImpression: true,

  timeoutMs: 5000,
  maxRetries: 1,
}
```

- **Quartile Precision**: Uses actual media progress ratios (25%, 50%, 75%, 100%) to trigger quartiles.
- **Deduplication**: Guaranteed never to send the same milestone twice for the same ad lifecycle.
- **Non-Blocking Transport**: Network errors or tracking server failures never block or crash ad playback.
- **Macro Replacement**: Automatically substitutes standard VAST macros:
  - `[TIMESTAMP]` / `%%TIMESTAMP%%`
  - `[CACHEBUSTING]` / `%%CACHEBUSTING%%`
  - `[ERRORCODE]` / `%%ERRORCODE%%`
  - `[CONTENTPLAYHEAD]` / `%%CONTENTPLAYHEAD%%`
  - `[ASSETURI]` / `%%ASSETURI%%`
  - Custom user-defined macros

---

## 🔄 Lifecycle State Machine

The SDK enforces an explicit 13-state Finite State Machine (FSM):

```text
idle -> loading -> ready -> contentPlaying
                             │
                             ├─► adLoading -> adReady -> adPlaying <-> adPaused
                             │                                │
                             │                                ├─► adSkipped ──┐
                             │                                ├─► adCompleted ┼─► contentPlaying
                             │                                └─► adError ────┘
                             │
                             └─► contentCompleted -> destroyed
```

### Callbacks Available

- `onAdLoaded`: Fired when creative metadata and media are prepared.
- `onAdStart`: Fired when the ad begins playback.
- `onAdProgress`: Real-time ad progress, remaining seconds, and skip countdown.
- `onAdSkip`: Fired when the user skips the ad.
- `onAdComplete`: Fired when the ad finishes normally.
- `onAdError`: Fired on playback or parsing failure.
- `onAdClick`: Fired on user interaction with validated click-through.
- `onContentPause` / `onContentResume`: Signals to pause/resume main video content.

---

## 🔒 Security

1. **Protocol Validation**: Strictly blocks dangerous URL schemes (`javascript:`, `vbscript:`, `file:`, `data:`) on click-throughs and resource links. Only `https:`, `http:`, `mailto:`, and `tel:` protocols are permitted.
2. **HTML Sanitization**: Sanitizes `HTMLResource` and `TextAd` content by stripping `<script>`, `<iframe>`, `<object>`, inline event handlers (`onload`, `onerror`), and malicious attributes to prevent XSS attacks.
3. **Native UI Isolation**: React Native uses standard native primitives (`View`, `Text`, `Image`) rather than forcing arbitrary WebView JavaScript execution.

---

## 🔌 Generic PlayerAdapter Contract

To integrate any custom or proprietary video player, implement the `PlayerAdapter` interface:

```ts
import { BasePlayerAdapter, type PlayerEvent } from 'react-ad-engine/core';

export class MyCustomPlayerAdapter extends BasePlayerAdapter {
  private playerInstance: any;

  constructor(playerInstance: any) {
    super();
    this.playerInstance = playerInstance;

    // Listen to your player's events and emit them to the SDK
    this.playerInstance.on('timeupdate', (time: number, duration: number) => {
      this.emit({ type: 'progress', currentTime: time, duration });
    });
    this.playerInstance.on('ended', () => {
      this.emit({ type: 'ended' });
    });
  }

  public pauseContent(): void {
    this.playerInstance.pause();
  }

  public resumeContent(): void {
    this.playerInstance.play();
  }

  public seekTo(time: number): void {
    this.playerInstance.seek(time);
  }

  public getCurrentTime(): number {
    return this.playerInstance.currentTime;
  }

  public getDuration(): number {
    return this.playerInstance.duration;
  }

  public isPaused(): boolean {
    return this.playerInstance.isPaused;
  }
}
```

---

## 🧪 Automated Testing

The SDK includes 28 automated tests covering all mandatory fixtures, edge cases, and integrations:

```bash
# Run unit and integration tests
pnpm test

# Run strict TypeScript typecheck
pnpm typecheck
```

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).
