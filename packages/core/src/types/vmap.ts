/**
 * VMAP 1.0.1 Data Types
 */

import type { VastDocument } from './vast';

export type VmapBreakType = 'linear' | 'nonlinear' | 'display' | string;

export type VmapTimeOffsetType = 'start' | 'end' | 'time' | 'percentage' | 'position';

export interface VmapTimeOffset {
  raw: string; // 'start', 'end', '00:05:00', '25%', '#1'
  type: VmapTimeOffsetType;
  seconds?: number; // Calculated seconds if timecode or start=0
  percentage?: number; // 0..100 if percentage
  position?: number; // sequence number if #n
}

export interface VmapAdTagURI {
  templateType: string; // e.g. "vast3", "vast2"
  url: string;
}

export interface VmapAdSource {
  id?: string;
  allowMultipleAds?: boolean;
  followRedirects?: boolean;
  adTagURI?: VmapAdTagURI;
  vastAdData?: VastDocument;
  rawVastXml?: string;
}

export type VmapTrackingEventType = 'breakStart' | 'breakEnd' | 'error' | string;

export interface VmapTrackingEvent {
  event: VmapTrackingEventType;
  url: string;
}

export interface VmapAdBreak {
  breakId?: string;
  breakType: VmapBreakType;
  timeOffset: VmapTimeOffset;
  repeatAfter?: number; // seconds
  adSource?: VmapAdSource;
  trackingEvents: VmapTrackingEvent[];
  extensions: any[];
}

export interface VmapDocument {
  version: string;
  adBreaks: VmapAdBreak[];
  extensions: any[];
}
