export function getSafeUrl(url?: string | null): string | undefined {
  if (!url) return undefined;

  // Strip control characters
  // eslint-disable-next-line no-control-regex
  const sanitized = url.replace(/[\u0000-\u001F\u007F-\u009F]/g, '').trim();

  // Allow relative paths, hash, query strings
  if (sanitized.startsWith('/') || sanitized.startsWith('#') || sanitized.startsWith('?')) {
    return sanitized;
  }

  try {
    const parsed = new URL(sanitized);
    const allowedProtocols = ['http:', 'https:', 'mailto:', 'tel:', 'blob:'];
    if (allowedProtocols.includes(parsed.protocol)) {
      return sanitized;
    }
  } catch (err) {
    // If it's not a valid URL and doesn't start with allowed prefixes, reject it.
  }

  return undefined;
}
