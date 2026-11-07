import type { VastMediaFile } from './vast';

export interface MediaSelectionCriteria {
  expectedWidth?: number;
  expectedHeight?: number;
  preferredBitrate?: number;
  delivery?: 'progressive' | 'streaming';
  supportedMimeTypes?: string[];
  preferHighestBitrate?: boolean;
}

export interface MediaSelectionResult {
  mediaFile: VastMediaFile | null;
  allCompatible: VastMediaFile[];
}
