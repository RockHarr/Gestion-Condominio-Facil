/**
 * Sanitizes URLs to prevent XSS vulnerabilities.
 * Ensures only safe protocols are allowed and strips control characters.
 */
export function getSafeUrl(url: string | undefined | null): string | undefined {
  if (!url) return undefined;

  // Strip control characters
  // eslint-disable-next-line no-control-regex
  const urlWithoutControlChars = url.replace(/[\u0000-\u001F\u007F-\u009F]/g, '').trim();

  // Check if it's a relative URL or fragment
  if (urlWithoutControlChars.startsWith('/') || urlWithoutControlChars.startsWith('#') || urlWithoutControlChars.startsWith('?')) {
    return urlWithoutControlChars;
  }

  try {
    const parsedUrl = new URL(urlWithoutControlChars, typeof window !== 'undefined' ? window.location.origin : 'http://localhost');
    const protocol = parsedUrl.protocol.toLowerCase();

    // Only allow safe protocols
    if (['http:', 'https:', 'mailto:', 'tel:', 'blob:'].includes(protocol)) {
      return parsedUrl.href;
    }

    // Fallback for unsafe protocols (e.g., javascript:, data:)
    return '#';
  } catch (e) {
    // If URL parsing fails, default to a safe value
    return '#';
  }
}
