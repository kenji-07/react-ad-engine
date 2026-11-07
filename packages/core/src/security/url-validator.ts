/**
 * URL and Protocol Security Validator
 */

const ALLOWED_PROTOCOLS = new Set(['http:', 'https:', 'mailto:', 'tel:']);

export class UrlValidator {
  /**
   * Validates whether a URL has a safe protocol.
   * Disallows 'javascript:', 'data:', 'vbscript:', etc.
   */
  public static isSafeUrl(url: string | undefined): boolean {
    if (!url || typeof url !== 'string') return false;
    const trimmed = url.trim();
    if (!trimmed) return false;

    // Reject dangerous schemes immediately
    const lower = trimmed.toLowerCase();
    if (
      lower.startsWith('javascript:') ||
      lower.startsWith('vbscript:') ||
      lower.startsWith('file:')
    ) {
      return false;
    }

    try {
      const parsed = new URL(trimmed);
      return ALLOWED_PROTOCOLS.has(parsed.protocol);
    } catch {
      // Relative URL or invalid absolute URL
      // If it doesn't contain a colon before slash, it could be a relative URL e.g. "/promo"
      if (!trimmed.includes(':') && (trimmed.startsWith('/') || trimmed.startsWith('.'))) {
        return true;
      }
      return false;
    }
  }

  /**
   * Sanitizes click URL, returning a safe URL or empty string
   */
  public static sanitizeUrl(url: string | undefined): string {
    if (!url) return '';
    return this.isSafeUrl(url) ? url.trim() : '';
  }
}
