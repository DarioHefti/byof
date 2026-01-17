/**
 * Auth Injection for Sandbox
 *
 * Injects authentication headers into generated HTML so that
 * fetch() calls can include auth tokens.
 */

import type { AuthHeaders } from '../types'

/** Global variable name for auth headers in iframe */
export const AUTH_GLOBAL_NAME = '__BYOF_AUTH__'

/**
 * Generate a script tag that sets auth headers as a global variable
 *
 * @param headers - Auth headers to inject
 * @returns Script tag HTML string
 */
export function generateAuthScript(headers: AuthHeaders): string {
  // Escape the JSON to prevent XSS
  // - < > & can break out of script context in HTML
  // - Unicode line/paragraph separators can break JavaScript parsing
  const safeJson = JSON.stringify(headers)
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')
    .replace(/&/g, '\\u0026')
    .replace(/\u2028/g, '\\u2028')
    .replace(/\u2029/g, '\\u2029')

  return `<script>window.${AUTH_GLOBAL_NAME}=${safeJson};</script>`
}

/**
 * Inject auth headers into HTML document
 *
 * Inserts a script tag after <head> that sets window.__BYOF_AUTH__
 *
 * @param html - Original HTML content
 * @param headers - Auth headers to inject
 * @returns HTML with auth script injected
 */
export function injectAuthIntoHtml(html: string, headers: AuthHeaders): string {
  // Don't inject if no headers
  if (Object.keys(headers).length === 0) {
    return html
  }

  const authScript = generateAuthScript(headers)

  // Try to inject after <head>
  const headMatch = html.match(/<head[^>]*>/i)
  if (headMatch) {
    const insertPos = headMatch.index! + headMatch[0].length
    return html.slice(0, insertPos) + '\n' + authScript + html.slice(insertPos)
  }

  // Try to inject after <html>
  const htmlMatch = html.match(/<html[^>]*>/i)
  if (htmlMatch) {
    const insertPos = htmlMatch.index! + htmlMatch[0].length
    return (
      html.slice(0, insertPos) +
      '\n<head>' +
      authScript +
      '</head>' +
      html.slice(insertPos)
    )
  }

  // Fallback: prepend to content
  return authScript + '\n' + html
}

/**
 * Check if HTML already has auth injection
 *
 * @param html - HTML content to check
 * @returns true if auth is already injected
 */
export function hasAuthInjection(html: string): boolean {
  return html.includes(`window.${AUTH_GLOBAL_NAME}`)
}
