import type {
  AdState,
  AdStateSnapshot,
  AdLifecycleCallbacks,
} from '../types/lifecycle';
import type { VastCreative, VastMediaFile, VastCompanion, VastNonLinear } from '../types/vast';
import type { TextAdData } from '../types/custom-extensions';

const VALID_TRANSITIONS: Record<AdState, AdState[]> = {
  idle: ['loading', 'ready', 'contentPlaying', 'adLoading', 'destroyed'],
  loading: ['ready', 'adLoading', 'adPlaying', 'contentPlaying', 'adError', 'destroyed'],
  ready: ['contentPlaying', 'adLoading', 'adPlaying', 'destroyed'],
  contentPlaying: ['adLoading', 'adPlaying', 'contentCompleted', 'destroyed'],
  adLoading: ['adReady', 'adPlaying', 'adError', 'contentPlaying', 'contentCompleted', 'destroyed'],
  adReady: ['adPlaying', 'adError', 'contentPlaying', 'destroyed'],
  adPlaying: ['adPaused', 'adSkipped', 'adCompleted', 'adError', 'contentPlaying', 'contentCompleted', 'destroyed'],
  adPaused: ['adPlaying', 'adSkipped', 'adCompleted', 'adError', 'contentPlaying', 'destroyed'],
  adSkipped: ['contentPlaying', 'contentCompleted', 'adLoading', 'idle', 'destroyed'],
  adCompleted: ['contentPlaying', 'contentCompleted', 'adLoading', 'idle', 'destroyed'],
  adError: ['contentPlaying', 'contentCompleted', 'idle', 'destroyed'],
  contentCompleted: ['idle', 'adLoading', 'adPlaying', 'destroyed'],
  destroyed: [],
};

export class AdStateMachine {
  private currentState: AdState = 'idle';
  private callbacks: AdLifecycleCallbacks = {};

  private currentCreative: VastCreative | null = null;
  private currentMediaFile: VastMediaFile | null = null;
  private currentTime = 0;
  private duration = 0;
  private skipoffset: number | undefined = undefined;
  private isMuted = false;
  private companionAds: VastCompanion[] = [];
  private nonLinearAds: VastNonLinear[] = [];
  private textAd: TextAdData | null = null;
  private lastError: Error | null = null;

  constructor(callbacks?: AdLifecycleCallbacks) {
    if (callbacks) {
      this.callbacks = callbacks;
    }
  }

  public setCallbacks(callbacks: AdLifecycleCallbacks): void {
    this.callbacks = { ...this.callbacks, ...callbacks };
  }

  public getState(): AdState {
    return this.currentState;
  }

  public transitionTo(nextState: AdState): boolean {
    if (this.currentState === nextState) return true;

    if (this.currentState === 'destroyed') {
      return false;
    }

    const allowed = VALID_TRANSITIONS[this.currentState];
    if (!allowed || !allowed.includes(nextState)) {
      // Transition not allowed
      return false;
    }

    const prevState = this.currentState;
    this.currentState = nextState;

    // Trigger state change callbacks
    this.callbacks.onStateChange?.(nextState, prevState);
    this.callbacks.onAdEvent?.('stateChange', { currentState: nextState, prevState });

    // Handle specific entry transitions
    switch (nextState) {
      case 'adPlaying':
        if (this.currentCreative) {
          this.callbacks.onAdStart?.(this.currentCreative);
          this.callbacks.onAdEvent?.('adStart', this.currentCreative);
        }
        break;
      case 'adPaused':
        this.callbacks.onAdPause?.();
        this.callbacks.onAdEvent?.('adPause');
        break;
      case 'adSkipped':
        this.callbacks.onAdSkip?.();
        this.callbacks.onAdEvent?.('adSkip');
        break;
      case 'adCompleted':
        this.callbacks.onAdComplete?.();
        this.callbacks.onAdEvent?.('adComplete');
        break;
      case 'adError':
        if (this.lastError) {
          this.callbacks.onAdError?.(this.lastError);
          this.callbacks.onAdEvent?.('adError', this.lastError);
        }
        break;
      case 'contentPlaying':
        this.callbacks.onContentResume?.();
        this.callbacks.onAdEvent?.('contentResume');
        break;
    }

    return true;
  }

  public setAdCreative(
    creative: VastCreative,
    mediaFile: VastMediaFile | null,
    companionAds: VastCompanion[] = [],
    nonLinearAds: VastNonLinear[] = [],
    textAd: TextAdData | null = null
  ): void {
    this.currentCreative = creative;
    this.currentMediaFile = mediaFile;
    this.companionAds = companionAds;
    this.nonLinearAds = nonLinearAds;
    this.textAd = textAd;

    if (creative.linear) {
      this.duration = creative.linear.duration;
      this.skipoffset = creative.linear.skipoffset;
    } else {
      this.duration = 0;
      this.skipoffset = undefined;
    }

    this.currentTime = 0;
    this.callbacks.onAdLoaded?.(creative);
    this.callbacks.onAdEvent?.('adLoaded', creative);
  }

  public updateAdProgress(time: number, totalDuration?: number): void {
    this.currentTime = Math.max(0, time);
    if (totalDuration !== undefined && totalDuration > 0) {
      this.duration = totalDuration;
    }

    const snap = this.getSnapshot();
    const progressData = {
      currentTime: this.currentTime,
      duration: this.duration,
      remainingTime: Math.max(0, this.duration - this.currentTime),
      progress: snap.progress,
      isSkippable: snap.isSkippable,
      skipCountdown: snap.skipCountdown,
    };

    this.callbacks.onAdProgress?.(progressData);
    this.callbacks.onAdEvent?.('adProgress', progressData);
  }

  public setMuted(muted: boolean): void {
    this.isMuted = muted;
  }

  public setError(err: Error): void {
    this.lastError = err;
    this.transitionTo('adError');
  }

  public getSnapshot(): AdStateSnapshot {
    const isAdActive =
      this.currentState === 'adLoading' ||
      this.currentState === 'adReady' ||
      this.currentState === 'adPlaying' ||
      this.currentState === 'adPaused';

    const progress = this.duration > 0 ? Math.min(1, Math.max(0, this.currentTime / this.duration)) : 0;
    const isSkippable = this.skipoffset !== undefined;
    const skipCountdown = isSkippable ? Math.max(0, Math.ceil(this.skipoffset! - this.currentTime)) : 0;
    const canSkip = isSkippable && skipCountdown <= 0;

    return {
      state: this.currentState,
      isAdActive,
      shouldPauseContent: isAdActive,
      currentCreative: this.currentCreative,
      currentMediaFile: this.currentMediaFile,
      currentTime: this.currentTime,
      duration: this.duration,
      progress,
      isSkippable,
      canSkip,
      skipCountdown,
      isPaused: this.currentState === 'adPaused',
      isMuted: this.isMuted,
      companionAds: this.companionAds,
      nonLinearAds: this.nonLinearAds,
      textAd: this.textAd,
      error: this.lastError,
    };
  }

  public reset(): void {
    this.currentCreative = null;
    this.currentMediaFile = null;
    this.currentTime = 0;
    this.duration = 0;
    this.skipoffset = undefined;
    this.companionAds = [];
    this.nonLinearAds = [];
    this.textAd = null;
    this.lastError = null;
    this.transitionTo('idle');
  }

  public destroy(): void {
    this.transitionTo('destroyed');
    this.callbacks = {};
  }
}
