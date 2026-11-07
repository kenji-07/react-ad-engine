export interface TrackingEventToggles {
  impression?: boolean;
  creativeView?: boolean;
  start?: boolean;
  firstQuartile?: boolean;
  midpoint?: boolean;
  thirdQuartile?: boolean;
  complete?: boolean;
  skip?: boolean;
  mute?: boolean;
  unmute?: boolean;
  pause?: boolean;
  resume?: boolean;
  fullscreen?: boolean;
  exitFullscreen?: boolean;
  clickTracking?: boolean;
  error?: boolean;
  companionImpression?: boolean;
  customEvents?: Record<string, boolean>;
}

export interface TrackingContext {
  timestamp?: number;
  errorCode?: number | string;
  contentPlayhead?: number | string; // hh:mm:ss.mmm
  assetUri?: string;
  customMacros?: Record<string, string | number>;
}

export interface TrackingTransport {
  send(url: string, context?: TrackingContext): Promise<boolean>;
}

export interface TrackingConfig extends TrackingEventToggles {
  enabled: boolean;
  timeoutMs?: number;
  maxRetries?: number;
  transport?: TrackingTransport;
  customMacros?: Record<string, string | number>;
  onTrackSent?: (url: string, eventName: string) => void;
  onTrackFailed?: (url: string, eventName: string, error: any) => void;
}
