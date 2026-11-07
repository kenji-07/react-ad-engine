export type PlayerEventType =
  | 'play'
  | 'pause'
  | 'progress'
  | 'seeking'
  | 'seeked'
  | 'ended'
  | 'error'
  | 'loaded';

export interface PlayerEvent {
  type: PlayerEventType;
  currentTime?: number;
  duration?: number;
  error?: any;
}

export interface PlayerAdapter {
  pauseContent(): void | Promise<void>;
  resumeContent(): void | Promise<void>;
  seekTo(time: number): void | Promise<void>;
  getCurrentTime(): number;
  getDuration(): number;
  isPaused(): boolean;
  subscribe(listener: (event: PlayerEvent) => void): () => void;
  destroy?(): void;
}

/**
 * AdMediaRenderer contract:
 * Platform-agnostic contract for rendering ad video media
 */
export interface AdMediaRendererProps {
  source: string;
  duration?: number;
  currentTime?: number;
  isPaused?: boolean;
  isMuted?: boolean;
  onLoad?: () => void;
  onProgress?: (currentTime: number, duration: number) => void;
  onEnd?: () => void;
  onError?: (error: Error) => void;
}
