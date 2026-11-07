# Changelog

All notable changes to `react-ad-engine` will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [1.0.0] - 2026-11-07

### Added
- **Core Engine**:
  - Player-agnostic architecture: Developer owns video player, SDK owns the advertising experience.
  - VAST 3.0 (and 4.x extensible) Parser using high-performance, pure TypeScript `fast-xml-parser` with full CDATA and namespace support.
  - VAST Wrapper Resolver with recursive resolution, cycle detection, depth limits (`maxWrapperDepth`), timeout handling, and tracking/impression inheritance.
  - VMAP 1.0.1 Parser supporting start, end, timecode (`hh:mm:ss[.mmm]`), percentage (`n%`), and sequence offsets.
  - Ad Break Scheduler with mid-roll seek detection and configurable missed break policies (`play-last`, `play-all`, `ignore`).
  - Strict 13-state Finite State Machine (FSM) preventing invalid lifecycle transitions.
  - Configurable Tracking Manager with individual event toggles, multiple URLs, background non-blocking transport, deduplication, and macro replacement (`[TIMESTAMP]`, `[CACHEBUSTING]`, `[ERRORCODE]`, `[CONTENTPLAYHEAD]`, `[ASSETURI]`).
  - Media Selection Manager ranking bitrate, delivery type, resolution, and supported MIME types.
  - Security suite: Lightweight HTML sanitizer for XSS protection and strict URL protocol validation (`javascript:`, `vbscript:`, etc. blocked).
  - Generic `PlayerAdapter` interface and `BasePlayerAdapter` abstraction.
  - Master `VastEngine` with unified `loadAdTag(urlOrXml)` auto-detecting VAST and VMAP.

- **Custom VAST Extensions**:
  - `RollPlacement`: Parses `<Placement>preroll|midroll|postroll</Placement>`.
  - `BannerPlacement`: Parses `<Placement>overlay_banner</Placement>`.
  - `TextAd`: Parses `<TextOverlay enabled="true">` with Title, Description, CtaButton, ClickUrl.
  - `CompanionDisplay`: Parses `<Position>outside_player</Position>`, Width, Height.

- **React Integration**:
  - `useVastAds` and `useVmapAds` hooks with automatic lifecycle synchronization and state snapshots.
  - Unified `adTagUrl` parameter automatically routing to VAST or VMAP.
  - Dynamic ad loading via `ads.loadAdTag(urlOrXml)`.

- **Built-in UI Engine**:
  - Fully responsive, production-ready built-in components for both Web and React Native:
    - `VastAdOverlay`: Master overlay handling lifecycle visibility.
    - `VastAdContainer`: Responsive bounds with touch handling.
    - `VastAdBadge`: Configurable "ADVERTISEMENT" badge.
    - `VastCountdown`: Remaining time counter (`0:15`).
    - `VastSkipButton`: Countdown prior to skipoffset, transforming to "Skip Ad" button once available.
    - `VastProgressBar`: Elapsed playback progress bar.
    - `VastMuteButton`: Audio mute toggle.
    - `VastCTAButton`: Call-to-action button with safe click-through.
    - `VastCloseButton`: Dismiss button for banners and text ads.
    - `VastImageAd`: NonLinear banner image renderer with aspect ratio preservation.
    - `VastTextAd`: Pure native/HTML card for custom TextAd extension.
    - `VastCompanionAd`: Outside-player or inline companion ad unit.
  - Complete theme system (`dark`, `light`, or custom colors, fonts, margins, paddings, border radiuses).
  - Custom Render Props for all UI controls (`renderSkipButton`, `renderAdBadge`, `renderCTA`, etc.).
  - Headless Mode (`ui: { enabled: false }`) allowing 100% custom developer-built UI while maintaining scheduling, tracking, and lifecycle.

- **Integrations**:
  - `ReactNativeVideoV7Adapter` for seamless integration with `react-native-video` v7 (zero dependency).
  - `Html5VideoAdapter` for standard HTML5 `<video>` elements.

- **Testing & Documentation**:
  - 28 automated tests covering all 4 mandatory creative fixtures (Linear Video, NonLinear Image, HTML/Text, Companion), VMAP, Wrappers, Seeking, Tracking, and UI customization.
  - Full TypeScript type definitions with 100% passing `tsc --noEmit`.
