/**
 * Sandbox Runner for executing generated HTML safely
 *
 * This module provides utilities to:
 * - Load HTML into a sandboxed iframe with proper security attributes
 * - Inject CSP policies to restrict network access
 * - Open HTML in a new tab safely
 * - Extract and validate HTML content
 */

import {
  type ByofLogger,
  ByofErrorCode,
  ByofException,
  defaultLogger,
} from '../types'

import { type CspOptions, injectCspIntoHtml } from './csp'

// ============================================================================
// Types
// ============================================================================

export interface SandboxOptions {
  /** Allowed origins for API calls from generated HTML */
  allowedOrigins: string[]
  /** Logger for observability */
  logger?: ByofLogger
}

export interface SandboxResult {
  /** The processed HTML with CSP injected */
  html: string
  /** Whether CSP was injected */
  cspInjected: boolean
}

export interface IframeSandboxConfig {
  /** The iframe element to load HTML into */
  iframe: HTMLIFrameElement
  /** The HTML content to load */
  html: string
  /** Sandbox options */
  options: SandboxOptions
}

// ============================================================================
// Constants
// ============================================================================

/**
 * Default iframe sandbox attributes for security
 * - allow-scripts: Required for JS execution
 * - allow-forms: Allow form submissions
 * - allow-same-origin: Required for some APIs but sandboxed via CSP
 * - allow-popups: Allow window.open (controlled by CSP)
 */
const DEFAULT_SANDBOX_ATTRS = [
  'allow-scripts',
  'allow-forms',
  'allow-same-origin',
  'allow-popups',
] as const

// ============================================================================
// Main Functions
// ============================================================================

/**
 * Prepare HTML for sandbox execution by injecting CSP
 *
 * @param html - Raw HTML content
 * @param options - Sandbox configuration
 * @returns Processed HTML with security policies applied
 * @throws ByofException with SANDBOX_ERROR if HTML is invalid
 */
export function prepareSandboxHtml(
  html: string,
  options: SandboxOptions
): SandboxResult {
  const { allowedOrigins, logger = defaultLogger } = options

  logger.debug('Preparing HTML for sandbox', {
    htmlLength: html.length,
    allowedOrigins,
  })

  // Validate HTML is non-empty
  if (!html.trim()) {
    throw new ByofException(
      ByofErrorCode.SANDBOX_ERROR,
      'Cannot sandbox empty HTML content'
    )
  }

  // Build CSP options
  const cspOptions: CspOptions = {
    allowedOrigins,
    allowInlineScripts: true,
    allowInlineStyles: true,
    allowEval: false,
    allowBlobs: true,
    allowDataUrls: true,
  }

  // Inject CSP into HTML
  const processedHtml = injectCspIntoHtml(html, cspOptions)

  logger.info('HTML prepared for sandbox', {
    originalLength: html.length,
    processedLength: processedHtml.length,
  })

  return {
    html: processedHtml,
    cspInjected: true,
  }
}

/**
 * Load HTML into an iframe with proper sandbox attributes
 *
 * @param config - Configuration for iframe loading
 * @throws ByofException with SANDBOX_ERROR if loading fails
 */
export function loadIntoIframe(config: IframeSandboxConfig): void {
  const { iframe, html, options } = config
  const { logger = defaultLogger } = options

  logger.debug('Loading HTML into iframe', { htmlLength: html.length })

  // Ensure iframe has proper sandbox attributes
  configureSandboxAttributes(iframe)

  // Prepare HTML with CSP
  const { html: processedHtml } = prepareSandboxHtml(html, options)

  // Load via srcdoc for isolation
  iframe.srcdoc = processedHtml

  logger.info('HTML loaded into sandbox iframe')
}

/**
 * Configure sandbox attributes on an iframe
 *
 * @param iframe - The iframe element to configure
 */
export function configureSandboxAttributes(iframe: HTMLIFrameElement): void {
  // Clear existing sandbox values and set new ones
  iframe.sandbox.value = ''
  for (const attr of DEFAULT_SANDBOX_ATTRS) {
    iframe.sandbox.add(attr)
  }
}

/**
 * Open HTML content in a new browser tab
 *
 * Creates a blob URL and opens it in a new tab. The blob URL
 * is revoked after a short delay to clean up resources.
 *
 * @param html - HTML content to open
 * @param options - Sandbox options (for CSP injection)
 * @returns The window object of the new tab, or null if blocked
 * @throws ByofException with SANDBOX_ERROR if opening fails
 */
export function openInNewTab(
  html: string,
  options: SandboxOptions
): Window | null {
  const { logger = defaultLogger } = options

  logger.debug('Opening HTML in new tab', { htmlLength: html.length })

  // Prepare HTML with CSP
  const { html: processedHtml } = prepareSandboxHtml(html, options)

  // Create blob URL
  const blob = new Blob([processedHtml], { type: 'text/html' })
  const blobUrl = URL.createObjectURL(blob)

  // Open in new tab
  const newWindow = window.open(blobUrl, '_blank')

  // Revoke blob URL after a delay (allows time for the page to load)
  setTimeout(() => {
    URL.revokeObjectURL(blobUrl)
    logger.debug('Blob URL revoked')
  }, 1000)

  if (newWindow) {
    logger.info('HTML opened in new tab')
  } else {
    logger.warn('New tab was blocked by popup blocker')
  }

  return newWindow
}

/**
 * Create a downloadable HTML file
 *
 * @param html - HTML content to download
 * @param filename - Filename for the download (default: "generated-ui.html")
 * @param options - Sandbox options (for CSP injection)
 */
export function downloadHtml(
  html: string,
  filename: string = 'generated-ui.html',
  options: SandboxOptions
): void {
  const { logger = defaultLogger } = options

  logger.debug('Creating HTML download', { filename, htmlLength: html.length })

  // Prepare HTML with CSP
  const { html: processedHtml } = prepareSandboxHtml(html, options)

  // Create blob and download link
  const blob = new Blob([processedHtml], { type: 'text/html' })
  const blobUrl = URL.createObjectURL(blob)

  const link = document.createElement('a')
  link.href = blobUrl
  link.download = filename
  link.style.display = 'none'

  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)

  // Revoke blob URL
  URL.revokeObjectURL(blobUrl)

  logger.info('HTML download initiated', { filename })
}

/**
 * Extract the raw HTML from a sandboxed iframe
 *
 * @param iframe - The iframe to extract HTML from
 * @returns The HTML content, or null if inaccessible
 */
export function extractHtmlFromIframe(
  iframe: HTMLIFrameElement
): string | null {
  try {
    const doc = iframe.contentDocument
    if (!doc) {
      return null
    }

    // Get the full HTML including doctype
    const doctype = doc.doctype
    let html = ''

    if (doctype) {
      html = `<!DOCTYPE ${doctype.name}${doctype.publicId ? ` PUBLIC "${doctype.publicId}"` : ''}${doctype.systemId ? ` "${doctype.systemId}"` : ''}>\n`
    }

    html += doc.documentElement.outerHTML

    return html
  } catch {
    // Cross-origin access denied
    return null
  }
}

/**
 * Clear the content of a sandboxed iframe
 *
 * @param iframe - The iframe to clear
 */
export function clearIframe(iframe: HTMLIFrameElement): void {
  iframe.srcdoc = ''
}

/**
 * Check if an iframe is empty (no content loaded)
 *
 * @param iframe - The iframe to check
 * @returns true if the iframe has no meaningful content
 */
export function isIframeEmpty(iframe: HTMLIFrameElement): boolean {
  // Check srcdoc first
  if (iframe.srcdoc && iframe.srcdoc.trim()) {
    return false
  }

  // Check src
  if (iframe.src && iframe.src !== 'about:blank') {
    return false
  }

  return true
}

// ============================================================================
// Validation Functions
// ============================================================================

/**
 * Validate HTML structure for basic sanity
 *
 * @param html - HTML content to validate
 * @returns Object with validation result and any warnings
 */
export function validateHtml(html: string): {
  valid: boolean
  warnings: string[]
} {
  const warnings: string[] = []

  // Check for empty content
  if (!html.trim()) {
    return { valid: false, warnings: ['HTML content is empty'] }
  }

  // Check for script tags (informational)
  if (/<script/i.test(html)) {
    warnings.push('HTML contains script tags (will be executed in sandbox)')
  }

  // Check for external resources without protocol
  if (/(?:src|href)=["']\/\//i.test(html)) {
    warnings.push('HTML contains protocol-relative URLs')
  }

  // Check for potentially dangerous patterns
  if (/javascript:/i.test(html)) {
    warnings.push('HTML contains javascript: URLs')
  }

  // Check for document.cookie access patterns
  if (/document\.cookie/i.test(html)) {
    warnings.push('HTML contains document.cookie access')
  }

  // Check for localStorage/sessionStorage
  if (/(?:localStorage|sessionStorage)/i.test(html)) {
    warnings.push('HTML contains Web Storage API access')
  }

  return { valid: true, warnings }
}

/**
 * Sanitize HTML by removing potentially dangerous elements
 *
 * Note: This is a basic sanitizer. For production use with untrusted
 * content, consider using a library like DOMPurify.
 *
 * @param html - HTML content to sanitize
 * @returns Sanitized HTML
 */
export function basicSanitize(html: string): string {
  // Remove <meta http-equiv="refresh"> (prevents redirect attacks)
  let sanitized = html.replace(
    /<meta[^>]*http-equiv\s*=\s*["']?refresh["']?[^>]*>/gi,
    '<!-- meta refresh removed -->'
  )

  // Remove <base> tags (prevents base URL hijacking)
  sanitized = sanitized.replace(/<base[^>]*>/gi, '<!-- base tag removed -->')

  return sanitized
}
