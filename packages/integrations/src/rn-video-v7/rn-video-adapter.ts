import { BasePlayerAdapter } from '@react-ad-engine/core';

/**
 * Minimal structural contract representing a react-native-video v7 ref
 * (Zero dependency - never imports react-native-video)
 */
export interface ReactNativeVideoRef {
  pause?: () => void;
  resume?: () => void;
  seek?: (time: number, tolerance?: number) => void;
}

export interface ReactNativeVideoOnLoadData {
  duration: number;
  currentTime?: number;
  [key: string]: any;
}

export interface ReactNativeVideoOnProgressData {
  currentTime: number;
  playableDuration?: number;
  seekableDuration?: number;
  [key: string]: any;
}

/**
 * PlayerAdapter for react-native-video v7
 * Works with react-native-video v7 ref and event props without coupling or importing it.
 */
export class ReactNativeVideoV7Adapter extends BasePlayerAdapter {
  private ref: ReactNativeVideoRef | null = null;
  private currentTime = 0;
  private duration = 0;
  private paused = false;

  constructor(videoRef?: ReactNativeVideoRef | null) {
    super();
    if (videoRef) {
      this.attachRef(videoRef);
    }
  }

  public attachRef(ref: ReactNativeVideoRef): void {
    this.ref = ref;
  }

  public detachRef(): void {
    this.ref = null;
  }

  public pauseContent(): void {
    this.paused = true;
    if (this.ref?.pause) {
      this.ref.pause();
    }
    this.emit({ type: 'pause' });
  }

  public resumeContent(): void {
    this.paused = false;
    if (this.ref?.resume) {
      this.ref.resume();
    }
    this.emit({ type: 'play' });
  }

  public seekTo(time: number): void {
    this.currentTime = time;
    if (this.ref?.seek) {
      this.ref.seek(time);
    }
    this.emit({ type: 'seeking', currentTime: time });
  }

  public getCurrentTime(): number {
    return this.currentTime;
  }

  public getDuration(): number {
    return this.duration;
  }

  public isPaused(): boolean {
    return this.paused;
  }

  // --- Callbacks to pass to <Video /> component ---

  public handleLoad = (data: ReactNativeVideoOnLoadData): void => {
    this.duration = data.duration;
    if (data.currentTime !== undefined) {
      this.currentTime = data.currentTime;
    }
    this.emit({ type: 'loaded', duration: this.duration, currentTime: this.currentTime });
  };

  public handleProgress = (data: ReactNativeVideoOnProgressData): void => {
    this.currentTime = data.currentTime;
    this.emit({ type: 'progress', currentTime: this.currentTime, duration: this.duration });
  };

  public handleEnd = (): void => {
    this.emit({ type: 'ended' });
  };

  public handleSeek = (data: { currentTime: number }): void => {
    this.currentTime = data.currentTime;
    this.emit({ type: 'seeked', currentTime: this.currentTime });
  };

  public handleError = (error: any): void => {
    this.emit({ type: 'error', error });
  };
}
