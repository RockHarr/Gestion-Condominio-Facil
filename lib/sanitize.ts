export function getSafeUrl(url: string | null | undefined): string | undefined {
  if (!url) return undefined;

  // eslint-disable-next-line no-control-regex
  const sanitizedUrl = url.replace(/[\u0000-\u001F\u007F-\u009F]/g, '');

  try {
    const origin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost';
    const parsedUrl = new URL(sanitizedUrl, origin);
    const protocol = parsedUrl.protocol;

    if (['http:', 'https:', 'mailto:', 'tel:', 'blob:'].includes(protocol)) {
      return parsedUrl.href;
    }
  } catch (e) {
    // If it's a relative URL, it will be handled relative to window.location.origin
    // and caught by the valid protocols above.
    // If parsing fails completely, fall back to undefined.
  }

  return undefined;
}
