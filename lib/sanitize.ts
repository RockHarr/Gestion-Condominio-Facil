export function getSafeUrl(url: string | undefined): string | undefined {
  if (!url) return undefined;

  try {
    // Strip control characters
    // eslint-disable-next-line no-control-regex
    const cleanUrl = url.replace(/[\u0000-\u001F\u007F-\u009F]/g, '');

    // Allow relative paths starting with /
    if (cleanUrl.startsWith('/')) {
      return cleanUrl;
    }

    // Allow relative paths starting with #
    if (cleanUrl.startsWith('#')) {
      return cleanUrl;
    }

    // Allow relative paths without leading slash/hash by checking if it contains :
    if (!cleanUrl.includes(':')) {
       return cleanUrl;
    }


    // Provide fallback base URL for non-browser environments
    const base = typeof window !== 'undefined' ? window.location.origin : 'http://localhost';
    const parsedUrl = new URL(cleanUrl, base);

    // Allow-list of safe protocols
    const safeProtocols = ['http:', 'https:', 'mailto:', 'tel:', 'blob:'];

    if (safeProtocols.includes(parsedUrl.protocol)) {
      // Return original URL to preserve format instead of parsedUrl.toString()
      // This helps with things like mailto: and tel: links
      return cleanUrl;
    }

    // Fallback for unsafe protocols (e.g., javascript:, data: for non-images)
    return '#';
  } catch (e) {
    // Return safe fallback if URL parsing fails
    return '#';
  }
}
