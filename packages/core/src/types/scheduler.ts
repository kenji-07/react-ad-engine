import type { VmapAdBreak } from './vmap';
import type { VastDocument } from './vast';

export type MissedBreakPolicy = 'play-last' | 'play-all' | 'ignore';

export type BreakPosition = 'preroll' | 'midroll' | 'postroll';

export interface ScheduledBreak {
  id: string;
  position: BreakPosition;
  timeOffset: number; // in seconds. 0 for preroll, positive for midroll, -1 for postroll
  percentage?: number; // 0..100 if defined as percentage
  hasPlayed: boolean;
  isPending: boolean;
  repeatAfter?: number; // seconds
  lastPlayedTime?: number;
  adBreak?: VmapAdBreak;
  adSource?: {
    vastUrl?: string;
    vastXml?: string;
    vastDocument?: VastDocument;
  };
}

export interface SchedulerConfig {
  missedBreakPolicy?: MissedBreakPolicy;
  playPostrollOnContentEnd?: boolean;
  allowRepeatedBreaks?: boolean;
  seekToleranceSeconds?: number;
}
