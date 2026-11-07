/**
 * Custom VAST Extensions
 * Explicitly supported by our advertising engine
 */

export type RollPlacementType = 'preroll' | 'midroll' | 'postroll';

export interface RollPlacementExtension {
  type: 'RollPlacement';
  placement: RollPlacementType;
}

export interface BannerPlacementExtension {
  type: 'BannerPlacement';
  placement: 'overlay_banner' | string;
}

export interface TextAdData {
  enabled: boolean;
  title: string;
  description: string;
  ctaButton: string;
  clickUrl: string;
}

export interface TextAdExtension {
  type: 'TextAd';
  textOverlay: TextAdData;
}

export interface CompanionDisplayExtension {
  type: 'CompanionDisplay';
  position: 'outside_player' | 'inline' | string;
  width: number;
  height: number;
}

export interface ParsedCustomExtensions {
  rollPlacement?: RollPlacementExtension;
  bannerPlacement?: BannerPlacementExtension;
  textAd?: TextAdExtension;
  companionDisplay?: CompanionDisplayExtension;
  otherExtensions: Array<{
    type?: string;
    raw: any;
  }>;
}
