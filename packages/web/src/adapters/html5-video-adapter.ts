import { BasePlayerAdapter } from '@react-ad-engine/core';

export class Html5VideoAdapter extends BasePlayerAdapter {
  private video: HTMLVideoElement | null = null;
  private cleanups: Array<() => void> = [];

  constructor(videoElement?: HTMLVideoElement | null) {
    super();
    if (videoElement) {
      this.attach(videoElement);
    }
  }

  public attach(video: HTMLVideoElement): void {
    this.detach();
    this.video = video;

    const onPlay = () => this.emit({ type: 'play' });
    const onPause = () => this.emit({ type: 'pause' });
    const onEnded = () => this.emit({ type: 'ended' });
    const onSeeking = () => this.emit({ type: 'seeking', currentTime: video.currentTime });
    const onSeeked = () => this.emit({ type: 'seeked', currentTime: video.currentTime });
    const onLoadedMetadata = () => this.emit({ type: 'loaded', duration: video.duration });
    const onTimeUpdate = () =>
      this.emit({
        type: 'progress',
        currentTime: video.currentTime,
        duration: video.duration,
      });

    video.addEventListener('play', onPlay);
    video.addEventListener('pause', onPause);
    video.addEventListener('ended', onEnded);
    video.addEventListener('seeking', onSeeking);
    video.addEventListener('seeked', onSeeked);
    video.addEventListener('loadedmetadata', onLoadedMetadata);
    video.addEventListener('timeupdate', onTimeUpdate);

    this.cleanups.push(
      () => video.removeEventListener('play', onPlay),
      () => video.removeEventListener('pause', onPause),
      () => video.removeEventListener('ended', onEnded),
      () => video.removeEventListener('seeking', onSeeking),
      () => video.removeEventListener('seeked', onSeeked),
      () => video.removeEventListener('loadedmetadata', onLoadedMetadata),
      () => video.removeEventListener('timeupdate', onTimeUpdate)
    );
  }

  public detach(): void {
    for (const cleanup of this.cleanups) {
      try {
        cleanup();
      } catch {
        // safe cleanup
      }
    }
    this.cleanups = [];
    this.video = null;
  }

  public pauseContent(): void {
    if (this.video && !this.video.paused) {
      this.video.pause();
    }
  }

  public resumeContent(): void {
    if (this.video && this.video.paused) {
      this.video.play().catch(() => {
        // Auto-play restrictions may require user interaction
      });
    }
  }

  public seekTo(time: number): void {
    if (this.video) {
      this.video.currentTime = time;
    }
  }

  public getCurrentTime(): number {
    return this.video?.currentTime ?? 0;
  }

  public getDuration(): number {
    return this.video?.duration ?? 0;
  }

  public isPaused(): boolean {
    return this.video?.paused ?? true;
  }

  public override destroy(): void {
    this.detach();
    super.destroy();
  }
}
