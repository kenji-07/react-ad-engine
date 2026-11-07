# React Ad Engine (Custom Cross-Platform VAST / VMAP Advertising SDK)

React Native, Expo болон Web (HTML5) орчинд ажиллах зориулалттай, тоглуулагчаас бүрэн хамааралгүй (player-agnostic), үйлдвэрлэлийн түвшний (production-ready) VAST / VMAP зар сурталчилгааны SDK.

---

## 🌟 Үндсэн зарчим (Core Philosophy)

> **"Тоглуулагчийг хөгжүүлэгч эзэмшинэ. Зар сурталчилгааны туршлагыг манай SDK удирдана."**
> 
> *(The developer owns the video player. Our SDK owns the advertising experience.)*

Манай SDK нь өөрөө видео тоглуулагч үүсгэхгүй, өмчлөхгүй. Хөгжүүлэгч өөрийн ашиглаж буй ямар ч видео тоглуулагчийг (Жишээ нь: `react-native-video` v7, Expo Video, HTML5 Video гэх мэт) энэхүү SDK-тэй ерөнхий `PlayerAdapter` интерфейсээр холбож ашиглана.

---

## 🚀 Хувилбарын нийцтэй байдал (Compatibility)

- **React:** `>=18.0.0` (React 18.x, **React 19.3.0, 19.3.1** болон түүнээс дээш бүх хувилбартай 100% нийцтэй).
- **React Native:** `>=0.70.0` (**0.73.x, 0.74.x, 0.75.x, 0.76.x, 0.80+** болон шинэ New Architecture-тай бүрэн нийцтэй).
- **Expo:** SDK 50, 51, 52 болон түүнээс дээш (`expo-video`, `expo-av`).
- **Web:** Орчин үеийн бүх веб хөтөч (Chrome, Safari, Firefox, Edge, Mobile Web).
- **Zero Video Dependency:** SDK-ийн үндсэн цөм нь `react-native-video`, Google IMA, эсвэл гуравдагч тоглуулагчаас ямар ч хамааралгүй (0 runtime dependency).

---

## 📦 Суулгах (Installation)

```bash
# npm ашиглан
npm install react-ad-engine fast-xml-parser

# yarn ашиглан
yarn add react-ad-engine fast-xml-parser

# pnpm ашиглан
pnpm add react-ad-engine fast-xml-parser
```

---

## 🏗 Модульчлагдсан Бүтэц (Architecture)

```text
packages/
  ├── core/            # Платформоос хамааралгүй цэвэр TypeScript цөм
  │   ├── parser/      # VAST 3.0, VMAP 1.0.1, Custom Extensions, Wrapper Resolver
  │   ├── scheduler/   # Ad Scheduler, Midroll Seek Detection, Missed-break бодлого
  │   ├── tracking/    # Configurable Tracking Engine, Macro Replacement, Deduplication
  │   ├── lifecycle/   # 13 төлөвт Ad State Machine (idle, loading, adPlaying ...)
  │   ├── media/       # Media Selection (Bitrate, Resolution, MimeType)
  │   ├── security/    # HTML Sanitizer, Safe URL Protocol Validator
  │   └── engine/      # VastEngine мастер зохицуулагч
  │
  ├── react/           # React Hooks (useVastAds, useVmapAds, UI Theme тохиргоо)
  ├── web/             # Вебэд зориулсан Built-in UI, HTML5 Video Adapter
  ├── react-native/    # React Native Built-in UI, Native TextAd & ImageAd
  ├── expo/            # Expo зориулалтын тохиргоо болон ExpoVideoAdapter
  └── integrations/    # react-native-video v7, Expo Video, HTML5 тоглуулагчийн адаптерууд
```

---

## ⚡️ Хурдан эхлэх (Quick Start)

### 1. React Native & `react-native-video` v7 жишээ

> Санамж: Төсөл дээрээ `react-native-video` v7-ийг өөрөө суулгасан байна. Манай SDK түүнийг шаардахгүй.

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
    vastUrl: 'https://example.com/preroll.vast.xml',
    playerAdapter: adapterRef.current,
    ui: {
      theme: 'dark',
      adBadge: { text: 'ЗАР СУРТАЛЧИЛГАА' },
      skipButton: { text: 'Алгасах', countdownTemplate: '{countdown}с дараа алгасах' },
      ctaButton: { text: 'Дэлгэрэнгүй үзэх' },
    },
  });

  return (
    <View style={styles.container}>
      {/* Хөгжүүлэгчийн өөрийн эзэмшлийн Video компонент */}
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

      {/* Зар сурталчилгааны бэлэн UI давхарга (Зар тоглох үед л автоматаар гарна) */}
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

### 2. Expo видео тоглуулагчтай холбох

```tsx
import React, { useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import { useVideoPlayer, VideoView } from 'expo-video';
import { useVastAds } from 'react-ad-engine/react';
import { VastAdOverlay } from 'react-ad-engine/react-native';
import { ExpoVideoAdapter } from 'react-ad-engine/integrations';

export function ExpoPlayerScreen() {
  const player = useVideoPlayer('https://example.com/movie.mp4');
  const adapter = useMemo(() => new ExpoVideoAdapter(player), [player]);

  const ads = useVastAds({
    vmapUrl: 'https://example.com/vmap-breaks.xml',
    playerAdapter: adapter,
  });

  return (
    <View style={styles.container}>
      <VideoView player={player} style={styles.video} />

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
  container: { width: '100%', aspectRatio: 16 / 9 },
  video: { width: '100%', height: '100%' },
});
```

---

### 3. Web (HTML5) видео тоглуулагчтай холбох

```tsx
import React, { useRef, useEffect } from 'react';
import { useVastAds } from 'react-ad-engine/react';
import { VastAdOverlay, Html5VideoAdapter } from 'react-ad-engine/web';

export function WebPlayer() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const adapterRef = useRef(new Html5VideoAdapter());

  const ads = useVastAds({
    vastUrl: 'https://example.com/linear-ad.vast.xml',
    playerAdapter: adapterRef.current,
  });

  useEffect(() => {
    if (videoRef.current) {
      adapterRef.current.attach(videoRef.current);
    }
  }, []);

  return (
    <div style={{ position: 'relative', width: 640, height: 360 }}>
      <video
        ref={videoRef}
        src="https://example.com/stream.mp4"
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

## 🧩 Зар сурталчилгааны Бэлэн UI Бүрдлүүд (Built-in Advertising UI)

Хөгжүүлэгч зарын UI-г гараар угсрах шаардлагагүй. SDK нь дараах бүрэлдэхүүн хэсгүүдийг агуулна:

- **`VastAdOverlay`**: Бүх зарын элементийг нэгтгэн зөв цагт харуулдаг мастер оверлей.
- **`VastAdContainer`**: Responsive харьцаа, зөв pointer-events бүхий сав.
- **`VastAdBadge`**: "ADVERTISEMENT" / "ЗАР СУРТАЛЧИЛГАА" тэмдэглэгээ.
- **`VastCountdown`**: Үлдсэн хугацааг харуулах тоолуур (жишээ: 0:15).
- **`VastSkipButton`**: `skipoffset`-ийн өмнө "5с дараа алгасах", хугацаа болмогц "Алгасах" болж хувирах ухаалаг товч.
- **`VastProgressBar`**: Зарын тоглуулалтын явцыг харуулах хувийн шугам.
- **`VastMuteButton`**: Дуу хаах/нээх товчлуур.
- **`VastCTAButton`**: "Learn More" / "Дэлгэрэнгүй үзэх" товчлуур (ClickThrough холбоостой).
- **`VastCloseButton`**: Баннер болон текст зарыг хаах товч.
- **`VastImageAd`**: NonLinear зурган баннер зар.
- **`VastTextAd`**: Тусгай `TextAd` өргөтгөлийн текстийн карт зар.
- **`VastCompanionAd`**: Тоглуулагчийн гадна эсвэл хажууд байрлах Companion зар.

---

## 🎨 UI Өөрчлөх ба Загварчлах (UI Customization)

### 1. Theme болон Тохиргоо дамжуулах

```tsx
<VastAdOverlay
  state={ads.state}
  ui={{
    enabled: true,
    theme: 'dark', // 'dark' | 'light' | 'custom'
    adBadge: {
      enabled: true,
      text: 'ИВЭЭН ТЭТГЭГЧИЙН ЗАР',
      position: 'top-left',
      backgroundColor: '#000000',
      textColor: '#ffffff',
    },
    skipButton: {
      enabled: true,
      text: 'Алгасах',
      countdownTemplate: '{countdown}с дараа алгасаж болно',
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
      text: 'Дэлгэрэнгүй мэдээлэл',
      backgroundColor: '#2563eb',
    },
  }}
/>
```

### 2. Custom Render Props (Бүрэлдэхүүн хэсгийг өөрийнхөөрөө солих)

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
    <MyCustomBadge title={props.text} />
  )}
  renderCTA={(props) => (
    <MyCustomCTAButton label={props.text} onPress={props.onClick} />
  )}
/>
```

### 3. Headless Mode (Бүх бэлэн UI-г унтраах)

Хэрэв та өөрийн гэсэн цоо шинэ UI зурахыг хүсвэл `ui: { enabled: false }` гэж өгөхөд хангалттай. Зарын хуваарь (scheduler), VAST задлагч, Tracking Quartiles, State Machine хэвийн ажилласаар байна:

```tsx
const ads = useVastAds({
  vastUrl: 'https://example.com/vast.xml',
  ui: { enabled: false }, // Headless mode
});

return (
  <View>
    <Video paused={ads.shouldPauseContent} ... />
    
    {ads.isAdActive && (
      <MyBespokeAdView
        remainingTime={ads.state.duration - ads.state.currentTime}
        canSkip={ads.state.canSkip}
        onSkip={ads.skipAd}
      />
    )}
  </View>
);
```

---

## 📜 VAST 3.0 / 4.x Дэмжлэг

SDK нь IAB VAST стандартын дагуу дараах бүх элементүүдийг бүрэн дэмжинэ:

- **Бүтэц:** `VAST`, `Ad`, `InLine`, `Wrapper`, `AdSystem`, `AdTitle`, `Description`, `Error`, `Impression`, `Creatives`.
- **Креативууд:**
  - `Linear`: `Duration`, `skipoffset` (hh:mm:ss, хувь, секунд), `MediaFiles` (mp4, webm, hls, bitrate, resolution сонголт), `VideoClicks` (`ClickThrough`, `ClickTracking`, `CustomClick`), `TrackingEvents`.
  - `NonLinearAds`: `NonLinear` (`StaticResource`, `HTMLResource`, `IFrameResource`, `NonLinearClickThrough`).
  - `CompanionAds`: `Companion` (Зураг, HTML, AltText, ClickThrough).
- **Wrapper Resolution:**
  - Дамжин дуудагдсан Wrapper-уудыг рекурсивээр тайлна.
  - Тохируулж болох хамгийн дээд гүн (`maxWrapperDepth: 5`).
  - Хүсэлтийн хугацаа дуусах хязгаар (`timeoutMs`).
  - Цикл холбоос илрүүлэх (`Circular wrapper redirection detected`).
  - Tracking events, Impressions, Error URL-уудыг өвлүүлэн нэгтгэнэ.
  - Fallback бодлого.

---

## 🎯 Манай Системийн Тусгай VAST Өргөтгөлүүд (Custom Extensions)

SDK нь танай зар сурталчилгааны системийн 4 тусгай өргөтгөлийг автоматаар ялган таньж, дотоод загварт хувиргадаг:

### 1. RollPlacement (Зарын байрлал)
```xml
<Extension type="RollPlacement">
  <Placement>preroll</Placement> <!-- preroll, midroll, postroll -->
</Extension>
```

### 2. BannerPlacement (Баннерын байрлал)
```xml
<Extension type="BannerPlacement">
  <Placement>overlay_banner</Placement>
</Extension>
```

### 3. TextAd (Текст зар)
```xml
<Extension type="TextAd">
  <TextOverlay enabled="true">
    <Title>Онцгой Урамшуулал</Title>
    <Description>Өнөөдөр бүртгүүлээд 50%-ийн хөнгөлөлт аваарай!</Description>
    <CtaButton>Дэлгэрэнгүй үзэх</CtaButton>
    <ClickUrl>https://example.com/promo</ClickUrl>
  </TextOverlay>
</Extension>
```

### 4. CompanionDisplay (Дагалдах зарын харагдах байдал)
```xml
<Extension type="CompanionDisplay">
  <Position>outside_player</Position>
  <Width>300</Width>
  <Height>250</Height>
</Extension>
```

---

## ⏱ VMAP 1.0.1 Дэмжлэг ба Хуваарь (Ad Scheduler)

- **Цагийн тохиргоонууд:**
  - `timeOffset="start"` (Pre-roll)
  - `timeOffset="end"` (Post-roll)
  - `timeOffset="00:05:00"` (Цаг хугацааны Mid-roll)
  - `timeOffset="25%"` (Хувиар тооцох Mid-roll)
- **Seek Detection & Missed Breaks (Гүйлгэх үеийн бодлого):**
  - Хэрэглэгч видеог урагш гүйлгэж Mid-roll зарыг алгасах үед автоматаар илрүүлнэ.
  - `missedBreakPolicy`:
    - `'play-last'`: Алгассан заруудын хамгийн сүүлчийнхийг нь тоглуулаад үндсэн контентыг үргэлжлүүлнэ.
    - `'play-all'`: Алгассан бүх зарыг дарааллаар нь тоглуулна.
    - `'ignore'`: Алгассан заруудыг тоглосон гэж тооцоод шууд гүйлгэсэн цэг рүү шилжинэ.
- **Давталтын хяналт:** Тоглосон зарыг дахин тоглохгүй байх баталгаа.
- **Active Ad хамгаалалт:** Зар тоглогдож байх үед өөр зар зэрэгцэн орохгүй.

---

## 📊 Хяналтын Систем (Configurable Tracking System)

Бүх tracking үйл явдлууд тус бүрдээ унтрааж/асааж болох бие даасан тохиргоотой:

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

- **Deduplication:** Нэг зарын мөчлөгт ижил Quartile эсвэл Impression үйл явдлыг 2 дахин хэзээ ч явуулахгүй.
- **Non-blocking:** Сүлжээний алдаа эсвэл tracking сервер унасан ч зарын тоглуулалт зогсохгүй, тасалдахгүй.
- **Макро орлуулалт:** `[TIMESTAMP]`, `[CACHEBUSTING]`, `[ERRORCODE]`, `[CONTENTPLAYHEAD]`, `[ASSETURI]` болон custom макрог автоматаар онооно.

---

## 🔄 Төлөвийн Машин (Ad Lifecycle States)

SDK нь алдаатай шилжилтээс сэргийлсэн Finite State Machine ашигладаг:

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

---

## 🔒 Аюулгүй Байдал (Security)

1. **URL Protocol Validation:** `javascript:`, `vbscript:`, `file:`, `data:` зэрэг хортой протоколуудыг ClickThrough холбоосоос хатуу шүүж хориглоно. Зөвхөн `https:`, `http:` зөвшөөрөгдөнө.
2. **HTML Sanitization:** HTMLResource болон TextAd доторх `<script>`, `<iframe>`, `<object>`, inline `onload/onerror/onclick` зэрэг XSS халдлагын кодуудыг автоматаар цэвэрлэнэ.
3. **Native Rendering:** React Native орчинд WebView шаардахгүйгээр цэвэр Native компонент ашиглан найдвартай дүрсэлнэ.

---

## 🧪 Туршилтын Үр Дүн (Automated Tests)

Төсөл нь дараах 28 автомат туршилттай (Бүгд амжилттай давсан):

1. **Linear Video Ad Fixture:** Хэмжээ, skipoffset (5s), медиа файл сонголт, Quartile болон progress tracking, RollPlacement (preroll).
2. **NonLinear Image Ad Fixture:** Статик зураг, хэмжээс, ClickThrough, BannerPlacement (overlay_banner).
3. **HTML / Text Ad Fixture:** `TextAd` өргөтгөл (Title, Description, CTA, ClickUrl), HTMLResource.
4. **Companion Ad Fixture:** `CompanionDisplay` өргөтгөл, Статик зураг болон HTML banner, CompanionClickThrough.
5. **CDATA & Namespaces:** Тэмдэгт болон нэрийн талбарын алдаагүй задлалт.
6. **Wrapper Resolution:** Wrapper хэлхээ, гүний хязгаар, цикл шалгалт, Tracking өвлөлт.
7. **VMAP 1.0.1:** Preroll, Midroll, Postroll зарын дараалал.
8. **Seek Detection:** Midroll алгасаж гүйлгэх үеийн `play-last` болон `ignore` бодлого.
9. **Tracking Deduplication:** 25%, 50%, 75%, 100% quartiles давхардахгүй байх баталгаа.
10. **Player Adapters:** `react-native-video` v7, Expo Video, HTML5 Video адаптеруудын холболт.
11. **UI Customization:** Theme солих, custom render props, Headless горим.

```bash
# Туршилтуудыг ажиллуулах:
pnpm test

# Төрөл шалгах (Typecheck):
pnpm typecheck
```

---

## 📄 Лиценз (License)

MIT License.
