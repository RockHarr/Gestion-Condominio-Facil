/**
 * Safely parses a URL string to ensure it uses allowed protocols,
 * preventing 'javascript:' and other protocol-based XSS payloads.
 *
 * @param url The user-provided URL string
 * @returns The original URL if safe, or '#' if unsafe.
 */
export function getSafeUrl(url: string | undefined | null): string {
  if (!url) return '#';

  // Remove control characters and whitespace from the beginning of the URL
  // that might be used to bypass simple string matching
  const cleanedUrl = url.replace(/^[\s\x00-\x1F]+/, '');

  try {
    // Attempt to parse as an absolute URL first
    const parsed = new URL(cleanedUrl);
    if (['http:', 'https:', 'mailto:', 'tel:', 'blob:'].includes(parsed.protocol)) {
      return cleanedUrl;
    }
    // If it's another protocol (e.g. javascript: data: file: vbscript:), reject
    return '#';
  } catch (e) {
    // If URL parsing fails, it might be a relative path.
    // Ensure it doesn't start with dangerous patterns
    if (/^(javascript|vbscript|data|file):/i.test(cleanedUrl)) {
      return '#';
    }
    // Assume it's a safe relative path
    return cleanedUrl;
  }
}
