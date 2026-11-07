import { UrlValidator } from './url-validator';

/**
 * Lightweight pure-TS HTML sanitizer
 * Removes dangerous tags (<script>, <iframe>, <object>, <embed>, <form>, <base>)
 * and inline event handlers (onload, onerror, onclick, etc.), and validates href/src protocols.
 */
export class HtmlSanitizer {
  private static DANGEROUS_TAGS = [
    'script',
    'iframe',
    'object',
    'embed',
    'form',
    'input',
    'button',
    'textarea',
    'select',
    'base',
    'link',
    'meta',
  ];

  public static sanitize(html: string): string {
    if (!html || typeof html !== 'string') return '';

    let clean = html;

    // Remove dangerous tags and their contents
    for (const tag of this.DANGEROUS_TAGS) {
      const reg = new RegExp(`<${tag}[^>]*>[\\s\\S]*?<\\/${tag}>`, 'gi');
      clean = clean.replace(reg, '');
      const selfClosing = new RegExp(`<${tag}[^>]*\\/?>`, 'gi');
      clean = clean.replace(selfClosing, '');
    }

    // Remove inline event handlers: e.g. onxxx="..." or onxxx='...' or onxxx=javascript:...
    clean = clean.replace(/\s+on[a-zA-Z]+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, '');

    // Replace dangerous href="javascript:..." or src="javascript:..."
    clean = clean.replace(/\s+(href|src)\s*=\s*(["'])(.*?)\2/gi, (_match, attr, quote, url) => {
      if (UrlValidator.isSafeUrl(url)) {
        return ` ${attr}=${quote}${url}${quote}`;
      }
      return ` ${attr}=${quote}#${quote}`;
    });

    return clean;
  }
}
