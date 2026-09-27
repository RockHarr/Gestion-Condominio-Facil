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

  // Allow empty strings or valid sanitized data URIs
  if (url.startsWith('data:image/')) {
    return url;
  }

  const safeUrl = getSafeUrl(url);
  return safeUrl === '#' ? undefined : safeUrl;
}
