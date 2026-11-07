import type {
  TrackingConfig,
  TrackingContext,
  TrackingTransport,
} from '../types/tracking';
import type { VastTrackingEvent, VastImpression } from '../types/vast';
import { DefaultTrackingTransport } from './transport';
import { MacroReplacer } from './macro-replacer';

export class TrackingManager {
  private config: TrackingConfig;
  private transport: TrackingTransport;
  private triggeredEvents: Set<string> = new Set();
  private adId = '';
  private currentAssetUri = '';

  constructor(config?: Partial<TrackingConfig>) {
    this.config = {
      enabled: config?.enabled ?? true,
      impression: config?.impression ?? true,
      creativeView: config?.creativeView ?? true,
      start: config?.start ?? true,
      firstQuartile: config?.firstQuartile ?? true,
      midpoint: config?.midpoint ?? true,
      thirdQuartile: config?.thirdQuartile ?? true,
      complete: config?.complete ?? true,
      skip: config?.skip ?? true,
      mute: config?.mute ?? true,
      unmute: config?.unmute ?? true,
      pause: config?.pause ?? true,
      resume: config?.resume ?? true,
      fullscreen: config?.fullscreen ?? true,
      exitFullscreen: config?.exitFullscreen ?? true,
      clickTracking: config?.clickTracking ?? true,
      error: config?.error ?? true,
      companionImpression: config?.companionImpression ?? true,
      timeoutMs: config?.timeoutMs ?? 5000,
      maxRetries: config?.maxRetries ?? 1,
      customMacros: config?.customMacros ?? {},
      onTrackSent: config?.onTrackSent,
      onTrackFailed: config?.onTrackFailed,
    };

    this.transport = config?.transport ?? new DefaultTrackingTransport({
      timeoutMs: this.config.timeoutMs,
      maxRetries: this.config.maxRetries,
    });
  }

  public setConfig(config: Partial<TrackingConfig>): void {
    this.config = { ...this.config, ...config };
    if (config.transport) {
      this.transport = config.transport;
    }
  }

  public setAdContext(adId: string, assetUri?: string): void {
    this.adId = adId;
    this.currentAssetUri = assetUri || '';
    this.triggeredEvents.clear();
  }

  public isEventEnabled(eventName: string): boolean {
    if (!this.config.enabled) return false;
    const toggle = (this.config as any)[eventName];
    return toggle !== false;
  }

  /**
   * Fires impression URLs. Won't fire more than once per ad lifecycle.
   */
  public trackImpressions(impressions: VastImpression[], context?: TrackingContext): void {
    if (!this.isEventEnabled('impression')) return;
    const key = `impression:${this.adId}`;
    if (this.triggeredEvents.has(key)) return;
    this.triggeredEvents.add(key);

    const urls = impressions.map((imp) => imp.url).filter(Boolean);
    this.fireUrls(urls, 'impression', context);
  }

  /**
   * Tracks start event
   */
  public trackStart(trackingEvents: VastTrackingEvent[], context?: TrackingContext): void {
    this.trackSingleEvent('start', trackingEvents, context);
  }

  /**
   * Tracks creativeView event
   */
  public trackCreativeView(trackingEvents: VastTrackingEvent[], context?: TrackingContext): void {
    this.trackSingleEvent('creativeView', trackingEvents, context);
  }

  /**
   * Tracks skip event
   */
  public trackSkip(trackingEvents: VastTrackingEvent[], context?: TrackingContext): void {
    this.trackSingleEvent('skip', trackingEvents, context);
  }

  /**
   * Tracks pause event
   */
  public trackPause(trackingEvents: VastTrackingEvent[], context?: TrackingContext): void {
    // Pause can fire multiple times
    this.trackRepeatableEvent('pause', trackingEvents, context);
  }

  /**
   * Tracks resume event
   */
  public trackResume(trackingEvents: VastTrackingEvent[], context?: TrackingContext): void {
    this.trackRepeatableEvent('resume', trackingEvents, context);
  }

  /**
   * Tracks mute event
   */
  public trackMute(trackingEvents: VastTrackingEvent[], context?: TrackingContext): void {
    this.trackRepeatableEvent('mute', trackingEvents, context);
  }

  /**
   * Tracks unmute event
   */
  public trackUnmute(trackingEvents: VastTrackingEvent[], context?: TrackingContext): void {
    this.trackRepeatableEvent('unmute', trackingEvents, context);
  }

  /**
   * Tracks fullscreen event
   */
  public trackFullscreen(trackingEvents: VastTrackingEvent[], context?: TrackingContext): void {
    this.trackRepeatableEvent('fullscreen', trackingEvents, context);
  }

  /**
   * Tracks exitFullscreen event
   */
  public trackExitFullscreen(trackingEvents: VastTrackingEvent[], context?: TrackingContext): void {
    this.trackRepeatableEvent('exitFullscreen', trackingEvents, context);
  }

  /**
   * Tracks click tracking URLs
   */
  public trackClicks(clickUrls: string[], context?: TrackingContext): void {
    if (!this.isEventEnabled('clickTracking')) return;
    this.fireUrls(clickUrls, 'clickTracking', context);
  }

  /**
   * Tracks error URLs with code macro replacement
   */
  public trackError(errorUrls: string[], errorCode: number | string, context?: TrackingContext): void {
    if (!this.isEventEnabled('error')) return;
    const ctx: TrackingContext = {
      ...context,
      errorCode,
      assetUri: this.currentAssetUri,
    };
    this.fireUrls(errorUrls, 'error', ctx);
  }

  /**
   * Evaluates ad progress for quartile events and progress offset events
   */
  public onAdProgress(
    currentTime: number,
    duration: number,
    trackingEvents: VastTrackingEvent[],
    context?: TrackingContext
  ): void {
    if (!this.config.enabled || duration <= 0) return;

    const progressRatio = currentTime / duration;
    const ctx: TrackingContext = {
      ...context,
      contentPlayhead: currentTime,
      assetUri: this.currentAssetUri,
    };

    // First Quartile (25%)
    if (progressRatio >= 0.25) {
      this.trackSingleEvent('firstQuartile', trackingEvents, ctx);
    }

    // Midpoint (50%)
    if (progressRatio >= 0.50) {
      this.trackSingleEvent('midpoint', trackingEvents, ctx);
    }

    // Third Quartile (75%)
    if (progressRatio >= 0.75) {
      this.trackSingleEvent('thirdQuartile', trackingEvents, ctx);
    }

    // Complete (100%)
    if (progressRatio >= 0.98 || currentTime >= duration) {
      this.trackSingleEvent('complete', trackingEvents, ctx);
    }

    // Progress events with specific offsets
    const progressEvents = trackingEvents.filter((t) => t.event.toLowerCase() === 'progress');
    for (const pe of progressEvents) {
      if (pe.offset !== undefined && currentTime >= pe.offset) {
        const offsetKey = `progress:${this.adId}:${pe.offset}:${pe.url}`;
        if (!this.triggeredEvents.has(offsetKey)) {
          this.triggeredEvents.add(offsetKey);
          this.fireUrls([pe.url], 'progress', ctx);
        }
      }
    }
  }

  private trackSingleEvent(
    eventName: string,
    trackingEvents: VastTrackingEvent[],
    context?: TrackingContext
  ): void {
    if (!this.isEventEnabled(eventName)) return;

    const key = `${eventName}:${this.adId}`;
    if (this.triggeredEvents.has(key)) return;
    this.triggeredEvents.add(key);

    const urls = trackingEvents
      .filter((t) => t.event.toLowerCase() === eventName.toLowerCase())
      .map((t) => t.url);

    this.fireUrls(urls, eventName, context);
  }

  private trackRepeatableEvent(
    eventName: string,
    trackingEvents: VastTrackingEvent[],
    context?: TrackingContext
  ): void {
    if (!this.isEventEnabled(eventName)) return;

    const urls = trackingEvents
      .filter((t) => t.event.toLowerCase() === eventName.toLowerCase())
      .map((t) => t.url);

    this.fireUrls(urls, eventName, context);
  }

  public fireUrls(urls: string[], eventName: string, context?: TrackingContext): void {
    if (!urls || urls.length === 0) return;

    const mergedContext: TrackingContext = {
      assetUri: this.currentAssetUri,
      customMacros: this.config.customMacros,
      ...context,
    };

    for (const rawUrl of urls) {
      if (!rawUrl) continue;
      const finalUrl = MacroReplacer.replaceMacros(rawUrl, mergedContext);

      // Fire in background asynchronously; never block ad playback
      this.transport
        .send(finalUrl, mergedContext)
        .then((success) => {
          if (success) {
            this.config.onTrackSent?.(finalUrl, eventName);
          } else {
            this.config.onTrackFailed?.(finalUrl, eventName, new Error('Transport send returned false'));
          }
        })
        .catch((err) => {
          this.config.onTrackFailed?.(finalUrl, eventName, err);
        });
    }
  }

  public reset(): void {
    this.triggeredEvents.clear();
  }
}
