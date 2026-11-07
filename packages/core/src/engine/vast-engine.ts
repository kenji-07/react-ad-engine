import { VastParser } from '../parser/vast/vast-parser';
import { WrapperResolver } from '../parser/vast/wrapper-resolver';
import { CustomExtensionsParser } from '../parser/vast/custom-extensions-parser';
import { VmapParser } from '../parser/vmap/vmap-parser';
import { AdScheduler } from '../scheduler/ad-scheduler';
import { TrackingManager } from '../tracking/tracking-manager';
import { AdStateMachine } from '../lifecycle/ad-state-machine';
import { MediaSelector } from '../media/media-selector';
import { UrlValidator } from '../security/url-validator';
import type {
  VastDocument,
  VastCreative,
  VastCompanion,
  VastNonLinear,
} from '../types/vast';
import type { VmapDocument } from '../types/vmap';
import type {
  AdStateSnapshot,
  AdLifecycleCallbacks,
} from '../types/lifecycle';
import type { TrackingConfig } from '../types/tracking';
import type { SchedulerConfig, ScheduledBreak } from '../types/scheduler';
import type { MediaSelectionCriteria } from '../types/media-selection';
import type { PlayerAdapter, PlayerEvent } from '../types/adapter';
import { VastError, VastErrorCode } from '../types/errors';

export interface VastEngineOptions {
  tracking?: Partial<TrackingConfig>;
  scheduler?: SchedulerConfig;
  mediaSelection?: MediaSelectionCriteria;
  maxWrapperDepth?: number;
  requestTimeoutMs?: number;
  autoResumeContent?: boolean;
  callbacks?: AdLifecycleCallbacks;
}

export class VastEngine {
  private vastParser: VastParser;
  private vmapParser: VmapParser;
  private wrapperResolver: WrapperResolver;
  private scheduler: AdScheduler;
  private tracking: TrackingManager;
  private stateMachine: AdStateMachine;

  private mediaCriteria: MediaSelectionCriteria;
  private autoResumeContent: boolean;

  private playerAdapter: PlayerAdapter | null = null;
  private unsubscribePlayer: (() => void) | null = null;

  private currentVastDoc: VastDocument | null = null;
  private currentActiveBreak: ScheduledBreak | null = null;
  private currentCreative: VastCreative | null = null;
  private currentErrorUrls: string[] = [];

  constructor(options: VastEngineOptions = {}) {
    this.vastParser = new VastParser();
    this.vmapParser = new VmapParser();
    this.wrapperResolver = new WrapperResolver({
      maxDepth: options.maxWrapperDepth ?? 5,
      timeoutMs: options.requestTimeoutMs ?? 10000,
    });

    this.mediaCriteria = options.mediaSelection || {};
    this.autoResumeContent = options.autoResumeContent ?? true;

    this.tracking = new TrackingManager(options.tracking);
    this.stateMachine = new AdStateMachine(options.callbacks);

    this.scheduler = new AdScheduler(options.scheduler, {
      onRequestAdBreak: this.handleAdBreakRequested.bind(this),
      onBreakCompleted: this.handleAdBreakCompleted.bind(this),
    });
  }

  public setCallbacks(callbacks: AdLifecycleCallbacks): void {
    this.stateMachine.setCallbacks(callbacks);
  }

  public getState(): AdStateSnapshot {
    return this.stateMachine.getSnapshot();
  }

  /**
   * Connect an external video player via PlayerAdapter
   */
  public attachPlayerAdapter(adapter: PlayerAdapter): void {
    this.detachPlayerAdapter();
    this.playerAdapter = adapter;

    this.unsubscribePlayer = adapter.subscribe((event: PlayerEvent) => {
      switch (event.type) {
        case 'loaded':
          if (event.duration) {
            this.onContentLoad(event.duration);
          }
          break;
        case 'progress':
          if (event.currentTime !== undefined) {
            this.onContentProgress(event.currentTime, event.duration);
          }
          break;
        case 'seeking':
          if (event.currentTime !== undefined) {
            this.onContentSeek(event.currentTime);
          }
          break;
        case 'ended':
          this.onContentEnd();
          break;
        case 'play':
          if (!this.stateMachine.getSnapshot().isAdActive) {
            this.stateMachine.transitionTo('contentPlaying');
          }
          break;
      }
    });
  }

  public detachPlayerAdapter(): void {
    if (this.unsubscribePlayer) {
      this.unsubscribePlayer();
      this.unsubscribePlayer = null;
    }
    this.playerAdapter = null;
  }

  /**
   * Universal ad tag loader:
   * Accepts a single URL (adTagUrl) or raw XML, automatically detects whether
   * it is VMAP or VAST, and starts the appropriate scheduling and lifecycle.
   */
  public async loadAdTag(urlOrXml: string): Promise<VastDocument | VmapDocument> {
    this.stateMachine.transitionTo('loading');
    let xml = urlOrXml.trim();

    if (xml.startsWith('http://') || xml.startsWith('https://')) {
      const res = await fetch(xml);
      if (!res.ok) {
        const err = new VastError(`Failed to fetch ad tag from ${xml}: HTTP ${res.status}`, VastErrorCode.MEDIA_FILE_NOT_FOUND);
        this.stateMachine.setError(err);
        throw err;
      }
      xml = await res.text();
    }

    if (this.isVmapXml(xml)) {
      return this.loadVmapXml(xml);
    } else {
      return this.loadVastXml(xml);
    }
  }

  public isVmapXml(xml: string): boolean {
    const trimmed = xml.trim();
    return /<([a-zA-Z0-9_-]+:)?VMAP[\s>]/i.test(trimmed);
  }

  /**
   * Loads a VAST URL or raw XML string
   */
  public async loadVast(urlOrXml: string): Promise<VastDocument> {
    this.stateMachine.transitionTo('loading');
    let xml = urlOrXml.trim();

    if (xml.startsWith('http://') || xml.startsWith('https://')) {
      const res = await fetch(xml);
      if (!res.ok) {
        const err = new VastError(`Failed to fetch VAST from ${xml}`, VastErrorCode.MEDIA_FILE_NOT_FOUND);
        this.stateMachine.setError(err);
        throw err;
      }
      xml = await res.text();
    }

    return this.loadVastXml(xml);
  }

  private async loadVastXml(xml: string): Promise<VastDocument> {
    try {
      const rawDoc = this.vastParser.parse(xml);
      const resolvedDoc = await this.wrapperResolver.resolve(rawDoc);
      this.currentVastDoc = resolvedDoc;

      // Check custom extensions (e.g. RollPlacement)
      let placement = 'preroll';
      if (resolvedDoc.ads.length > 0 && resolvedDoc.ads[0].inline) {
        const customExts = CustomExtensionsParser.parse(resolvedDoc.ads[0].inline.extensions);
        if (customExts.rollPlacement) {
          placement = customExts.rollPlacement.placement;
        }
      }

      this.scheduler.addManualBreak({
        id: `ad-break-${Date.now()}`,
        position: placement as any,
        timeOffset: 0,
      });

      this.stateMachine.transitionTo('ready');

      // If preroll, check if we should trigger immediately
      if (placement === 'preroll') {
        this.scheduler.checkPreroll();
      }

      return resolvedDoc;
    } catch (err: any) {
      const vastError = err instanceof VastError ? err : new VastError(err.message, VastErrorCode.UNDEFINED_ERROR);
      this.tracking.trackError(vastError.errorUrls, vastError.code);
      this.stateMachine.setError(vastError);
      throw vastError;
    }
  }

  /**
   * Loads a VMAP URL or raw XML string
   */
  public async loadVmap(urlOrXml: string): Promise<VmapDocument> {
    this.stateMachine.transitionTo('loading');
    let xml = urlOrXml.trim();

    if (xml.startsWith('http://') || xml.startsWith('https://')) {
      const res = await fetch(xml);
      if (!res.ok) {
        const err = new VastError(`Failed to fetch VMAP from ${xml}`, VastErrorCode.MEDIA_FILE_NOT_FOUND);
        this.stateMachine.setError(err);
        throw err;
      }
      xml = await res.text();
    }

    return this.loadVmapXml(xml);
  }

  private async loadVmapXml(xml: string): Promise<VmapDocument> {
    try {
      const vmapDoc = this.vmapParser.parse(xml);
      this.scheduler.scheduleVmap(vmapDoc);
      this.stateMachine.transitionTo('ready');

      // Check if preroll is present
      this.scheduler.checkPreroll();
      return vmapDoc;
    } catch (err: any) {
      const vastError = err instanceof VastError ? err : new VastError(err.message, VastErrorCode.UNDEFINED_ERROR);
      this.stateMachine.setError(vastError);
      throw vastError;
    }
  }

  public onContentLoad(duration: number): void {
    this.scheduler.setContentDuration(duration);
    if (!this.stateMachine.getSnapshot().isAdActive) {
      this.scheduler.checkPreroll();
    }
  }

  public onContentProgress(currentTime: number, duration?: number): void {
    if (this.stateMachine.getSnapshot().isAdActive) return;
    this.scheduler.onContentProgress(currentTime, duration);
  }

  public onContentSeek(targetTime: number): void {
    if (this.stateMachine.getSnapshot().isAdActive) return;
    this.scheduler.onContentSeek(targetTime);
  }

  public onContentEnd(): void {
    if (this.stateMachine.getSnapshot().isAdActive) return;
    const postroll = this.scheduler.onContentEnd();
    if (!postroll) {
      this.stateMachine.transitionTo('contentCompleted');
    }
  }

  private async handleAdBreakRequested(breakItem: ScheduledBreak): Promise<void> {
    this.currentActiveBreak = breakItem;
    this.scheduler.setAdActive(true);

    // Pause content player
    if (this.playerAdapter) {
      try {
        await this.playerAdapter.pauseContent();
      } catch {
        // Player pause might throw if already paused
      }
    }

    this.stateMachine.transitionTo('adLoading');

    try {
      let adDoc = this.currentVastDoc;

      // If break has its own VAST source
      if (breakItem.adSource?.vastUrl) {
        const res = await fetch(breakItem.adSource.vastUrl);
        const xml = await res.text();
        const rawDoc = this.vastParser.parse(xml);
        adDoc = await this.wrapperResolver.resolve(rawDoc);
      } else if (breakItem.adSource?.vastXml) {
        const rawDoc = this.vastParser.parse(breakItem.adSource.vastXml);
        adDoc = await this.wrapperResolver.resolve(rawDoc);
      }

      if (!adDoc || adDoc.ads.length === 0) {
        throw new VastError('No ads found in VAST document', VastErrorCode.NO_VAST_RESPONSE);
      }

      const ad = adDoc.ads[0];
      const inline = ad.inline;
      if (!inline) {
        throw new VastError('Resolved ad is missing InLine details', VastErrorCode.TRAFFICKING_ERROR);
      }

      this.currentErrorUrls = inline.errorUrls;
      this.tracking.setAdContext(ad.id);

      // Find Linear or NonLinear creative
      const linearCreative = inline.creatives.find((c) => Boolean(c.linear));
      const nonLinearCreative = inline.creatives.find((c) => Boolean(c.nonLinearAds));
      const companionCreative = inline.creatives.find((c) => Boolean(c.companionAds));

      const companionAds: VastCompanion[] = companionCreative?.companionAds?.companions || [];
      const nonLinearAds: VastNonLinear[] = nonLinearCreative?.nonLinearAds?.nonLinears || [];

      // Custom extensions (TextAd, etc.)
      const customExts = CustomExtensionsParser.parse(inline.extensions);
      const textAd = customExts.textAd?.textOverlay || null;

      if (linearCreative && linearCreative.linear) {
        const linear = linearCreative.linear;
        const { mediaFile } = MediaSelector.selectOptimalMediaFile(linear.mediaFiles, this.mediaCriteria);

        if (!mediaFile) {
          throw new VastError('No supported media file found', VastErrorCode.MEDIA_FILE_UNSUPPORTED, inline.errorUrls);
        }

        this.currentCreative = linearCreative;
        this.tracking.setAdContext(ad.id, mediaFile.url);

        this.stateMachine.setAdCreative(linearCreative, mediaFile, companionAds, nonLinearAds, textAd);
        this.stateMachine.transitionTo('adReady');

        // Automatically start linear ad
        this.startLinearAd();
      } else if (nonLinearAds.length > 0 || textAd) {
        // NonLinear / Text ad
        const creative = nonLinearCreative || inline.creatives[0];
        this.currentCreative = creative;
        this.stateMachine.setAdCreative(creative, null, companionAds, nonLinearAds, textAd);
        this.stateMachine.transitionTo('adPlaying');

        // Fire impressions and start
        this.tracking.trackImpressions(inline.impressions);
        if (nonLinearCreative?.nonLinearAds) {
          this.tracking.trackCreativeView(nonLinearCreative.nonLinearAds.trackingEvents);
        }
      } else {
        throw new VastError('No supported linear or nonlinear creative in ad', VastErrorCode.TRAFFICKING_ERROR, inline.errorUrls);
      }
    } catch (err: any) {
      const vastError = err instanceof VastError ? err : new VastError(err.message, VastErrorCode.UNDEFINED_ERROR, this.currentErrorUrls);
      this.tracking.trackError(this.currentErrorUrls, vastError.code);
      this.stateMachine.setError(vastError);
      this.resumeContentAfterAd();
    }
  }

  private startLinearAd(): void {
    if (!this.currentCreative?.linear) return;
    this.stateMachine.transitionTo('adPlaying');

    // Fire impressions and start event
    if (this.currentVastDoc?.ads[0]?.inline) {
      this.tracking.trackImpressions(this.currentVastDoc.ads[0].inline.impressions);
    }
    this.tracking.trackStart(this.currentCreative.linear.trackingEvents);
  }

  public onAdMediaProgress(currentTime: number, duration?: number): void {
    if (this.stateMachine.getState() !== 'adPlaying') return;

    this.stateMachine.updateAdProgress(currentTime, duration);

    if (this.currentCreative?.linear) {
      const dur = duration && duration > 0 ? duration : this.currentCreative.linear.duration;
      this.tracking.onAdProgress(currentTime, dur, this.currentCreative.linear.trackingEvents);
    }
  }

  public onAdMediaEnd(): void {
    if (this.currentCreative?.linear) {
      this.tracking.onAdProgress(
        this.currentCreative.linear.duration,
        this.currentCreative.linear.duration,
        this.currentCreative.linear.duration > 0 ? this.currentCreative.linear.trackingEvents : []
      );
    }
    this.completeCurrentAd();
  }

  public onAdMediaError(err: Error): void {
    this.tracking.trackError(this.currentErrorUrls, VastErrorCode.MEDIA_FILE_DISPLAY_ERROR);
    this.stateMachine.setError(err);
    this.resumeContentAfterAd();
  }

  public skipAd(): void {
    const snap = this.stateMachine.getSnapshot();
    if (!snap.canSkip) return;

    if (this.currentCreative?.linear) {
      this.tracking.trackSkip(this.currentCreative.linear.trackingEvents);
    }

    this.stateMachine.transitionTo('adSkipped');
    this.resumeContentAfterAd();
  }

  public pauseAd(): void {
    if (this.stateMachine.transitionTo('adPaused')) {
      if (this.currentCreative?.linear) {
        this.tracking.trackPause(this.currentCreative.linear.trackingEvents);
      }
    }
  }

  public resumeAd(): void {
    if (this.stateMachine.transitionTo('adPlaying')) {
      if (this.currentCreative?.linear) {
        this.tracking.trackResume(this.currentCreative.linear.trackingEvents);
      }
    }
  }

  public muteAd(): void {
    this.stateMachine.setMuted(true);
    if (this.currentCreative?.linear) {
      this.tracking.trackMute(this.currentCreative.linear.trackingEvents);
    }
  }

  public unmuteAd(): void {
    this.stateMachine.setMuted(false);
    if (this.currentCreative?.linear) {
      this.tracking.trackUnmute(this.currentCreative.linear.trackingEvents);
    }
  }

  public clickAd(): string | undefined {
    let clickUrl: string | undefined;

    // Linear click
    if (this.currentCreative?.linear?.videoClicks) {
      clickUrl = this.currentCreative.linear.videoClicks.clickThrough?.url;
      const trackingUrls = this.currentCreative.linear.videoClicks.clickTrackings.map((c) => c.url);
      this.tracking.trackClicks(trackingUrls);
    }

    // NonLinear click
    const snap = this.stateMachine.getSnapshot();
    if (!clickUrl && snap.nonLinearAds.length > 0) {
      const nl = snap.nonLinearAds[0];
      clickUrl = nl.nonLinearClickThrough;
      this.tracking.trackClicks(nl.nonLinearClickTrackings);
    }

    // TextAd click
    if (!clickUrl && snap.textAd) {
      clickUrl = snap.textAd.clickUrl;
    }

    const sanitized = UrlValidator.sanitizeUrl(clickUrl);
    this.stateMachine.getSnapshot(); // trigger check
    return sanitized || undefined;
  }

  private completeCurrentAd(): void {
    this.stateMachine.transitionTo('adCompleted');
    this.resumeContentAfterAd();
  }

  private resumeContentAfterAd(): void {
    if (this.currentActiveBreak) {
      this.scheduler.markBreakCompleted(this.currentActiveBreak.id);
      this.currentActiveBreak = null;
    }
    this.scheduler.setAdActive(false);

    if (this.autoResumeContent && this.playerAdapter) {
      this.playerAdapter.resumeContent();
    }

    this.stateMachine.transitionTo('contentPlaying');
  }

  private handleAdBreakCompleted(_breakItem: ScheduledBreak): void {
    // Notify if needed
  }

  public destroy(): void {
    this.detachPlayerAdapter();
    this.stateMachine.destroy();
    this.scheduler.reset();
    this.tracking.reset();
  }
}
