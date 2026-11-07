import type { VastCreative, VastMediaFile, VastCompanion, VastNonLinear } from './vast';
import type { TextAdData } from './custom-extensions';

export type AdState =
  | 'idle'
  | 'loading'
  | 'ready'
  | 'contentPlaying'
  | 'adLoading'
  | 'adReady'
  | 'adPlaying'
  | 'adPaused'
  | 'adSkipped'
  | 'adCompleted'
  | 'adError'
  | 'contentCompleted'
  | 'destroyed';

export type AdEventType =
  | 'adLoaded'
  | 'adStart'
  | 'adProgress'
  | 'adPause'
  | 'adResume'
  | 'adSkip'
  | 'adComplete'
  | 'adError'
  | 'adClick'
  | 'adImpression'
  | 'contentPause'
  | 'contentResume'
  | 'stateChange';

export interface AdProgressData {
  currentTime: number;
  duration: number;
  remainingTime: number;
  progress: number; // 0 to 1
  isSkippable: boolean;
  skipCountdown: number; // seconds remaining until skip is allowed
}

export interface AdStateSnapshot {
  state: AdState;
  isAdActive: boolean;
  shouldPauseContent: boolean;
  currentCreative: VastCreative | null;
  currentMediaFile: VastMediaFile | null;
  currentTime: number;
  duration: number;
  progress: number;
  isSkippable: boolean;
  canSkip: boolean; // true if skip is currently available
  skipCountdown: number;
  isPaused: boolean;
  isMuted: boolean;
  companionAds: VastCompanion[];
  nonLinearAds: VastNonLinear[];
  textAd: TextAdData | null;
  error: Error | null;
}

export interface AdLifecycleCallbacks {
  onAdLoaded?: (creative: VastCreative) => void;
  onAdStart?: (creative: VastCreative) => void;
  onAdProgress?: (data: AdProgressData) => void;
  onAdPause?: () => void;
  onAdResume?: () => void;
  onAdSkip?: () => void;
  onAdComplete?: () => void;
  onAdError?: (error: Error) => void;
  onAdClick?: (url?: string) => void;
  onAdImpression?: (urls: string[]) => void;
  onContentPause?: () => void;
  onContentResume?: () => void;
  onAdEvent?: (type: AdEventType, payload?: any) => void;
  onStateChange?: (state: AdState, prevState: AdState) => void;
}
