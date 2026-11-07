import type {
  VastExtension,
} from '../../types/vast';
import type {
  ParsedCustomExtensions,
  RollPlacementType,
} from '../../types/custom-extensions';
import { extractText, parseBoolean, parseInteger } from './xml-utils';

export class CustomExtensionsParser {
  public static parse(extensions: VastExtension[]): ParsedCustomExtensions {
    const result: ParsedCustomExtensions = {
      otherExtensions: [],
    };

    for (const ext of extensions) {
      const type = (ext.type || '').trim().toLowerCase();
      const raw = ext.raw;

      if (type === 'rollplacement') {
        const placementText = extractText(raw?.Placement || raw?.placement || ext.value).toLowerCase();
        let placement: RollPlacementType = 'preroll';
        if (placementText === 'midroll' || placementText === 'postroll' || placementText === 'preroll') {
          placement = placementText as RollPlacementType;
        }
        result.rollPlacement = {
          type: 'RollPlacement',
          placement,
        };
      } else if (type === 'bannerplacement') {
        const placement = extractText(raw?.Placement || raw?.placement || ext.value) || 'overlay_banner';
        result.bannerPlacement = {
          type: 'BannerPlacement',
          placement,
        };
      } else if (type === 'textad') {
        const overlayNode = raw?.TextOverlay || raw?.textOverlay || raw;
        const enabled = parseBoolean(overlayNode?.['@_enabled'], true);
        const title = extractText(overlayNode?.Title || overlayNode?.title);
        const description = extractText(overlayNode?.Description || overlayNode?.description);
        const ctaButton = extractText(overlayNode?.CtaButton || overlayNode?.ctaButton);
        const clickUrl = extractText(overlayNode?.ClickUrl || overlayNode?.clickUrl);

        result.textAd = {
          type: 'TextAd',
          textOverlay: {
            enabled,
            title,
            description,
            ctaButton,
            clickUrl,
          },
        };
      } else if (type === 'companiondisplay') {
        const position = extractText(raw?.Position || raw?.position) || 'outside_player';
        const width = parseInteger(extractText(raw?.Width || raw?.width), 300) || 300;
        const height = parseInteger(extractText(raw?.Height || raw?.height), 250) || 250;

        result.companionDisplay = {
          type: 'CompanionDisplay',
          position,
          width,
          height,
        };
      } else {
        result.otherExtensions.push({
          type: ext.type,
          raw: ext.raw,
        });
      }
    }

    return result;
  }
}
