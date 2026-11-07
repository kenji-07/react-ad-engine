import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import { VastParser } from '../../packages/core/src/parser/vast/vast-parser';
import { CustomExtensionsParser } from '../../packages/core/src/parser/vast/custom-extensions-parser';
import { WrapperResolver } from '../../packages/core/src/parser/vast/wrapper-resolver';
import { VastError } from '../../packages/core/src/types/errors';

const fixturesDir = path.resolve(process.cwd(), 'tests/fixtures');

describe('VastParser & Custom Extensions', () => {
  const parser = new VastParser();

  it('1. Mandatory Fixture: Linear Video Ad parses correctly', () => {
    const xml = fs.readFileSync(path.join(fixturesDir, 'linear-video.vast.xml'), 'utf-8');
    const doc = parser.parse(xml);

    expect(doc.version).toBe('3.0');
    expect(doc.ads).toHaveLength(1);

    const ad = doc.ads[0];
    expect(ad.id).toBe('ad-linear-001');
    expect(ad.inline).toBeDefined();

    const inline = ad.inline!;
    expect(inline.adSystem.name).toBe('ReactAdEngine');
    expect(inline.adTitle).toBe('Linear Video Ad Sample');
    expect(inline.impressions).toHaveLength(2);
    expect(inline.impressions[0].url).toContain('https://tracking.example.com/impression?adId=ad-linear-001');

    const linear = inline.creatives[0].linear!;
    expect(linear).toBeDefined();
    expect(linear.duration).toBe(30);
    expect(linear.skipoffset).toBe(5);
    expect(linear.mediaFiles).toHaveLength(2);
    expect(linear.mediaFiles[0].type).toBe('video/mp4');
    expect(linear.mediaFiles[0].width).toBe(1920);
    expect(linear.mediaFiles[0].height).toBe(1080);
    expect(linear.mediaFiles[0].url).toContain('BigBuckBunny.mp4');

    // VideoClicks
    expect(linear.videoClicks?.clickThrough?.url).toBe('https://advertiser.example.com/landing-page');
    expect(linear.videoClicks?.clickTrackings).toHaveLength(2);

    // Tracking events
    const startEvent = linear.trackingEvents.find((t) => t.event === 'start');
    expect(startEvent).toBeDefined();
    expect(startEvent?.url).toBe('https://tracking.example.com/start');

    const progressEvent = linear.trackingEvents.find((t) => t.event === 'progress');
    expect(progressEvent).toBeDefined();
    expect(progressEvent?.offset).toBe(10);

    // Custom Extension: RollPlacement
    const customExt = CustomExtensionsParser.parse(inline.extensions);
    expect(customExt.rollPlacement).toBeDefined();
    expect(customExt.rollPlacement?.placement).toBe('preroll');
  });

  it('2. Mandatory Fixture: NonLinear Image Ad parses correctly', () => {
    const xml = fs.readFileSync(path.join(fixturesDir, 'nonlinear-image.vast.xml'), 'utf-8');
    const doc = parser.parse(xml);

    expect(doc.ads).toHaveLength(1);
    const inline = doc.ads[0].inline!;
    expect(inline.adTitle).toBe('NonLinear Image Ad Banner');

    const nonLinearCreative = inline.creatives[0].nonLinearAds!;
    expect(nonLinearCreative).toBeDefined();
    expect(nonLinearCreative.nonLinears).toHaveLength(1);

    const nl = nonLinearCreative.nonLinears[0];
    expect(nl.width).toBe(480);
    expect(nl.height).toBe(70);
    expect(nl.minSuggestedDuration).toBe(15);
    expect(nl.staticResource?.creativeType).toBe('image/png');
    expect(nl.staticResource?.url).toContain('Special+Promotion+Banner');
    expect(nl.nonLinearClickThrough).toBe('https://advertiser.example.com/nonlinear-promo');
    expect(nl.nonLinearClickTrackings).toHaveLength(1);

    // Custom Extension: BannerPlacement
    const customExt = CustomExtensionsParser.parse(inline.extensions);
    expect(customExt.bannerPlacement).toBeDefined();
    expect(customExt.bannerPlacement?.placement).toBe('overlay_banner');
  });

  it('3. Mandatory Fixture: HTML/Text Ad parses correctly', () => {
    const xml = fs.readFileSync(path.join(fixturesDir, 'html-text.vast.xml'), 'utf-8');
    const doc = parser.parse(xml);

    const inline = doc.ads[0].inline!;
    const nl = inline.creatives[0].nonLinearAds!.nonLinears[0];
    expect(nl.htmlResource?.html).toContain('Exclusive Offer');

    // Custom Extension: TextAd
    const customExt = CustomExtensionsParser.parse(inline.extensions);
    expect(customExt.textAd).toBeDefined();
    expect(customExt.textAd?.textOverlay.enabled).toBe(true);
    expect(customExt.textAd?.textOverlay.title).toBe('Text AD');
    expect(customExt.textAd?.textOverlay.description).toBe('Hello');
    expect(customExt.textAd?.textOverlay.ctaButton).toBe('Learn More');
    expect(customExt.textAd?.textOverlay.clickUrl).toBe('https://example.com');
  });

  it('4. Mandatory Fixture: Companion Ad parses correctly', () => {
    const xml = fs.readFileSync(path.join(fixturesDir, 'companion.vast.xml'), 'utf-8');
    const doc = parser.parse(xml);

    const inline = doc.ads[0].inline!;
    const companions = inline.creatives[0].companionAds!.companions;
    expect(companions).toHaveLength(2);

    expect(companions[0].width).toBe(300);
    expect(companions[0].height).toBe(250);
    expect(companions[0].staticResource?.creativeType).toBe('image/jpeg');
    expect(companions[0].altText).toBe('Visit our official store');
    expect(companions[0].companionClickThrough).toBe('https://advertiser.example.com/store');

    expect(companions[1].width).toBe(728);
    expect(companions[1].height).toBe(90);
    expect(companions[1].htmlResource?.html).toContain('Leaderboard Banner');

    // Custom Extension: CompanionDisplay
    const customExt = CustomExtensionsParser.parse(inline.extensions);
    expect(customExt.companionDisplay).toBeDefined();
    expect(customExt.companionDisplay?.position).toBe('outside_player');
    expect(customExt.companionDisplay?.width).toBe(300);
    expect(customExt.companionDisplay?.height).toBe(250);
  });

  it('handles CDATA, XML namespaces, and error handling', () => {
    // Malformed XML throws XML_PARSING_ERROR
    expect(() => parser.parse('not xml at all <<<')).toThrow(VastError);

    // Empty XML throws XML_PARSING_ERROR
    expect(() => parser.parse('')).toThrow(VastError);

    // Root without VAST tag
    expect(() => parser.parse('<OtherRoot></OtherRoot>')).toThrow(VastError);

    // Root Error XML
    const errorXml = fs.readFileSync(path.join(fixturesDir, 'error.vast.xml'), 'utf-8');
    const doc = parser.parse(errorXml);
    expect(doc.errors).toHaveLength(1);
    expect(doc.errors[0]).toContain('[ERRORCODE]');
  });

  it('resolves VAST wrapper chain and inherits tracking and impressions', async () => {
    const wrapperXml = fs.readFileSync(path.join(fixturesDir, 'wrapper.vast.xml'), 'utf-8');
    const targetInlineXml = fs.readFileSync(path.join(fixturesDir, 'linear-video.vast.xml'), 'utf-8');

    const wrapperDoc = parser.parse(wrapperXml);

    const mockFetcher = async (url: string) => {
      if (url === 'https://ads.example.com/target-inline.vast.xml') {
        return targetInlineXml;
      }
      throw new Error('Not found: ' + url);
    };

    const resolver = new WrapperResolver({ fetcher: mockFetcher, maxDepth: 3 });
    const resolvedDoc = await resolver.resolve(wrapperDoc);

    expect(resolvedDoc.ads).toHaveLength(1);
    const inline = resolvedDoc.ads[0].inline!;
    expect(inline).toBeDefined();

    // Impressions merged: 1 wrapper + 2 inline = 3
    expect(inline.impressions).toHaveLength(3);

    // Tracking events merged: wrapper start/complete + inline events
    const startEvents = inline.creatives[0].linear!.trackingEvents.filter((t) => t.event === 'start');
    expect(startEvents.length).toBeGreaterThanOrEqual(2);

    // Click tracking merged
    expect(inline.creatives[0].linear!.videoClicks?.clickTrackings.length).toBeGreaterThanOrEqual(3);
  });

  it('detects wrapper circular redirect and depth limit', async () => {
    const cyclicWrapper = `
      <VAST version="3.0">
        <Ad id="cycle">
          <Wrapper>
            <VASTAdTagURI>https://ads.example.com/cycle.xml</VASTAdTagURI>
          </Wrapper>
        </Ad>
      </VAST>
    `;
    const doc = parser.parse(cyclicWrapper);
    const resolver = new WrapperResolver({
      fetcher: async () => cyclicWrapper,
      maxDepth: 3,
    });

    await expect(resolver.resolve(doc)).rejects.toThrowError(/Circular wrapper redirection/);
  });
});
