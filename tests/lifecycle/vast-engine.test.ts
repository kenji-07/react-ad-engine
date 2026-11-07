import { describe, it, expect, vi } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import { VastEngine } from '../../packages/core/src/engine/vast-engine';
import { BasePlayerAdapter } from '../../packages/core/src/adapters/player-adapter';
import { UrlValidator } from '../../packages/core/src/security/url-validator';
import { HtmlSanitizer } from '../../packages/core/src/security/sanitizer';

const fixturesDir = path.resolve(process.cwd(), 'tests/fixtures');

class MockPlayerAdapter extends BasePlayerAdapter {
  public paused = false;
  public currentTime = 0;
  public duration = 120;

  public pauseContent = vi.fn(() => {
    this.paused = true;
  });

  public resumeContent = vi.fn(() => {
    this.paused = false;
  });

  public seekTo = vi.fn((time: number) => {
    this.currentTime = time;
  });

  public getCurrentTime = () => this.currentTime;
  public getDuration = () => this.duration;
  public isPaused = () => this.paused;

  public triggerEvent(type: any, data?: any) {
    this.emit({ type, ...data });
  }
}

describe('VastEngine & PlayerAdapter Integration', () => {
  it('manages complete Linear Ad lifecycle with player pause and resume', async () => {
    const linearXml = fs.readFileSync(path.join(fixturesDir, 'linear-video.vast.xml'), 'utf-8');

    const player = new MockPlayerAdapter();
    const onAdStart = vi.fn();
    const onAdComplete = vi.fn();

    const engine = new VastEngine({
      callbacks: {
        onAdStart,
        onAdComplete,
      },
    });

    engine.attachPlayerAdapter(player);

    // Load VAST
    await engine.loadVast(linearXml);

    // Pre-roll should trigger: player paused, ad playing
    expect(player.pauseContent).toHaveBeenCalled();
    const state = engine.getState();
    expect(state.isAdActive).toBe(true);
    expect(state.state).toBe('adPlaying');
    expect(state.currentCreative?.linear?.duration).toBe(30);
    expect(state.isSkippable).toBe(true);
    expect(state.canSkip).toBe(false); // 5s skipoffset, at 0s can't skip
    expect(state.skipCountdown).toBe(5);

    // Progress to 3s (still can't skip)
    engine.onAdMediaProgress(3, 30);
    expect(engine.getState().canSkip).toBe(false);
    expect(engine.getState().skipCountdown).toBe(2);

    // Progress to 5s (can skip now!)
    engine.onAdMediaProgress(5, 30);
    expect(engine.getState().canSkip).toBe(true);
    expect(engine.getState().skipCountdown).toBe(0);

    // Skip ad
    engine.skipAd();
    expect(engine.getState().isAdActive).toBe(false);
    expect(player.resumeContent).toHaveBeenCalled();

    engine.destroy();
  });

  it('handles click-through and sanitizes dangerous URLs', async () => {
    const engine = new VastEngine();
    const linearXml = fs.readFileSync(path.join(fixturesDir, 'linear-video.vast.xml'), 'utf-8');
    await engine.loadVast(linearXml);

    const clickUrl = engine.clickAd();
    expect(clickUrl).toBe('https://advertiser.example.com/landing-page');

    // Security validation
    expect(UrlValidator.isSafeUrl('javascript:alert(1)')).toBe(false);
    expect(UrlValidator.isSafeUrl('https://valid.example.com')).toBe(true);
    expect(UrlValidator.isSafeUrl('http://valid.example.com')).toBe(true);
    expect(UrlValidator.isSafeUrl('vbscript:msgbox(1)')).toBe(false);

    // Sanitizer
    const dangerousHtml = '<div>Safe text<script>alert("hack")</script><a href="javascript:void(0)" onclick="evil()">link</a></div>';
    const cleanHtml = HtmlSanitizer.sanitize(dangerousHtml);
    expect(cleanHtml).not.toContain('<script>');
    expect(cleanHtml).not.toContain('alert');
    expect(cleanHtml).not.toContain('onclick');
    expect(cleanHtml).not.toContain('javascript:void(0)');
  });

  it('loadAdTag automatically detects VAST and VMAP from a single adTagUrl parameter', async () => {
    const engine = new VastEngine();
    const linearXml = fs.readFileSync(path.join(fixturesDir, 'linear-video.vast.xml'), 'utf-8');
    const vmapXml = fs.readFileSync(path.join(fixturesDir, 'vmap-standard.xml'), 'utf-8');

    // 1. Pass VAST XML into loadAdTag
    const vastDoc = await engine.loadAdTag(linearXml);
    expect(vastDoc).toBeDefined();
    expect(engine.getState().state).toBe('adPlaying');
    expect(engine.getState().currentCreative?.linear?.duration).toBe(30);

    // 2. Pass VMAP XML into loadAdTag
    const engineVmap = new VastEngine();
    const vmapDoc = await engineVmap.loadAdTag(vmapXml);
    expect(vmapDoc).toBeDefined();
    // VMAP has a preroll, so it transitions to adLoading immediately
    expect(engineVmap.getState().isAdActive).toBe(true);
    expect(engineVmap.getState().state).toBe('adLoading');

    engine.destroy();
    engineVmap.destroy();
  });
});
