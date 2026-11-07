/**
 * VAST 3.0 (and 4.x extensible) Data Types
 */

export interface VastDocument {
  version: string;
  ads: VastAd[];
  errors: string[];
}

export interface VastAd {
  id: string;
  sequence?: number;
  conditionalAd?: boolean;
  inline?: VastInLine;
  wrapper?: VastWrapper;
}

export interface VastInLine {
  adSystem: VastSystem;
  adTitle: string;
  description?: string;
  advertiser?: string;
  pricing?: VastPricing;
  surveyUrl?: string;
  errorUrls: string[];
  impressions: VastImpression[];
  creatives: VastCreative[];
  extensions: VastExtension[];
}

export interface VastWrapper {
  adSystem: VastSystem;
  vastAdTagURI: string;
  errorUrls: string[];
  impressions: VastImpression[];
  creatives: VastCreative[];
  extensions: VastExtension[];
  fallbackOnNoAd?: boolean;
  allowMultipleAds?: boolean;
  followAdditionalWrappers?: boolean;
}

export interface VastSystem {
  name: string;
  version?: string;
}

export interface VastPricing {
  model: 'cpm' | 'cpc' | 'cpe' | 'cpv' | string;
  currency: string;
  value: number;
}

export interface VastImpression {
  id?: string;
  url: string;
}

export interface VastCreative {
  id?: string;
  sequence?: number;
  adId?: string;
  apiFramework?: string;
  linear?: VastLinearCreative;
  nonLinearAds?: VastNonLinearAdsCreative;
  companionAds?: VastCompanionAdsCreative;
}

export interface VastLinearCreative {
  duration: number; // Duration in seconds
  skipoffset?: number; // Skip offset in seconds (if present)
  skipoffsetRaw?: string; // e.g. "00:00:05" or "10%"
  mediaFiles: VastMediaFile[];
  trackingEvents: VastTrackingEvent[];
  videoClicks?: VastVideoClicks;
  adParameters?: VastAdParameters;
  icons?: VastIcon[];
}

export interface VastMediaFile {
  id?: string;
  delivery: 'progressive' | 'streaming' | string;
  type: string; // e.g. "video/mp4", "video/webm", "application/x-mpegURL"
  bitrate?: number; // kbps
  minBitrate?: number;
  maxBitrate?: number;
  width: number;
  height: number;
  scalable?: boolean;
  maintainAspectRatio?: boolean;
  apiFramework?: string;
  url: string;
}

export interface VastVideoClicks {
  clickThrough?: VastClickThrough;
  clickTrackings: VastClickTracking[];
  customClicks: VastCustomClick[];
}

export interface VastClickThrough {
  id?: string;
  url: string;
}

export interface VastClickTracking {
  id?: string;
  url: string;
}

export interface VastCustomClick {
  id?: string;
  url: string;
}

export type VastTrackingEventType =
  | 'creativeView'
  | 'start'
  | 'firstQuartile'
  | 'midpoint'
  | 'thirdQuartile'
  | 'complete'
  | 'mute'
  | 'unmute'
  | 'pause'
  | 'rewind'
  | 'resume'
  | 'fullscreen'
  | 'exitFullscreen'
  | 'expand'
  | 'collapse'
  | 'acceptInvitation'
  | 'close'
  | 'skip'
  | 'progress'
  | string;

export interface VastTrackingEvent {
  event: VastTrackingEventType;
  url: string;
  offset?: number; // offset in seconds if event === 'progress'
  offsetRaw?: string;
}

export interface VastNonLinearAdsCreative {
  nonLinears: VastNonLinear[];
  trackingEvents: VastTrackingEvent[];
}

export interface VastNonLinear {
  id?: string;
  width: number;
  height: number;
  expandedWidth?: number;
  expandedHeight?: number;
  scalable?: boolean;
  maintainAspectRatio?: boolean;
  minSuggestedDuration?: number;
  apiFramework?: string;
  staticResource?: VastStaticResource;
  htmlResource?: VastHTMLResource;
  iframeResource?: VastIFrameResource;
  nonLinearClickThrough?: string;
  nonLinearClickTrackings: string[];
  adParameters?: VastAdParameters;
  extensions: VastExtension[];
}

export interface VastCompanionAdsCreative {
  companions: VastCompanion[];
}

export interface VastCompanion {
  id?: string;
  width: number;
  height: number;
  assetWidth?: number;
  assetHeight?: number;
  expandedWidth?: number;
  expandedHeight?: number;
  apiFramework?: string;
  staticResource?: VastStaticResource;
  htmlResource?: VastHTMLResource;
  iframeResource?: VastIFrameResource;
  altText?: string;
  companionClickThrough?: string;
  companionClickTrackings: string[];
  trackingEvents: VastTrackingEvent[];
  adParameters?: VastAdParameters;
  extensions: VastExtension[];
}

export interface VastStaticResource {
  creativeType: string; // e.g. "image/jpeg", "image/png", "image/gif"
  url: string;
}

export interface VastHTMLResource {
  html: string;
}

export interface VastIFrameResource {
  url: string;
}

export interface VastAdParameters {
  xmlEncoded?: boolean;
  value: string;
}

export interface VastIcon {
  program: string;
  width: number;
  height: number;
  xPosition: string; // 'left' | 'right' | number
  yPosition: string; // 'top' | 'bottom' | number
  duration?: number;
  offset?: number;
  apiFramework?: string;
  staticResource?: VastStaticResource;
  htmlResource?: VastHTMLResource;
  iframeResource?: VastIFrameResource;
  iconClickThrough?: string;
  iconClickTrackings: string[];
  iconViewTrackings: string[];
}

export interface VastExtension {
  type?: string;
  name?: string;
  attributes?: Record<string, string>;
  raw?: any;
  value?: string;
  children?: any;
}
