import type { PlayerAdapter, PlayerEvent } from '../types/adapter';

export type PlayerEventListener = (event: PlayerEvent) => void;

/**
 * Base abstract class for generic PlayerAdapter implementations
 */
export abstract class BasePlayerAdapter implements PlayerAdapter {
  protected listeners: Set<PlayerEventListener> = new Set();

  public abstract pauseContent(): void | Promise<void>;
  public abstract resumeContent(): void | Promise<void>;
  public abstract seekTo(time: number): void | Promise<void>;
  public abstract getCurrentTime(): number;
  public abstract getDuration(): number;
  public abstract isPaused(): boolean;

  public subscribe(listener: PlayerEventListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  protected emit(event: PlayerEvent): void {
    for (const listener of this.listeners) {
      try {
        listener(event);
      } catch {
        // Safe emitter
      }
    }
  }

  public destroy(): void {
    this.listeners.clear();
  }
}
