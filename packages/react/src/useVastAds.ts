import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  VastEngine,
  type AdStateSnapshot,
  type TrackingConfig,
  type SchedulerConfig,
  type MediaSelectionCriteria,
  type PlayerAdapter,
  type AdLifecycleCallbacks,
  type VastUIConfig,
} from '@react-ad-engine/core';
import { mergeUIConfig } from './default-ui-config';

export interface UseVastAdsOptions {
  vastUrl?: string;
  vastXml?: string;
  vmapUrl?: string;
  vmapXml?: string;
  playerAdapter?: PlayerAdapter;
  ui?: Partial<VastUIConfig>;
  tracking?: Partial<TrackingConfig>;
  scheduler?: SchedulerConfig;
  mediaSelection?: MediaSelectionCriteria;
  callbacks?: AdLifecycleCallbacks;
  options?: {
    maxWrapperDepth?: number;
    adTimeout?: number;
    autoResumeContent?: boolean;
  };
}

export interface UseVastAdsReturn {
  state: AdStateSnapshot;
  ui: VastUIConfig;
  shouldPauseContent: boolean;
  isAdActive: boolean;

  // Content player event handlers (to attach to Video player)
  onContentLoad: (duration: number) => void;
  onContentProgress: (currentTime: number, duration?: number) => void;
  onContentEnd: () => void;
  onContentSeek: (targetTime: number) => void;

  // Ad Media player event handlers (when custom ad player is rendered)
  onAdMediaProgress: (currentTime: number, duration?: number) => void;
  onAdMediaEnd: () => void;
  onAdMediaError: (err: Error) => void;

  // User & Ad actions
  skipAd: () => void;
  clickAd: () => string | undefined;
  pauseAd: () => void;
  resumeAd: () => void;
  muteAd: () => void;
  unmuteAd: () => void;

  // Engine actions
  loadVast: (urlOrXml: string) => Promise<any>;
  loadVmap: (urlOrXml: string) => Promise<any>;
  destroy: () => void;
}

export function useVastAds(config: UseVastAdsOptions = {}): UseVastAdsReturn {
  const mergedUi = useMemo(() => mergeUIConfig(config.ui), [config.ui]);

  const engineRef = useRef<VastEngine | null>(null);

  if (!engineRef.current) {
    engineRef.current = new VastEngine({
      tracking: config.tracking,
      scheduler: config.scheduler,
      mediaSelection: config.mediaSelection,
      maxWrapperDepth: config.options?.maxWrapperDepth,
      requestTimeoutMs: config.options?.adTimeout,
      autoResumeContent: config.options?.autoResumeContent,
    });
  }

  const engine = engineRef.current;
  const [snapshot, setSnapshot] = useState<AdStateSnapshot>(() => engine.getState());

  // Attach lifecycle callbacks to sync React state
  useEffect(() => {
    engine.setCallbacks({
      ...config.callbacks,
      onStateChange: (state, prevState) => {
        setSnapshot(engine.getState());
        config.callbacks?.onStateChange?.(state, prevState);
      },
      onAdProgress: (data) => {
        setSnapshot(engine.getState());
        config.callbacks?.onAdProgress?.(data);
      },
      onAdStart: (creative) => {
        setSnapshot(engine.getState());
        config.callbacks?.onAdStart?.(creative);
      },
      onAdLoaded: (creative) => {
        setSnapshot(engine.getState());
        config.callbacks?.onAdLoaded?.(creative);
      },
      onAdComplete: () => {
        setSnapshot(engine.getState());
        config.callbacks?.onAdComplete?.();
      },
      onAdSkip: () => {
        setSnapshot(engine.getState());
        config.callbacks?.onAdSkip?.();
      },
      onAdError: (err) => {
        setSnapshot(engine.getState());
        config.callbacks?.onAdError?.(err);
      },
    });
  }, [config.callbacks, engine]);

  // Connect player adapter if provided
  useEffect(() => {
    if (config.playerAdapter) {
      engine.attachPlayerAdapter(config.playerAdapter);
      return () => {
        engine.detachPlayerAdapter();
      };
    }
    return undefined;
  }, [config.playerAdapter, engine]);

  // Load initial VAST or VMAP if provided
  useEffect(() => {
    if (config.vastUrl) {
      engine.loadVast(config.vastUrl).catch(() => {});
    } else if (config.vastXml) {
      engine.loadVast(config.vastXml).catch(() => {});
    } else if (config.vmapUrl) {
      engine.loadVmap(config.vmapUrl).catch(() => {});
    } else if (config.vmapXml) {
      engine.loadVmap(config.vmapXml).catch(() => {});
    }
  }, [config.vastUrl, config.vastXml, config.vmapUrl, config.vmapXml, engine]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      engine.destroy();
    };
  }, [engine]);

  const onContentLoad = useCallback((dur: number) => engine.onContentLoad(dur), [engine]);
  const onContentProgress = useCallback((cur: number, dur?: number) => engine.onContentProgress(cur, dur), [engine]);
  const onContentEnd = useCallback(() => engine.onContentEnd(), [engine]);
  const onContentSeek = useCallback((target: number) => engine.onContentSeek(target), [engine]);

  const onAdMediaProgress = useCallback((cur: number, dur?: number) => engine.onAdMediaProgress(cur, dur), [engine]);
  const onAdMediaEnd = useCallback(() => engine.onAdMediaEnd(), [engine]);
  const onAdMediaError = useCallback((err: Error) => engine.onAdMediaError(err), [engine]);

  const skipAd = useCallback(() => engine.skipAd(), [engine]);
  const clickAd = useCallback(() => engine.clickAd(), [engine]);
  const pauseAd = useCallback(() => engine.pauseAd(), [engine]);
  const resumeAd = useCallback(() => engine.resumeAd(), [engine]);
  const muteAd = useCallback(() => engine.muteAd(), [engine]);
  const unmuteAd = useCallback(() => engine.unmuteAd(), [engine]);

  const loadVast = useCallback((uOrX: string) => engine.loadVast(uOrX), [engine]);
  const loadVmap = useCallback((uOrX: string) => engine.loadVmap(uOrX), [engine]);
  const destroy = useCallback(() => engine.destroy(), [engine]);

  return {
    state: snapshot,
    ui: mergedUi,
    shouldPauseContent: snapshot.shouldPauseContent,
    isAdActive: snapshot.isAdActive,
    onContentLoad,
    onContentProgress,
    onContentEnd,
    onContentSeek,
    onAdMediaProgress,
    onAdMediaEnd,
    onAdMediaError,
    skipAd,
    clickAd,
    pauseAd,
    resumeAd,
    muteAd,
    unmuteAd,
    loadVast,
    loadVmap,
    destroy,
  };
}

export function useVmapAds(config: UseVastAdsOptions = {}): UseVastAdsReturn {
  return useVastAds(config);
}
