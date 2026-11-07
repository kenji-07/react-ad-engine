import { BasePlayerAdapter } from '@react-ad-engine/core';

/**
 * Structural contract representing an Expo Video player (e.g. expo-video VideoPlayer or expo-av Video)
 * (Zero dependency - never imports expo-video or expo-av)
 */
export interface ExpoVideoPlayerLike {
  play?: () => void;
  pause?: () => void;
  currentTime?: number;
  duration?: number;
  playing?: boolean;
  replay?: () => void;
  seekBy?: (seconds: number) => void;
  setPositionAsync?: (millis: number) => Promise<any>;
  playAsync?: () => Promise<any>;
  pauseAsync?: () => Promise<any>;
  addListener?: (event: string, callback: (...args: any[]) => void) => { remove: () => void };
}

export class ExpoVideoAdapter extends BasePlayerAdapter {
  private player: ExpoVideoPlayerLike | null = null;
  private unsubscribers: Array<() => void> = [];

  constructor(player?: ExpoVideoPlayerLike | null) {
    super();
    if (player) {
      this.attachPlayer(player);
    }
  }

  public attachPlayer(player: ExpoVideoPlayerLike): void {
    this.detachPlayer();
    this.player = player;

    if (player.addListener) {
      const timeSub = player.addListener('timeUpdate', (event: any) => {
        this.emit({
          type: 'progress',
          currentTime: event.currentTime ?? player.currentTime ?? 0,
          duration: player.duration ?? 0,
        });
      });

      const playSub = player.addListener('playingChange', (event: any) => {
        if (event.isPlaying) {
          this.emit({ type: 'play' });
        } else {
          this.emit({ type: 'pause' });
        }
      });

      const endSub = player.addListener('playToEnd', () => {
        this.emit({ type: 'ended' });
      });

      this.unsubscribers.push(
        () => timeSub.remove(),
        () => playSub.remove(),
        () => endSub.remove()
      );
    }
  }

  public detachPlayer(): void {
    for (const unsub of this.unsubscribers) {
      try {
        unsub();
      } catch {
        // safe cleanup
      }
    }
    this.unsubscribers = [];
    this.player = null;
  }

  public pauseContent(): void {
    if (this.player?.pause) {
      this.player.pause();
    } else if (this.player?.pauseAsync) {
      this.player.pauseAsync().catch(() => {});
    }
    this.emit({ type: 'pause' });
  }

  public resumeContent(): void {
    if (this.player?.play) {
      this.player.play();
    } else if (this.player?.playAsync) {
      this.player.playAsync().catch(() => {});
    }
    this.emit({ type: 'play' });
  }

  public seekTo(time: number): void {
    if (this.player?.currentTime !== undefined) {
      this.player.currentTime = time;
    } else if (this.player?.setPositionAsync) {
      this.player.setPositionAsync(time * 1000).catch(() => {});
    }
    this.emit({ type: 'seeking', currentTime: time });
  }

  public getCurrentTime(): number {
    return this.player?.currentTime ?? 0;
  }

  public getDuration(): number {
    return this.player?.duration ?? 0;
  }

  public isPaused(): boolean {
    return this.player?.playing !== undefined ? !this.player.playing : true;
  }

  public override destroy(): void {
    this.detachPlayer();
    super.destroy();
  }
}
