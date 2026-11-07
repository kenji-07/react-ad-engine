import type { VastMediaFile } from '../types/vast';
import type { MediaSelectionCriteria, MediaSelectionResult } from '../types/media-selection';

const DEFAULT_SUPPORTED_MIME_TYPES = [
  'video/mp4',
  'video/webm',
  'video/ogg',
  'application/x-mpegurl',
  'application/vnd.apple.mpegurl',
];

export class MediaSelector {
  /**
   * Selects the most optimal media file based on device/player criteria
   */
  public static selectOptimalMediaFile(
    mediaFiles: VastMediaFile[],
    criteria: MediaSelectionCriteria = {}
  ): MediaSelectionResult {
    if (!mediaFiles || mediaFiles.length === 0) {
      return { mediaFile: null, allCompatible: [] };
    }

    const supportedTypes = (criteria.supportedMimeTypes || DEFAULT_SUPPORTED_MIME_TYPES).map((t: string) =>
      t.toLowerCase()
    );

    // Filter by delivery if specified
    let filtered = mediaFiles.filter((mf) => {
      const type = (mf.type || '').toLowerCase();
      const isMimeSupported = supportedTypes.some((supported: string) => type.includes(supported) || supported.includes(type));
      if (!isMimeSupported) return false;

      if (criteria.delivery && mf.delivery && mf.delivery.toLowerCase() !== criteria.delivery.toLowerCase()) {
        return false;
      }
      return true;
    });

    if (filtered.length === 0) {
      // Fallback: relax mime type check if none matched exactly
      filtered = [...mediaFiles];
    }

    // Sort by best fit
    const targetWidth = criteria.expectedWidth || 1920;
    const targetBitrate = criteria.preferredBitrate || 2500;

    const scored = filtered.map((mf) => {
      let score = 0;

      // Resolution match
      if (mf.width > 0) {
        const widthDiff = Math.abs(mf.width - targetWidth);
        score += widthDiff;
      }

      // Bitrate match
      if (mf.bitrate && mf.bitrate > 0) {
        if (criteria.preferHighestBitrate) {
          score -= mf.bitrate; // higher bitrate gets lower (better) score
        } else {
          score += Math.abs(mf.bitrate - targetBitrate);
        }
      }

      return { mf, score };
    });

    scored.sort((a, b) => a.score - b.score);

    return {
      mediaFile: scored[0]?.mf || null,
      allCompatible: filtered,
    };
  }
}
