import { XMLParser } from 'fast-xml-parser';
import type {
  VmapDocument,
  VmapAdBreak,
  VmapAdSource,
  VmapTimeOffset,
  VmapTrackingEvent,
  VmapTrackingEventType,
} from '../../types/vmap';
import { ensureArray, extractText, parseBoolean, parseTimecodeToSeconds } from '../vast/xml-utils';
import { VastError, VastErrorCode } from '../../types/errors';

export class VmapParser {
  private xmlParser: XMLParser;

  constructor() {
    this.xmlParser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: '@_',
      cdataPropName: '__cdata',
      parseTagValue: false,
      trimValues: true,
      removeNSPrefix: true,
    });
  }

  public parse(xmlString: string): VmapDocument {
    if (!xmlString || typeof xmlString !== 'string' || xmlString.trim().length === 0) {
      throw new VastError('Empty or invalid VMAP XML', VastErrorCode.XML_PARSING_ERROR);
    }

    let parsed: any;
    try {
      parsed = this.xmlParser.parse(xmlString);
    } catch (err: any) {
      throw new VastError(`VMAP syntax error: ${err.message}`, VastErrorCode.XML_PARSING_ERROR);
    }

    const vmapRoot = parsed.VMAP || parsed.vmap;
    if (!vmapRoot) {
      throw new VastError('Missing VMAP root element', VastErrorCode.VAST_SCHEMA_VALIDATION_ERROR);
    }

    const version = String(vmapRoot['@_version'] || '1.0');
    const rawBreaks = ensureArray(vmapRoot.AdBreak || vmapRoot.adBreak);

    const adBreaks: VmapAdBreak[] = rawBreaks.map((bNode, index) => this.parseAdBreak(bNode, index));

    const extensionsNode = vmapRoot.Extensions || vmapRoot.extensions;
    const extensions = extensionsNode ? ensureArray(extensionsNode.Extension || extensionsNode.extension) : [];

    return {
      version,
      adBreaks,
      extensions,
    };
  }

  private parseAdBreak(node: any, index: number): VmapAdBreak {
    const breakId = node['@_breakId'] ? String(node['@_breakId']) : `break-${index}`;
    const breakType = String(node['@_breakType'] || 'linear');
    const timeOffsetRaw = String(node['@_timeOffset'] || 'start');
    const timeOffset = this.parseTimeOffset(timeOffsetRaw);
    const repeatAfter = node['@_repeatAfter'] ? parseTimecodeToSeconds(node['@_repeatAfter']) : undefined;

    // AdSource
    let adSource: VmapAdSource | undefined;
    const sourceNode = node.AdSource || node.adSource;
    if (sourceNode) {
      adSource = this.parseAdSource(sourceNode);
    }

    // TrackingEvents
    const trackingEvents = this.parseTrackingEvents(node.TrackingEvents || node.trackingEvents);

    // Extensions
    const extNode = node.Extensions || node.extensions;
    const extensions = extNode ? ensureArray(extNode.Extension || extNode.extension) : [];

    return {
      breakId,
      breakType,
      timeOffset,
      repeatAfter,
      adSource,
      trackingEvents,
      extensions,
    };
  }

  private parseTimeOffset(raw: string): VmapTimeOffset {
    const trimmed = raw.trim().toLowerCase();
    if (trimmed === 'start') {
      return { raw, type: 'start', seconds: 0 };
    }
    if (trimmed === 'end') {
      return { raw, type: 'end', seconds: -1 };
    }
    if (trimmed.endsWith('%')) {
      const pct = parseFloat(trimmed.replace('%', ''));
      return { raw, type: 'percentage', percentage: isNaN(pct) ? 0 : pct };
    }
    if (trimmed.startsWith('#')) {
      const pos = parseInt(trimmed.replace('#', ''), 10);
      return { raw, type: 'position', position: isNaN(pos) ? 1 : pos };
    }

    // Default to timecode hh:mm:ss
    const seconds = parseTimecodeToSeconds(trimmed);
    return { raw, type: 'time', seconds };
  }

  private parseAdSource(node: any): VmapAdSource {
    const id = node['@_id'] ? String(node['@_id']) : undefined;
    const allowMultipleAds = parseBoolean(node['@_allowMultipleAds'], true);
    const followRedirects = parseBoolean(node['@_followRedirects'], true);

    const tagNode = node.AdTagURI || node.adTagURI;
    let adTagURI;
    if (tagNode) {
      adTagURI = {
        templateType: String(tagNode['@_templateType'] || 'vast3'),
        url: extractText(tagNode),
      };
    }

    let vastAdData;
    let rawVastXml;
    const vastDataNode = node.VASTAdData || node.vastAdData;
    if (vastDataNode) {
      // If VAST root is inside VASTAdData
      const vastXmlNode = vastDataNode.VAST || vastDataNode.vast;
      if (vastXmlNode) {
        // Can convert or re-parse directly
        try {
          // If already in object form, we can parse or extract
          // We can serialize the node back to XML or parse using inner structure
          // Or reconstruct simple vast document
          rawVastXml = JSON.stringify(vastXmlNode);
        } catch {
          // ignore
        }
      }
    }

    return {
      id,
      allowMultipleAds,
      followRedirects,
      adTagURI,
      vastAdData,
      rawVastXml,
    };
  }

  private parseTrackingEvents(node: any): VmapTrackingEvent[] {
    if (!node) return [];
    const rawTrackings = ensureArray(node.Tracking || node.tracking);
    return rawTrackings
      .map((t): VmapTrackingEvent | null => {
        const event = String(t['@_event'] || '') as VmapTrackingEventType;
        const url = extractText(t);
        if (!event || !url) return null;
        return { event, url };
      })
      .filter((t): t is VmapTrackingEvent => Boolean(t));
  }
}
