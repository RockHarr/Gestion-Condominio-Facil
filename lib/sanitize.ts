export function getSafeImageUrl(url?: string): string | undefined {
  if (!url) return undefined;

  // Explicitly allow data URIs that represent images
  if (url.startsWith('data:image/')) {
    // Basic structural validation for data URIs
    const base64Index = url.indexOf(';base64,');
    if (base64Index > -1 && base64Index < 50) { // arbitrary reasonable limit for mime type
       // Additional regex to ensure it only has safe characters in the payload
       const payload = url.substring(base64Index + 8);
       if (/^[a-zA-Z0-9+/=]+$/.test(payload)) {
           return url;
       }
    }
  }

  return getSafeUrl(url);
}

export function getSafeUrl(url?: string): string | undefined {
  if (!url) return undefined;
  // eslint-disable-next-line no-control-regex
  const noControlChars = url.replace(/[\u0000-\u001F\u007F]/g, '');

  try {
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'http://localhost';
    const parsedUrl = new URL(noControlChars, baseUrl);

    const allowedProtocols = ['http:', 'https:', 'mailto:', 'tel:', 'blob:'];

    if (allowedProtocols.includes(parsedUrl.protocol)) {
      return noControlChars;
    }
    return '#';
  } catch (e) {
    return '#';
  }
}
