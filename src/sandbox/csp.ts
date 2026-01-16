/**
 * Content Security Policy (CSP) generation for sandboxed HTML
 *
 * This module provides utilities to generate CSP headers/meta tags
 * that restrict the capabilities of generated HTML to prevent
 * XSS and other security issues.
 */

export interface CspOptions {
  /** Allowed origins for fetch/XHR requests (connect-src) */
  allowedOrigins: string[]
  /** Allow inline scripts (required for generated HTML) */
  allowInlineScripts?: boolean
  /** Allow inline styles (required for generated HTML) */
  allowInlineStyles?: boolean
  /** Allow eval() - generally should be false */
  allowEval?: boolean
  /** Allow blob: URLs for images/media */
  allowBlobs?: boolean
  /** Allow data: URLs for images */
  allowDataUrls?: boolean
}

/**
 * CSP directive values
 */
interface CspDirectives {
  'default-src': string[]
  'script-src': string[]
  'style-src': string[]
  'img-src': string[]
  'font-src': string[]
  'connect-src': string[]
  'media-src': string[]
  'object-src': string[]
  'frame-src': string[]
  'base-uri': string[]
  'form-action': string[]
}

/**
 * Generate a Content Security Policy string
 *
 * @param options - CSP configuration options
 * @returns CSP policy string suitable for meta tag or header
 */
export function generateCsp(options: CspOptions): string {
  const {
    allowedOrigins,
    allowInlineScripts = true,
    allowInlineStyles = true,
    allowEval = false,
    allowBlobs = true,
    allowDataUrls = true,
  } = options

  const directives: CspDirectives = {
    // Default: only allow self
    'default-src': ["'self'"],

    // Scripts: self + inline (unsafe-inline) for generated HTML
    'script-src': ["'self'"],

    // Styles: self + inline for generated HTML
    'style-src': ["'self'"],

    // Images: self + allowed origins + optional blob/data
    'img-src': ["'self'", ...allowedOrigins],

    // Fonts: self + allowed origins
    'font-src': ["'self'", ...allowedOrigins],

    // Connect (fetch/XHR): only allowed origins
    'connect-src': [...allowedOrigins],

    // Media: self + allowed origins
    'media-src': ["'self'", ...allowedOrigins],

    // No plugins (Flash, etc.)
    'object-src': ["'none'"],

    // No iframes within generated content
    'frame-src': ["'none'"],

    // Restrict base URI to prevent base tag hijacking
    'base-uri': ["'self'"],

    // Restrict form submissions to allowed origins
    'form-action': ["'self'", ...allowedOrigins],
  }

  // Add inline script support
  if (allowInlineScripts) {
    directives['script-src'].push("'unsafe-inline'")
  }

  // Add eval support (generally not recommended)
  if (allowEval) {
    directives['script-src'].push("'unsafe-eval'")
  }

  // Add inline style support
  if (allowInlineStyles) {
    directives['style-src'].push("'unsafe-inline'")
  }

  // Add blob support
  if (allowBlobs) {
    directives['img-src'].push('blob:')
    directives['media-src'].push('blob:')
  }

  // Add data URL support
  if (allowDataUrls) {
    directives['img-src'].push('data:')
  }

  // Build CSP string
  const parts: string[] = []
  const directiveEntries = Object.entries(directives) as Array<
    [keyof CspDirectives, string[]]
  >
  for (const [directive, values] of directiveEntries) {
    if (values.length > 0) {
      parts.push(`${directive} ${values.join(' ')}`)
    }
  }

  return parts.join('; ')
}

/**
 * Generate a CSP meta tag for insertion into HTML
 *
 * @param options - CSP configuration options
 * @returns HTML meta tag string
 */
export function generateCspMetaTag(options: CspOptions): string {
  const csp = generateCsp(options)
  return `<meta http-equiv="Content-Security-Policy" content="${escapeHtmlAttribute(csp)}">`
}

/**
 * Inject CSP meta tag into HTML document
 *
 * Inserts the CSP meta tag as the first element in <head>.
 * If no <head> exists, creates one after <html> or at the start.
 *
 * @param html - The HTML document string
 * @param options - CSP configuration options
 * @returns Modified HTML with CSP meta tag injected
 */
export function injectCspIntoHtml(html: string, options: CspOptions): string {
  const cspMetaTag = generateCspMetaTag(options)

  // Try to inject after <head>
  const headMatch = /<head[^>]*>/i.exec(html)
  if (headMatch) {
    const insertPos = headMatch.index + headMatch[0].length
    return html.slice(0, insertPos) + '\n' + cspMetaTag + html.slice(insertPos)
  }

  // Try to inject after <html>
  const htmlMatch = /<html[^>]*>/i.exec(html)
  if (htmlMatch) {
    const insertPos = htmlMatch.index + htmlMatch[0].length
    return (
      html.slice(0, insertPos) +
      '\n<head>\n' +
      cspMetaTag +
      '\n</head>' +
      html.slice(insertPos)
    )
  }

  // No <html> or <head>, prepend CSP and wrap in basic structure
  return `<!DOCTYPE html>
<html>
<head>
${cspMetaTag}
</head>
<body>
${html}
</body>
</html>`
}

/**
 * Validate that a URL is allowed by the CSP
 *
 * @param url - The URL to check
 * @param allowedOrigins - List of allowed origins
 * @returns true if the URL's origin is in the allowlist
 */
export function isOriginAllowed(
  url: string,
  allowedOrigins: string[]
): boolean {
  try {
    const parsed = new URL(url)
    const origin = parsed.origin

    return allowedOrigins.some((allowed) => {
      // Exact match
      if (allowed === origin) {
        return true
      }

      // Wildcard subdomain match (e.g., "*.example.com")
      if (allowed.startsWith('*.')) {
        const domain = allowed.slice(2)
        const hostWithProtocol = `${parsed.protocol}//${parsed.host}`
        // Check if host ends with the domain
        return (
          parsed.host === domain ||
          parsed.host.endsWith(`.${domain}`) ||
          hostWithProtocol === `${parsed.protocol}//${domain}`
        )
      }

      return false
    })
  } catch {
    // Invalid URL
    return false
  }
}

/**
 * Escape a string for use in an HTML attribute
 */
function escapeHtmlAttribute(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}
