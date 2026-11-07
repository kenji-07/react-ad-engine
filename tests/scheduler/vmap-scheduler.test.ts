import { describe, it, expect, vi } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import { VmapParser } from '../../packages/core/src/parser/vmap/vmap-parser';
import { AdScheduler } from '../../packages/core/src/scheduler/ad-scheduler';

const fixturesDir = path.resolve(process.cwd(), 'tests/fixtures');

describe('VMAP Parser & Ad Scheduler', () => {
  const parser = new VmapParser();

  it('parses standard VMAP 1.0.1 document with preroll, midroll, and postroll', () => {
    const xml = fs.readFileSync(path.join(fixturesDir, 'vmap-standard.xml'), 'utf-8');
    const doc = parser.parse(xml);

    expect(doc.version).toBe('1.0');
    expect(doc.adBreaks).toHaveLength(3);

    const preroll = doc.adBreaks[0];
    expect(preroll.breakId).toBe('preroll');
    expect(preroll.timeOffset.type).toBe('start');
    expect(preroll.timeOffset.seconds).toBe(0);
    expect(preroll.adSource?.adTagURI?.url).toBe('https://ads.example.com/preroll.vast.xml');
    expect(preroll.trackingEvents).toHaveLength(2);

    const midroll = doc.adBreaks[1];
    expect(midroll.breakId).toBe('midroll-1');
    expect(midroll.timeOffset.type).toBe('time');
    expect(midroll.timeOffset.seconds).toBe(300); // 00:05:00 = 300s

    const postroll = doc.adBreaks[2];
    expect(postroll.breakId).toBe('postroll');
    expect(postroll.timeOffset.type).toBe('end');
    expect(postroll.timeOffset.seconds).toBe(-1);
  });

  it('schedules VMAP breaks and triggers preroll, midroll, and postroll in order', () => {
    const xml = fs.readFileSync(path.join(fixturesDir, 'vmap-standard.xml'), 'utf-8');
    const doc = parser.parse(xml);

    const requestSpy = vi.fn();
    const scheduler = new AdScheduler({}, { onRequestAdBreak: requestSpy });
    scheduler.scheduleVmap(doc);
    scheduler.setContentDuration(600); // 10 minute video

    // 1. Check preroll
    const prerollBreak = scheduler.checkPreroll();
    expect(prerollBreak).toBeDefined();
    expect(prerollBreak?.id).toBe('preroll');
    expect(requestSpy).toHaveBeenCalledWith(prerollBreak);

    // Mark preroll completed
    scheduler.markBreakCompleted('preroll');
    requestSpy.mockClear();

    // 2. Play content before midroll (e.g. 100s)
    scheduler.onContentProgress(100);
    expect(requestSpy).not.toHaveBeenCalled();

    // 3. Play content reaching midroll (300s)
    const midrollBreak = scheduler.onContentProgress(300);
    expect(midrollBreak).toBeDefined();
    expect(midrollBreak?.id).toBe('midroll-1');
    expect(requestSpy).toHaveBeenCalledWith(midrollBreak);

    // Mark midroll completed
    scheduler.markBreakCompleted('midroll-1');
    requestSpy.mockClear();

    // Progressing past midroll should not re-trigger
    scheduler.onContentProgress(305);
    expect(requestSpy).not.toHaveBeenCalled();

    // 4. Content ends -> postroll
    const postrollBreak = scheduler.onContentEnd();
    expect(postrollBreak).toBeDefined();
    expect(postrollBreak?.id).toBe('postroll');
    expect(requestSpy).toHaveBeenCalledWith(postrollBreak);
  });

  it('detects midroll seeking and applies "play-last" policy', () => {
    const scheduler = new AdScheduler({ missedBreakPolicy: 'play-last' });
    scheduler.addManualBreak({ id: 'mid-60', position: 'midroll', timeOffset: 60 });
    scheduler.addManualBreak({ id: 'mid-120', position: 'midroll', timeOffset: 120 });
    scheduler.addManualBreak({ id: 'mid-180', position: 'midroll', timeOffset: 180 });

    scheduler.setContentDuration(600);

    // User is at 10s, then seeks to 200s (jumping over 60, 120, 180)
    scheduler.onContentProgress(10);
    const missed = scheduler.onContentSeek(200);

    // Under play-last, only mid-180 should be returned to play
    expect(missed).toHaveLength(1);
    expect(missed[0].id).toBe('mid-180');

    // Earlier missed breaks should be marked played
    const breaks = scheduler.getBreaks();
    const b60 = breaks.find((b) => b.id === 'mid-60');
    const b120 = breaks.find((b) => b.id === 'mid-120');
    expect(b60?.hasPlayed).toBe(true);
    expect(b120?.hasPlayed).toBe(true);
  });

  it('detects midroll seeking and applies "ignore" policy', () => {
    const scheduler = new AdScheduler({ missedBreakPolicy: 'ignore' });
    scheduler.addManualBreak({ id: 'mid-60', position: 'midroll', timeOffset: 60 });
    scheduler.setContentDuration(600);

    scheduler.onContentProgress(10);
    const missed = scheduler.onContentSeek(100);

    // Should ignore and return empty
    expect(missed).toHaveLength(0);
    const b60 = scheduler.getBreaks().find((b) => b.id === 'mid-60');
    expect(b60?.hasPlayed).toBe(true);
  });

  it('prevents concurrent break triggers while an ad is active', () => {
    const requestSpy = vi.fn();
    const scheduler = new AdScheduler({}, { onRequestAdBreak: requestSpy });
    scheduler.addManualBreak({ id: 'mid-60', position: 'midroll', timeOffset: 60 });
    scheduler.setContentDuration(600);

    // Ad is currently active
    scheduler.setAdActive(true);

    const res = scheduler.onContentProgress(60);
    expect(res).toBeNull();
    expect(requestSpy).not.toHaveBeenCalled();

    // After ad finishes
    scheduler.setAdActive(false);
    scheduler.onContentProgress(60);
    expect(requestSpy).toHaveBeenCalled();
  });
});
