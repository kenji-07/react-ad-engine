import type {
  ScheduledBreak,
  SchedulerConfig,
  MissedBreakPolicy,
} from '../types/scheduler';
import type { VmapDocument, VmapAdBreak } from '../types/vmap';

export interface SchedulerCallbacks {
  onRequestAdBreak: (breakItem: ScheduledBreak) => void | Promise<void>;
  onBreakCompleted?: (breakItem: ScheduledBreak) => void;
}

export class AdScheduler {
  private scheduledBreaks: ScheduledBreak[] = [];
  private missedBreakPolicy: MissedBreakPolicy;
  private playPostrollOnContentEnd: boolean;

  private lastContentTime = 0;
  private contentDuration = 0;
  private isAdActive = false;
  private callbacks?: SchedulerCallbacks;

  constructor(config: SchedulerConfig = {}, callbacks?: SchedulerCallbacks) {
    this.missedBreakPolicy = config.missedBreakPolicy ?? 'play-last';
    this.playPostrollOnContentEnd = config.playPostrollOnContentEnd ?? true;
    this.callbacks = callbacks;
  }

  public setCallbacks(callbacks: SchedulerCallbacks): void {
    this.callbacks = callbacks;
  }

  public setContentDuration(duration: number): void {
    if (duration > 0 && duration !== this.contentDuration) {
      this.contentDuration = duration;
      // Re-calculate percentage based break offsets
      for (const b of this.scheduledBreaks) {
        if (b.percentage !== undefined && b.percentage > 0) {
          b.timeOffset = (duration * b.percentage) / 100;
        }
      }
      this.sortBreaks();
    }
  }

  public scheduleVmap(vmap: VmapDocument): void {
    for (const adBreak of vmap.adBreaks) {
      this.addVmapBreak(adBreak);
    }
    this.sortBreaks();
  }

  public addVmapBreak(adBreak: VmapAdBreak): void {
    const id = adBreak.breakId || `break-${this.scheduledBreaks.length}`;
    let position: 'preroll' | 'midroll' | 'postroll' = 'midroll';
    let timeOffset = 0;
    let percentage: number | undefined;

    if (adBreak.timeOffset.type === 'start') {
      position = 'preroll';
      timeOffset = 0;
    } else if (adBreak.timeOffset.type === 'end') {
      position = 'postroll';
      timeOffset = -1;
    } else if (adBreak.timeOffset.type === 'percentage') {
      position = 'midroll';
      percentage = adBreak.timeOffset.percentage;
      timeOffset = this.contentDuration > 0 && percentage !== undefined ? (this.contentDuration * percentage) / 100 : 0;
    } else {
      position = 'midroll';
      timeOffset = adBreak.timeOffset.seconds ?? 0;
    }

    this.scheduledBreaks.push({
      id,
      position,
      timeOffset,
      percentage,
      hasPlayed: false,
      isPending: false,
      repeatAfter: adBreak.repeatAfter,
      adBreak,
      adSource: {
        vastUrl: adBreak.adSource?.adTagURI?.url,
        vastXml: adBreak.adSource?.rawVastXml,
      },
    });
  }

  public addManualBreak(adBreak: {
    id: string;
    position: 'preroll' | 'midroll' | 'postroll';
    timeOffset?: number;
    vastUrl?: string;
    vastXml?: string;
  }): void {
    this.scheduledBreaks.push({
      id: adBreak.id,
      position: adBreak.position,
      timeOffset: adBreak.position === 'preroll' ? 0 : adBreak.position === 'postroll' ? -1 : (adBreak.timeOffset ?? 0),
      hasPlayed: false,
      isPending: false,
      adSource: {
        vastUrl: adBreak.vastUrl,
        vastXml: adBreak.vastXml,
      },
    });
    this.sortBreaks();
  }

  private sortBreaks(): void {
    this.scheduledBreaks.sort((a, b) => {
      if (a.position === 'preroll') return -1;
      if (b.position === 'preroll') return 1;
      if (a.position === 'postroll') return 1;
      if (b.position === 'postroll') return -1;
      return a.timeOffset - b.timeOffset;
    });
  }

  public setAdActive(active: boolean): void {
    this.isAdActive = active;
  }

  /**
   * Called to check if pre-roll should run
   */
  public checkPreroll(): ScheduledBreak | null {
    if (this.isAdActive) return null;
    const preroll = this.scheduledBreaks.find((b) => b.position === 'preroll' && !b.hasPlayed && !b.isPending);
    if (preroll) {
      preroll.isPending = true;
      this.callbacks?.onRequestAdBreak(preroll);
      return preroll;
    }
    return null;
  }

  /**
   * Called on regular content playback progress
   */
  public onContentProgress(currentTime: number, duration?: number): ScheduledBreak | null {
    if (duration && duration > 0) {
      this.setContentDuration(duration);
    }

    if (this.isAdActive) {
      this.lastContentTime = currentTime;
      return null;
    }

    // Check if a normal midroll break is reached
    const midrolls = this.scheduledBreaks.filter(
      (b) => b.position === 'midroll' && !b.hasPlayed && !b.isPending
    );

    for (const b of midrolls) {
      // Trigger if current time has reached or just passed the break time
      if (currentTime >= b.timeOffset && this.lastContentTime <= b.timeOffset) {
        b.isPending = true;
        this.lastContentTime = currentTime;
        this.callbacks?.onRequestAdBreak(b);
        return b;
      }
    }

    this.lastContentTime = currentTime;
    return null;
  }

  /**
   * Called when user seeks in content
   */
  public onContentSeek(targetTime: number): ScheduledBreak[] {
    if (this.isAdActive) return [];

    const fromTime = this.lastContentTime;
    this.lastContentTime = targetTime;

    // Only handle forward seeks for missed ad breaks
    if (targetTime <= fromTime) {
      return [];
    }

    // Find all unplayed midroll breaks between fromTime and targetTime
    const missedBreaks = this.scheduledBreaks.filter(
      (b) =>
        b.position === 'midroll' &&
        !b.hasPlayed &&
        !b.isPending &&
        b.timeOffset >= fromTime &&
        b.timeOffset <= targetTime
    );

    if (missedBreaks.length === 0) {
      return [];
    }

    if (this.missedBreakPolicy === 'ignore') {
      for (const b of missedBreaks) {
        b.hasPlayed = true;
      }
      return [];
    }

    if (this.missedBreakPolicy === 'play-last') {
      // Mark all except the last one as played
      const lastMissed = missedBreaks[missedBreaks.length - 1];
      for (const b of missedBreaks) {
        if (b !== lastMissed) {
          b.hasPlayed = true;
        }
      }
      lastMissed.isPending = true;
      this.callbacks?.onRequestAdBreak(lastMissed);
      return [lastMissed];
    }

    if (this.missedBreakPolicy === 'play-all') {
      // Queue all missed breaks
      for (const b of missedBreaks) {
        b.isPending = true;
      }
      // Trigger first one
      this.callbacks?.onRequestAdBreak(missedBreaks[0]);
      return missedBreaks;
    }

    return [];
  }

  /**
   * Called when content playback completes (reaches the end)
   */
  public onContentEnd(): ScheduledBreak | null {
    if (!this.playPostrollOnContentEnd || this.isAdActive) return null;

    const postroll = this.scheduledBreaks.find(
      (b) => b.position === 'postroll' && !b.hasPlayed && !b.isPending
    );

    if (postroll) {
      postroll.isPending = true;
      this.callbacks?.onRequestAdBreak(postroll);
      return postroll;
    }

    return null;
  }

  /**
   * Mark a break as completed
   */
  public markBreakCompleted(breakId: string): void {
    const b = this.scheduledBreaks.find((item) => item.id === breakId);
    if (b) {
      b.isPending = false;
      b.hasPlayed = true;
      b.lastPlayedTime = Date.now();
      this.callbacks?.onBreakCompleted?.(b);
    }
  }

  /**
   * Mark a break as failed (e.g. ad load failed)
   */
  public markBreakFailed(breakId: string): void {
    const b = this.scheduledBreaks.find((item) => item.id === breakId);
    if (b) {
      b.isPending = false;
      b.hasPlayed = true;
    }
  }

  public getBreaks(): ScheduledBreak[] {
    return [...this.scheduledBreaks];
  }

  public reset(): void {
    this.lastContentTime = 0;
    this.isAdActive = false;
    for (const b of this.scheduledBreaks) {
      b.hasPlayed = false;
      b.isPending = false;
    }
  }
}
