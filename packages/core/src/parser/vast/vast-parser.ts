import { XMLParser } from 'fast-xml-parser';
import type {
  VastDocument,
  VastAd,
  VastInLine,
  VastWrapper,
  VastCreative,
  VastLinearCreative,
  VastMediaFile,
  VastVideoClicks,
  VastTrackingEvent,
  VastNonLinearAdsCreative,
  VastNonLinear,
  VastCompanionAdsCreative,
  VastCompanion,
  VastStaticResource,
  VastHTMLResource,
  VastIFrameResource,
  VastExtension,
  VastImpression,
} from '../../types/vast';
import {
  ensureArray,
  extractText,
  parseTimecodeToSeconds,
  parseOffset,
  parseInteger,
  parseBoolean,
} from './xml-utils';
import { VastError, VastErrorCode } from '../../types/errors';

export class VastParser {
  private parser: XMLParser;

  constructor() {
    this.parser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: '@_',
      cdataPropName: '__cdata',
      parseTagValue: false,
      trimValues: true,
      removeNSPrefix: true, // removes namespaces like vmap:, vast:, etc. for uniform processing
    });
  }

  /**
   * Parse a VAST XML string into a normalized VastDocument object
   */
  public parse(xmlString: string): VastDocument {
    if (!xmlString || typeof xmlString !== 'string' || xmlString.trim().length === 0) {
      throw new VastError('Empty or invalid VAST XML content', VastErrorCode.XML_PARSING_ERROR);
    }

    let parsedXml: any;
    try {
      parsedXml = this.parser.parse(xmlString);
    } catch (err: any) {
      throw new VastError(`XML syntax parsing error: ${err.message}`, VastErrorCode.XML_PARSING_ERROR);
    }

    if (!parsedXml || typeof parsedXml !== 'object') {
      throw new VastError('Parsed VAST XML root is not an object', VastErrorCode.XML_PARSING_ERROR);
    }

    // Look for VAST root node
    const vastRoot = parsedXml.VAST || parsedXml.vast;
    if (!vastRoot) {
      throw new VastError('Missing VAST root element in XML', VastErrorCode.VAST_SCHEMA_VALIDATION_ERROR);
    }

    const version = String(vastRoot['@_version'] || '3.0');

    // Root level Error elements
    const rootErrors = ensureArray(vastRoot.Error || vastRoot.error)
      .map(extractText)
      .filter(Boolean);

    // Ads
    const rawAds = ensureArray(vastRoot.Ad || vastRoot.ad);
    const ads: VastAd[] = rawAds.map((adNode) => this.parseAd(adNode));

    return {
      version,
      ads,
      errors: rootErrors,
    };
  }

  private parseAd(adNode: any): VastAd {
    const id = String(adNode['@_id'] || '');
    const sequence = parseInteger(adNode['@_sequence']);
    const conditionalAd = parseBoolean(adNode['@_conditionalAd']);

    const inlineNode = adNode.InLine || adNode.inline;
    const wrapperNode = adNode.Wrapper || adNode.wrapper;

    const ad: VastAd = {
      id,
      sequence,
      conditionalAd,
    };

    if (inlineNode) {
      ad.inline = this.parseInLine(inlineNode);
    } else if (wrapperNode) {
      ad.wrapper = this.parseWrapper(wrapperNode);
    }

    return ad;
  }

  private parseInLine(node: any): VastInLine {
    const adSystemNode = node.AdSystem || node.adSystem;
    const adSystem = {
      name: extractText(adSystemNode),
      version: adSystemNode?.['@_version'] ? String(adSystemNode['@_version']) : undefined,
    };

    const adTitle = extractText(node.AdTitle || node.adTitle);
    const description = extractText(node.Description || node.description) || undefined;
    const advertiser = extractText(node.Advertiser || node.advertiser) || undefined;
    const surveyUrl = extractText(node.Survey || node.survey) || undefined;

    // Pricing
    let pricing;
    const pricingNode = node.Pricing || node.pricing;
    if (pricingNode) {
      pricing = {
        model: String(pricingNode['@_model'] || 'cpm'),
        currency: String(pricingNode['@_currency'] || 'USD'),
        value: parseFloat(extractText(pricingNode)) || 0,
      };
    }

    // Errors
    const errorUrls = ensureArray(node.Error || node.error)
      .map(extractText)
      .filter(Boolean);

    // Impressions
    const impressions = this.parseImpressions(node.Impression || node.impression);

    // Creatives
    const creativesNode = node.Creatives || node.creatives;
    const rawCreatives = creativesNode ? ensureArray(creativesNode.Creative || creativesNode.creative) : [];
    const creatives: VastCreative[] = rawCreatives.map((crNode) => this.parseCreative(crNode));

    // Extensions
    const extensionsNode = node.Extensions || node.extensions;
    const rawExtensions = extensionsNode ? ensureArray(extensionsNode.Extension || extensionsNode.extension) : [];
    const extensions: VastExtension[] = rawExtensions.map((extNode) => this.parseExtension(extNode));

    return {
      adSystem,
      adTitle,
      description,
      advertiser,
      pricing,
      surveyUrl,
      errorUrls,
      impressions,
      creatives,
      extensions,
    };
  }

  private parseWrapper(node: any): VastWrapper {
    const adSystemNode = node.AdSystem || node.adSystem;
    const adSystem = {
      name: extractText(adSystemNode),
      version: adSystemNode?.['@_version'] ? String(adSystemNode['@_version']) : undefined,
    };

    const vastAdTagURI = extractText(node.VASTAdTagURI || node.vastAdTagURI);

    const errorUrls = ensureArray(node.Error || node.error)
      .map(extractText)
      .filter(Boolean);

    const impressions = this.parseImpressions(node.Impression || node.impression);

    const creativesNode = node.Creatives || node.creatives;
    const rawCreatives = creativesNode ? ensureArray(creativesNode.Creative || creativesNode.creative) : [];
    const creatives: VastCreative[] = rawCreatives.map((crNode) => this.parseCreative(crNode));

    const extensionsNode = node.Extensions || node.extensions;
    const rawExtensions = extensionsNode ? ensureArray(extensionsNode.Extension || extensionsNode.extension) : [];
    const extensions: VastExtension[] = rawExtensions.map((extNode) => this.parseExtension(extNode));

    return {
      adSystem,
      vastAdTagURI,
      errorUrls,
      impressions,
      creatives,
      extensions,
      fallbackOnNoAd: parseBoolean(node['@_fallbackOnNoAd']),
      allowMultipleAds: parseBoolean(node['@_allowMultipleAds']),
      followAdditionalWrappers: parseBoolean(node['@_followAdditionalWrappers'], true),
    };
  }

  private parseImpressions(raw: any): VastImpression[] {
    return ensureArray(raw)
      .map((imp): VastImpression | null => {
        const url = extractText(imp);
        if (!url) return null;
        return {
          id: imp?.['@_id'] ? String(imp['@_id']) : undefined,
          url,
        };
      })
      .filter((imp): imp is VastImpression => Boolean(imp));
  }

  private parseCreative(node: any): VastCreative {
    const id = node['@_id'] ? String(node['@_id']) : undefined;
    const sequence = parseInteger(node['@_sequence']);
    const adId = node['@_adId'] ? String(node['@_adId']) : undefined;
    const apiFramework = node['@_apiFramework'] ? String(node['@_apiFramework']) : undefined;

    const creative: VastCreative = {
      id,
      sequence,
      adId,
      apiFramework,
    };

    const linearNode = node.Linear || node.linear;
    if (linearNode) {
      creative.linear = this.parseLinear(linearNode);
    }

    const nonLinearAdsNode = node.NonLinearAds || node.nonLinearAds;
    if (nonLinearAdsNode) {
      creative.nonLinearAds = this.parseNonLinearAds(nonLinearAdsNode);
    }

    const companionAdsNode = node.CompanionAds || node.companionAds;
    if (companionAdsNode) {
      creative.companionAds = this.parseCompanionAds(companionAdsNode);
    }

    return creative;
  }

  private parseLinear(node: any): VastLinearCreative {
    const durationText = extractText(node.Duration || node.duration);
    const duration = parseTimecodeToSeconds(durationText);

    const skipoffsetAttr = node['@_skipoffset'];
    const { seconds: skipoffset, raw: skipoffsetRaw } = parseOffset(skipoffsetAttr, duration);

    // MediaFiles
    const mediaFilesNode = node.MediaFiles || node.mediaFiles;
    const rawMediaFiles = mediaFilesNode ? ensureArray(mediaFilesNode.MediaFile || mediaFilesNode.mediaFile) : [];
    const mediaFiles: VastMediaFile[] = rawMediaFiles
      .map((mf): VastMediaFile | null => {
        const url = extractText(mf);
        if (!url) return null;
        return {
          id: mf['@_id'] ? String(mf['@_id']) : undefined,
          delivery: String(mf['@_delivery'] || 'progressive'),
          type: String(mf['@_type'] || 'video/mp4'),
          bitrate: parseInteger(mf['@_bitrate']),
          minBitrate: parseInteger(mf['@_minBitrate']),
          maxBitrate: parseInteger(mf['@_maxBitrate']),
          width: parseInteger(mf['@_width'], 0) || 0,
          height: parseInteger(mf['@_height'], 0) || 0,
          scalable: parseBoolean(mf['@_scalable'], true),
          maintainAspectRatio: parseBoolean(mf['@_maintainAspectRatio'], true),
          apiFramework: mf['@_apiFramework'] ? String(mf['@_apiFramework']) : undefined,
          url,
        };
      })
      .filter((mf): mf is VastMediaFile => Boolean(mf));

    // TrackingEvents
    const trackingEvents = this.parseTrackingEvents(node.TrackingEvents || node.trackingEvents, duration);

    // VideoClicks
    let videoClicks: VastVideoClicks | undefined;
    const videoClicksNode = node.VideoClicks || node.videoClicks;
    if (videoClicksNode) {
      const ctNode = videoClicksNode.ClickThrough || videoClicksNode.clickThrough;
      const clickThrough = ctNode
        ? {
            id: ctNode['@_id'] ? String(ctNode['@_id']) : undefined,
            url: extractText(ctNode),
          }
        : undefined;

      const clickTrackings = ensureArray(videoClicksNode.ClickTracking || videoClicksNode.clickTracking)
        .map((ct) => ({
          id: ct['@_id'] ? String(ct['@_id']) : undefined,
          url: extractText(ct),
        }))
        .filter((ct) => Boolean(ct.url));

      const customClicks = ensureArray(videoClicksNode.CustomClick || videoClicksNode.customClick)
        .map((cc) => ({
          id: cc['@_id'] ? String(cc['@_id']) : undefined,
          url: extractText(cc),
        }))
        .filter((cc) => Boolean(cc.url));

      videoClicks = {
        clickThrough,
        clickTrackings,
        customClicks,
      };
    }

    // AdParameters
    let adParameters;
    const adParamsNode = node.AdParameters || node.adParameters;
    if (adParamsNode) {
      adParameters = {
        xmlEncoded: parseBoolean(adParamsNode['@_xmlEncoded']),
        value: extractText(adParamsNode),
      };
    }

    return {
      duration,
      skipoffset,
      skipoffsetRaw,
      mediaFiles,
      trackingEvents,
      videoClicks,
      adParameters,
    };
  }

  private parseNonLinearAds(node: any): VastNonLinearAdsCreative {
    const rawNonLinears = ensureArray(node.NonLinear || node.nonLinear);
    const nonLinears: VastNonLinear[] = rawNonLinears.map((nl) => {
      const id = nl['@_id'] ? String(nl['@_id']) : undefined;
      const width = parseInteger(nl['@_width'], 0) || 0;
      const height = parseInteger(nl['@_height'], 0) || 0;
      const expandedWidth = parseInteger(nl['@_expandedWidth']);
      const expandedHeight = parseInteger(nl['@_expandedHeight']);
      const scalable = parseBoolean(nl['@_scalable'], true);
      const maintainAspectRatio = parseBoolean(nl['@_maintainAspectRatio'], true);
      const minSuggestedDuration = parseTimecodeToSeconds(extractText(nl['@_minSuggestedDuration']));
      const apiFramework = nl['@_apiFramework'] ? String(nl['@_apiFramework']) : undefined;

      const staticResNode = nl.StaticResource || nl.staticResource;
      let staticResource: VastStaticResource | undefined;
      if (staticResNode) {
        staticResource = {
          creativeType: String(staticResNode['@_creativeType'] || 'image/png'),
          url: extractText(staticResNode),
        };
      }

      const htmlResNode = nl.HTMLResource || nl.htmlResource;
      let htmlResource: VastHTMLResource | undefined;
      if (htmlResNode) {
        htmlResource = {
          html: extractText(htmlResNode),
        };
      }

      const iframeResNode = nl.IFrameResource || nl.iframeResource;
      let iframeResource: VastIFrameResource | undefined;
      if (iframeResNode) {
        iframeResource = {
          url: extractText(iframeResNode),
        };
      }

      const nonLinearClickThrough = extractText(nl.NonLinearClickThrough || nl.nonLinearClickThrough) || undefined;
      const nonLinearClickTrackings = ensureArray(nl.NonLinearClickTracking || nl.nonLinearClickTracking)
        .map(extractText)
        .filter(Boolean);

      const extNode = nl.Extensions || nl.extensions;
      const extensions = extNode ? ensureArray(extNode.Extension || extNode.extension).map((e) => this.parseExtension(e)) : [];

      return {
        id,
        width,
        height,
        expandedWidth,
        expandedHeight,
        scalable,
        maintainAspectRatio,
        minSuggestedDuration,
        apiFramework,
        staticResource,
        htmlResource,
        iframeResource,
        nonLinearClickThrough,
        nonLinearClickTrackings,
        extensions,
      };
    });

    const trackingEvents = this.parseTrackingEvents(node.TrackingEvents || node.trackingEvents);

    return {
      nonLinears,
      trackingEvents,
    };
  }

  private parseCompanionAds(node: any): VastCompanionAdsCreative {
    const rawCompanions = ensureArray(node.Companion || node.companion);
    const companions: VastCompanion[] = rawCompanions.map((comp) => {
      const id = comp['@_id'] ? String(comp['@_id']) : undefined;
      const width = parseInteger(comp['@_width'], 0) || 0;
      const height = parseInteger(comp['@_height'], 0) || 0;
      const assetWidth = parseInteger(comp['@_assetWidth']);
      const assetHeight = parseInteger(comp['@_assetHeight']);
      const expandedWidth = parseInteger(comp['@_expandedWidth']);
      const expandedHeight = parseInteger(comp['@_expandedHeight']);
      const apiFramework = comp['@_apiFramework'] ? String(comp['@_apiFramework']) : undefined;

      const staticResNode = comp.StaticResource || comp.staticResource;
      let staticResource: VastStaticResource | undefined;
      if (staticResNode) {
        staticResource = {
          creativeType: String(staticResNode['@_creativeType'] || 'image/jpeg'),
          url: extractText(staticResNode),
        };
      }

      const htmlResNode = comp.HTMLResource || comp.htmlResource;
      let htmlResource: VastHTMLResource | undefined;
      if (htmlResNode) {
        htmlResource = {
          html: extractText(htmlResNode),
        };
      }

      const iframeResNode = comp.IFrameResource || comp.iframeResource;
      let iframeResource: VastIFrameResource | undefined;
      if (iframeResNode) {
        iframeResource = {
          url: extractText(iframeResNode),
        };
      }

      const altText = extractText(comp.AltText || comp.altText) || undefined;
      const companionClickThrough = extractText(comp.CompanionClickThrough || comp.companionClickThrough) || undefined;
      const companionClickTrackings = ensureArray(comp.CompanionClickTracking || comp.companionClickTracking)
        .map(extractText)
        .filter(Boolean);

      const trackingEvents = this.parseTrackingEvents(comp.TrackingEvents || comp.trackingEvents);

      const extNode = comp.Extensions || comp.extensions;
      const extensions = extNode ? ensureArray(extNode.Extension || extNode.extension).map((e) => this.parseExtension(e)) : [];

      return {
        id,
        width,
        height,
        assetWidth,
        assetHeight,
        expandedWidth,
        expandedHeight,
        apiFramework,
        staticResource,
        htmlResource,
        iframeResource,
        altText,
        companionClickThrough,
        companionClickTrackings,
        trackingEvents,
        extensions,
      };
    });

    return {
      companions,
    };
  }

  private parseTrackingEvents(node: any, totalDuration?: number): VastTrackingEvent[] {
    if (!node) return [];
    const rawTrackings = ensureArray(node.Tracking || node.tracking);
    return rawTrackings
      .map((t): VastTrackingEvent | null => {
        const event = String(t['@_event'] || '');
        const url = extractText(t);
        if (!event || !url) return null;

        const offsetAttr = t['@_offset'];
        let offset: number | undefined;
        let offsetRaw: string | undefined;

        if (offsetAttr) {
          const parsed = parseOffset(offsetAttr, totalDuration);
          offset = parsed.seconds;
          offsetRaw = parsed.raw;
        }

        return {
          event,
          url,
          offset,
          offsetRaw,
        };
      })
      .filter((t): t is VastTrackingEvent => Boolean(t));
  }

  private parseExtension(extNode: any): VastExtension {
    const type = extNode['@_type'] ? String(extNode['@_type']) : undefined;
    const name = extNode['@_name'] ? String(extNode['@_name']) : undefined;

    return {
      type,
      name,
      raw: extNode,
      value: extractText(extNode),
      children: extNode,
    };
  }
}
