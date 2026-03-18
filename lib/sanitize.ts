export function getSafeUrl(url: string | undefined): string | undefined {
  if (!url) return undefined;

  try {
    const parsedUrl = new URL(url);
    // Allow only http and https protocols
    if (parsedUrl.protocol === 'http:' || parsedUrl.protocol === 'https:') {
      return url;
    }
    // Block other protocols like javascript:
    return '#';
  } catch (e) {
    // If it's a relative URL or invalid URL, fallback
    // We assume relative paths (starting with / or #) are safe
    if (url.startsWith('/') || url.startsWith('#')) {
      return url;
    }
    return '#';
  }
}
