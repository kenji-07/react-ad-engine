/**
 * XML and Time Parsing Utilities
 */

/**
 * Normalizes an XML node into an array of nodes
 */
export function ensureArray<T = any>(val: any): T[] {
  if (val === undefined || val === null) {
    return [];
  }
  if (Array.isArray(val)) {
    return val;
  }
  return [val];
}

/**
 * Extracts string value from a node that may contain CDATA, direct text, or nested text
 */
export function extractText(val: any): string {
  if (val === undefined || val === null) {
    return '';
  }
  if (typeof val === 'string') {
    return val.trim();
  }
  if (typeof val === 'number' || typeof val === 'boolean') {
    return String(val);
  }
  if (val.__cdata !== undefined) {
    return String(val.__cdata).trim();
  }
  if (val['#text'] !== undefined) {
    return String(val['#text']).trim();
  }
  return '';
}

/**
 * Converts a timecode string ("00:00:30", "00:00:15.500", "01:20:05") into seconds.
 * Returns 0 if invalid.
 */
export function parseTimecodeToSeconds(timecode: string): number {
  if (!timecode || typeof timecode !== 'string') return 0;
  const trimmed = timecode.trim();

  // Check if it's already a numeric seconds string: e.g. "30" or "15.5"
  if (/^\d+(\.\d+)?$/.test(trimmed)) {
    return parseFloat(trimmed);
  }

  // Matches hh:mm:ss or hh:mm:ss.mmm
  const parts = trimmed.split(':');
  if (parts.length === 3) {
    const hours = parseFloat(parts[0]) || 0;
    const minutes = parseFloat(parts[1]) || 0;
    const seconds = parseFloat(parts[2]) || 0;
    return hours * 3600 + minutes * 60 + seconds;
  }
  if (parts.length === 2) {
    const minutes = parseFloat(parts[0]) || 0;
    const seconds = parseFloat(parts[1]) || 0;
    return minutes * 60 + seconds;
  }

  return 0;
}

/**
 * Parses skipoffset string which can be a timecode "00:00:05", percentage "10%", or seconds "5".
 * Returns seconds if timecode or number; for percentage, it returns undefined or calculates if duration is known.
 */
export function parseOffset(
  offsetStr: string | undefined,
  totalDuration?: number
): { seconds?: number; percentage?: number; raw?: string } {
  if (!offsetStr || typeof offsetStr !== 'string') {
    return {};
  }
  const raw = offsetStr.trim();
  if (raw.endsWith('%')) {
    const pct = parseFloat(raw.replace('%', ''));
    if (!isNaN(pct)) {
      const seconds = totalDuration !== undefined && totalDuration > 0 ? (totalDuration * pct) / 100 : undefined;
      return { seconds, percentage: pct, raw };
    }
  }

  const seconds = parseTimecodeToSeconds(raw);
  return { seconds, raw };
}

/**
 * Safely parse integer
 */
export function parseInteger(val: any, fallback?: number): number | undefined {
  if (val === undefined || val === null) return fallback;
  const n = parseInt(String(val), 10);
  return isNaN(n) ? fallback : n;
}

/**
 * Safely parse boolean
 */
export function parseBoolean(val: any, fallback = false): boolean {
  if (val === undefined || val === null) return fallback;
  const s = String(val).toLowerCase().trim();
  return s === 'true' || s === '1' || s === 'yes';
}
