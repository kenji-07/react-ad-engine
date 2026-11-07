import type { TrackingContext, TrackingTransport } from '../types/tracking';

export interface DefaultTransportOptions {
  timeoutMs?: number;
  maxRetries?: number;
}

export class DefaultTrackingTransport implements TrackingTransport {
  private timeoutMs: number;
  private maxRetries: number;

  constructor(options: DefaultTransportOptions = {}) {
    this.timeoutMs = options.timeoutMs ?? 5000;
    this.maxRetries = options.maxRetries ?? 1;
  }

  public async send(url: string, _context?: TrackingContext): Promise<boolean> {
    if (!url) return false;

    // Use sendBeacon if available in browser environment
    if (typeof navigator !== 'undefined' && typeof navigator.sendBeacon === 'function') {
      try {
        const sent = navigator.sendBeacon(url);
        if (sent) return true;
      } catch {
        // Fall back to fetch
      }
    }

    let attempts = 0;
    while (attempts <= this.maxRetries) {
      attempts++;
      try {
        const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
        const timer = controller ? setTimeout(() => controller.abort(), this.timeoutMs) : null;

        if (typeof fetch !== 'undefined') {
          await fetch(url, {
            method: 'GET',
            mode: 'no-cors',
            credentials: 'omit',
            cache: 'no-store',
            signal: controller?.signal,
          });
        }

        if (timer) clearTimeout(timer);
        return true;
      } catch (err) {
        if (attempts > this.maxRetries) {
          // Swallow error to guarantee advertising playback is never blocked
          return false;
        }
      }
    }

    return false;
  }
}
