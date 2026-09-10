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

export function getSafeImageUrl(url?: string): string | undefined {
  if (!url) return undefined;
  // eslint-disable-next-line no-control-regex
  const noControlChars = url.replace(/[\u0000-\u001F\u007F]/g, '');

  try {
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'http://localhost';
    const parsedUrl = new URL(noControlChars, baseUrl);

    // Allow standard web protocols for external images
    if (['http:', 'https:'].includes(parsedUrl.protocol)) {
      return noControlChars;
    }

    // Allow data URIs only if they strictly declare an image MIME type
    // to prevent XSS payloads (e.g., data:text/html) embedded in <img> tags
    if (parsedUrl.protocol === 'data:' && parsedUrl.pathname.startsWith('image/')) {
      return noControlChars;
    }

    return undefined;
  } catch (e) {
    return undefined;
  }
}
