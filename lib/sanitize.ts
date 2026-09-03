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
    // Fast path for data:image/ to avoid URL parsing issues with large base64
    if (noControlChars.toLowerCase().startsWith('data:image/')) {
      return noControlChars;
    }

    const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'http://localhost';
    const parsedUrl = new URL(noControlChars, baseUrl);

    const allowedProtocols = ['http:', 'https:', 'blob:', 'data:'];

    if (allowedProtocols.includes(parsedUrl.protocol)) {
      if (parsedUrl.protocol === 'data:' && !noControlChars.toLowerCase().startsWith('data:image/')) {
        return '#';
      }
      return noControlChars;
    }
    return '#';
  } catch (e) {
    return '#';
  }
}
