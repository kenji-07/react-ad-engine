import type { VastAd, VastCreative, VastDocument, VastInLine, VastTrackingEvent } from '../../types/vast';
import { VastError, VastErrorCode } from '../../types/errors';
import { VastParser } from './vast-parser';

export type HttpFetcher = (url: string, options?: { timeoutMs?: number; signal?: AbortSignal }) => Promise<string>;

export interface WrapperResolverOptions {
  maxDepth?: number;
  timeoutMs?: number;
  fetcher?: HttpFetcher;
}

export class WrapperResolver {
  private parser: VastParser;
  private maxDepth: number;
  private timeoutMs: number;
  private fetcher: HttpFetcher;

  constructor(options: WrapperResolverOptions = {}) {
    this.parser = new VastParser();
    this.maxDepth = options.maxDepth ?? 5;
    this.timeoutMs = options.timeoutMs ?? 10000;
    this.fetcher = options.fetcher ?? this.defaultFetcher.bind(this);
  }

  private async defaultFetcher(url: string, options?: { timeoutMs?: number }): Promise<string> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), options?.timeoutMs ?? this.timeoutMs);
    try {
      const res = await fetch(url, { signal: controller.signal });
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      }
      return await res.text();
    } finally {
      clearTimeout(timeout);
    }
  }

  /**
   * Resolves a VAST document, following wrappers until all ads are InLine
   */
  public async resolve(vastDoc: VastDocument): Promise<VastDocument> {
    const resolvedAds: VastAd[] = [];
    const rootErrors: string[] = [...vastDoc.errors];

    for (const ad of vastDoc.ads) {
      if (ad.inline) {
        resolvedAds.push(ad);
      } else if (ad.wrapper) {
        const resolvedAd = await this.resolveAdWrapper(ad, 0, new Set<string>(), rootErrors);
        if (resolvedAd) {
          resolvedAds.push(resolvedAd);
        }
      }
    }

    return {
      version: vastDoc.version,
      ads: resolvedAds,
      errors: rootErrors,
    };
  }

  private async resolveAdWrapper(
    ad: VastAd,
    currentDepth: number,
    visitedUrls: Set<string>,
    accumulatedErrors: string[]
  ): Promise<VastAd | null> {
    const wrapper = ad.wrapper;
    if (!wrapper) return ad;

    if (currentDepth >= this.maxDepth) {
      throw new VastError(
        `Wrapper depth limit of ${this.maxDepth} exceeded`,
        VastErrorCode.WRAPPER_LIMIT_REACHED,
        [...accumulatedErrors, ...wrapper.errorUrls]
      );
    }

    const wrapperUrl = wrapper.vastAdTagURI;
    if (!wrapperUrl) {
      throw new VastError(
        'Wrapper missing VASTAdTagURI',
        VastErrorCode.GENERAL_WRAPPER_ERROR,
        [...accumulatedErrors, ...wrapper.errorUrls]
      );
    }

    if (visitedUrls.has(wrapperUrl)) {
      throw new VastError(
        `Circular wrapper redirection detected at ${wrapperUrl}`,
        VastErrorCode.WRAPPER_LIMIT_REACHED,
        [...accumulatedErrors, ...wrapper.errorUrls]
      );
    }

    visitedUrls.add(wrapperUrl);
    accumulatedErrors.push(...wrapper.errorUrls);

    let responseXml: string;
    try {
      responseXml = await this.fetcher(wrapperUrl, { timeoutMs: this.timeoutMs });
    } catch (err: any) {
      const isTimeout = err.name === 'AbortError' || (err.message && err.message.includes('timeout'));
      const code = isTimeout ? VastErrorCode.WRAPPER_TIMEOUT : VastErrorCode.GENERAL_WRAPPER_ERROR;
      throw new VastError(`Failed to fetch wrapper URI "${wrapperUrl}": ${err.message}`, code, accumulatedErrors);
    }

    let parsedDoc: VastDocument;
    try {
      parsedDoc = this.parser.parse(responseXml);
    } catch (err: any) {
      throw new VastError(`Failed to parse wrapper XML from "${wrapperUrl}": ${err.message}`, VastErrorCode.XML_PARSING_ERROR, accumulatedErrors);
    }

    if (!parsedDoc.ads || parsedDoc.ads.length === 0) {
      if (wrapper.fallbackOnNoAd) {
        return null;
      }
      throw new VastError(`No VAST response after wrapper: "${wrapperUrl}"`, VastErrorCode.NO_VAST_RESPONSE, [
        ...accumulatedErrors,
        ...parsedDoc.errors,
      ]);
    }

    const targetAd = parsedDoc.ads[0];

    if (targetAd.inline) {
      // Merge wrapper data into inline ad
      const mergedInLine = this.mergeWrapperIntoInLine(wrapper, targetAd.inline, accumulatedErrors);
      return {
        id: ad.id || targetAd.id,
        sequence: ad.sequence ?? targetAd.sequence,
        conditionalAd: ad.conditionalAd ?? targetAd.conditionalAd,
        inline: mergedInLine,
      };
    } else if (targetAd.wrapper) {
      if (!wrapper.followAdditionalWrappers) {
        throw new VastError(
          `Wrapper configuration disallows following additional wrappers`,
          VastErrorCode.GENERAL_WRAPPER_ERROR,
          accumulatedErrors
        );
      }
      // Recursively follow next wrapper
      const deeperResolved = await this.resolveAdWrapper(targetAd, currentDepth + 1, visitedUrls, accumulatedErrors);
      if (!deeperResolved || !deeperResolved.inline) {
        return null;
      }
      const mergedInLine = this.mergeWrapperIntoInLine(wrapper, deeperResolved.inline, accumulatedErrors);
      return {
        id: ad.id || deeperResolved.id,
        sequence: ad.sequence ?? deeperResolved.sequence,
        conditionalAd: ad.conditionalAd ?? deeperResolved.conditionalAd,
        inline: mergedInLine,
      };
    }

    return null;
  }

  private mergeWrapperIntoInLine(wrapper: any, inline: VastInLine, accumulatedErrors: string[]): VastInLine {
    const errorUrls = Array.from(new Set([...accumulatedErrors, ...wrapper.errorUrls, ...inline.errorUrls]));
    const impressions = [...wrapper.impressions, ...inline.impressions];
    const extensions = [...wrapper.extensions, ...inline.extensions];

    // Merge creative tracking events and click tracking
    const mergedCreatives = inline.creatives.map((inlineCreative) => {
      const matchingWrapperCreative = wrapper.creatives.find((wc: VastCreative) => {
        if (inlineCreative.linear && wc.linear) return true;
        if (inlineCreative.nonLinearAds && wc.nonLinearAds) return true;
        if (inlineCreative.companionAds && wc.companionAds) return true;
        return false;
      });

      if (!matchingWrapperCreative) {
        return inlineCreative;
      }

      const merged = { ...inlineCreative };

      if (inlineCreative.linear && matchingWrapperCreative.linear) {
        const wrapperLinear = matchingWrapperCreative.linear;
        const inlineLinear = inlineCreative.linear;

        const mergedTracking: VastTrackingEvent[] = [
          ...wrapperLinear.trackingEvents,
          ...inlineLinear.trackingEvents,
        ];

        const clickTrackings = [
          ...(wrapperLinear.videoClicks?.clickTrackings || []),
          ...(inlineLinear.videoClicks?.clickTrackings || []),
        ];

        const customClicks = [
          ...(wrapperLinear.videoClicks?.customClicks || []),
          ...(inlineLinear.videoClicks?.customClicks || []),
        ];

        merged.linear = {
          ...inlineLinear,
          trackingEvents: mergedTracking,
          videoClicks: {
            clickThrough: inlineLinear.videoClicks?.clickThrough || wrapperLinear.videoClicks?.clickThrough,
            clickTrackings,
            customClicks,
          },
        };
      }

      if (inlineCreative.nonLinearAds && matchingWrapperCreative.nonLinearAds) {
        const wrapperNL = matchingWrapperCreative.nonLinearAds;
        const inlineNL = inlineCreative.nonLinearAds;

        merged.nonLinearAds = {
          ...inlineNL,
          trackingEvents: [...wrapperNL.trackingEvents, ...inlineNL.trackingEvents],
        };
      }

      if (inlineCreative.companionAds && matchingWrapperCreative.companionAds) {
        // Companions can be appended or merged
        merged.companionAds = {
          companions: [
            ...matchingWrapperCreative.companionAds.companions,
            ...inlineCreative.companionAds.companions,
          ],
        };
      }

      return merged;
    });

    return {
      ...inline,
      errorUrls,
      impressions,
      creatives: mergedCreatives,
      extensions,
    };
  }
}
