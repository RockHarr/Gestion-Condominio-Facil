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

  // If it's a data URI, only allow image MIME types
  if (url.startsWith('data:')) {
    if (/^data:image\/(jpeg|jpg|png|gif|webp|svg\+xml);base64,/.test(url)) {
      return url;
    }
    return undefined;
  }

  return getSafeUrl(url);
}
