import { describe, it, expect, vi } from 'vitest';
import { ReactNativeVideoV7Adapter } from '../../packages/integrations/src/rn-video-v7/rn-video-adapter';
import { Html5VideoAdapter } from '../../packages/web/src/adapters/html5-video-adapter';
import { VastEngine } from '../../packages/core/src/engine/vast-engine';

describe('Player Adapters Integration', () => {
  it('ReactNativeVideoV7Adapter bridges commands and events to VastEngine', () => {
    const mockRef = {
      pause: vi.fn(),
      resume: vi.fn(),
      seek: vi.fn(),
    };

    const adapter = new ReactNativeVideoV7Adapter(mockRef);
    const engine = new VastEngine();
    engine.attachPlayerAdapter(adapter);

    // 1. Simulate onContentLoad
    adapter.handleLoad({ duration: 180, currentTime: 0 });
    expect(adapter.getDuration()).toBe(180);

    // 2. Pause & resume commands
    adapter.pauseContent();
    expect(mockRef.pause).toHaveBeenCalled();
    expect(adapter.isPaused()).toBe(true);

    adapter.resumeContent();
    expect(mockRef.resume).toHaveBeenCalled();
    expect(adapter.isPaused()).toBe(false);

    // 3. Seek command
    adapter.seekTo(45);
    expect(mockRef.seek).toHaveBeenCalledWith(45);
    expect(adapter.getCurrentTime()).toBe(45);

    // 4. Progress and seek events
    const listener = vi.fn();
    const unsub = adapter.subscribe(listener);

    adapter.handleProgress({ currentTime: 50 });
    expect(listener).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'progress', currentTime: 50 })
    );

    unsub();
    engine.destroy();
  });

  it('Html5VideoAdapter attaches to HTMLVideoElement mock', () => {
    const eventHandlers: Record<string, Function> = {};
    const mockVideo = {
      paused: true,
      currentTime: 0,
      duration: 100,
      pause: vi.fn(function (this: any) {
        this.paused = true;
      }),
      play: vi.fn(function (this: any) {
        this.paused = false;
        return Promise.resolve();
      }),
      addEventListener: vi.fn((event: string, fn: Function) => {
        eventHandlers[event] = fn;
      }),
      removeEventListener: vi.fn((event: string) => {
        delete eventHandlers[event];
      }),
    } as unknown as HTMLVideoElement;

    const adapter = new Html5VideoAdapter(mockVideo);
    expect(mockVideo.addEventListener).toHaveBeenCalledWith('timeupdate', expect.any(Function));
    expect(mockVideo.addEventListener).toHaveBeenCalledWith('play', expect.any(Function));

    // Commands
    adapter.resumeContent();
    expect(mockVideo.play).toHaveBeenCalled();

    adapter.pauseContent();
    expect(mockVideo.pause).toHaveBeenCalled();

    adapter.seekTo(35);
    expect(mockVideo.currentTime).toBe(35);

    adapter.destroy();
    expect(mockVideo.removeEventListener).toHaveBeenCalled();
  });
});
