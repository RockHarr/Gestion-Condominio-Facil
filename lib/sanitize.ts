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

    const allowedProtocols = ['http:', 'https:', 'blob:', 'data:'];

    if (allowedProtocols.includes(parsedUrl.protocol)) {
      if (parsedUrl.protocol === 'data:') {
         if (!parsedUrl.pathname.startsWith('image/')) {
            return undefined;
         }
      }
      return noControlChars;
    }
    return undefined;
  } catch (e) {
    return undefined;
  }
}
