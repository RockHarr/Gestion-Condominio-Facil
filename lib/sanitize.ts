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

  // Allow safe data URIs for images (common for local uploads/previews before syncing)
  if (url.startsWith('data:')) {
    try {
      const parsed = new URL(url);
      if (parsed.pathname.startsWith('image/')) {
        return url;
      }
      return '#';
    } catch {
      return '#';
    }
  }

  return getSafeUrl(url);
}
