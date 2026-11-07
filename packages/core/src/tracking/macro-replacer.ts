import type { TrackingContext } from '../types/tracking';

export class MacroReplacer {
  /**
   * Formats seconds into hh:mm:ss.mmm for [CONTENTPLAYHEAD]
   */
  public static formatPlayhead(seconds: number): string {
    if (isNaN(seconds) || seconds < 0) return '00:00:00.000';
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    const millis = Math.floor((seconds % 1) * 1000);

    const pad = (n: number, z = 2) => String(n).padStart(z, '0');
    return `${pad(hrs)}:${pad(mins)}:${pad(secs)}.${pad(millis, 3)}`;
  }

  /**
   * Replaces VAST/VMAP standard and custom macros in a URL
   */
  public static replaceMacros(url: string, context: TrackingContext = {}): string {
    if (!url) return '';

    const timestamp = context.timestamp ?? Date.now();
    const cachebusting = Math.floor(10000000 + Math.random() * 90000000); // 8-digit random
    const errorCode = context.errorCode !== undefined ? String(context.errorCode) : '900';

    let contentPlayhead = '00:00:00.000';
    if (typeof context.contentPlayhead === 'number') {
      contentPlayhead = this.formatPlayhead(context.contentPlayhead);
    } else if (typeof context.contentPlayhead === 'string') {
      contentPlayhead = context.contentPlayhead;
    }

    const assetUri = context.assetUri ? encodeURIComponent(context.assetUri) : '';

    let replaced = url
      .replace(/\[TIMESTAMP\]/gi, String(timestamp))
      .replace(/%%TIMESTAMP%%/gi, String(timestamp))
      .replace(/\[CACHEBUSTING\]/gi, String(cachebusting))
      .replace(/%%CACHEBUSTING%%/gi, String(cachebusting))
      .replace(/\[ERRORCODE\]/gi, errorCode)
      .replace(/%%ERRORCODE%%/gi, errorCode)
      .replace(/\[CONTENTPLAYHEAD\]/gi, encodeURIComponent(contentPlayhead))
      .replace(/%%CONTENTPLAYHEAD%%/gi, encodeURIComponent(contentPlayhead))
      .replace(/\[ASSETURI\]/gi, assetUri)
      .replace(/%%ASSETURI%%/gi, assetUri);

    // Replace custom macros
    if (context.customMacros) {
      for (const [key, value] of Object.entries(context.customMacros)) {
        const regex = new RegExp(`\\[${key}\\]`, 'gi');
        replaced = replaced.replace(regex, encodeURIComponent(String(value)));
      }
    }

    return replaced;
  }
}
