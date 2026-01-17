import { describe, it, expect } from 'vitest'

import {
  generateCsp,
  generateCspMetaTag,
  injectCspIntoHtml,
  isOriginAllowed,
} from './csp'

describe('generateCsp', () => {
  it('should generate CSP with allowed origins for connect-src', () => {
    const csp = generateCsp({
      allowedOrigins: ['https://api.example.com', 'https://cdn.example.com'],
    })

    // connect-src includes 'self' plus the allowed origins
    expect(csp).toContain(
      "connect-src 'self' https://api.example.com https://cdn.example.com"
    )
  })

  it('should include unsafe-inline for scripts by default', () => {
    const csp = generateCsp({
      allowedOrigins: ['https://api.example.com'],
    })

    expect(csp).toContain("script-src 'self' 'unsafe-inline'")
  })

  it('should include unsafe-inline for styles by default', () => {
    const csp = generateCsp({
      allowedOrigins: ['https://api.example.com'],
    })

    expect(csp).toContain("style-src 'self' 'unsafe-inline'")
  })

  it('should not include unsafe-eval by default', () => {
    const csp = generateCsp({
      allowedOrigins: ['https://api.example.com'],
    })

    expect(csp).not.toContain('unsafe-eval')
  })

  it('should include unsafe-eval when allowEval is true', () => {
    const csp = generateCsp({
      allowedOrigins: ['https://api.example.com'],
      allowEval: true,
    })

    expect(csp).toContain("'unsafe-eval'")
  })

  it('should include blob: and data: for images by default', () => {
    const csp = generateCsp({
      allowedOrigins: ['https://api.example.com'],
    })

    expect(csp).toContain('img-src')
    expect(csp).toContain('blob:')
    expect(csp).toContain('data:')
  })

  it('should set object-src to none', () => {
    const csp = generateCsp({
      allowedOrigins: [],
    })

    expect(csp).toContain("object-src 'none'")
  })

  it('should set frame-src to none', () => {
    const csp = generateCsp({
      allowedOrigins: [],
    })

    expect(csp).toContain("frame-src 'none'")
  })

  it('should include allowed origins in form-action', () => {
    const csp = generateCsp({
      allowedOrigins: ['https://api.example.com'],
    })

    expect(csp).toContain("form-action 'self' https://api.example.com")
  })
})

describe('generateCspMetaTag', () => {
  it('should generate valid meta tag', () => {
    const metaTag = generateCspMetaTag({
      allowedOrigins: ['https://api.example.com'],
    })

    expect(metaTag).toMatch(
      /^<meta http-equiv="Content-Security-Policy" content="[^"]+">$/
    )
  })

  it('should escape special characters in content attribute', () => {
    const metaTag = generateCspMetaTag({
      allowedOrigins: ['https://api.example.com'],
    })

    // Should not contain unescaped quotes inside the content attribute
    expect(metaTag).not.toMatch(/content="[^"]*"[^"]*"/)
  })
})

describe('injectCspIntoHtml', () => {
  it('should inject CSP after <head> tag', () => {
    const html = '<html><head><title>Test</title></head><body></body></html>'
    const result = injectCspIntoHtml(html, { allowedOrigins: [] })

    expect(result).toContain('<head>')
    expect(result).toContain('<meta http-equiv="Content-Security-Policy"')
    expect(result.indexOf('Content-Security-Policy')).toBeGreaterThan(
      result.indexOf('<head>')
    )
    expect(result.indexOf('Content-Security-Policy')).toBeLessThan(
      result.indexOf('<title>')
    )
  })

  it('should create <head> if only <html> exists', () => {
    const html = '<html><body>Content</body></html>'
    const result = injectCspIntoHtml(html, { allowedOrigins: [] })

    expect(result).toContain('<head>')
    expect(result).toContain('</head>')
    expect(result).toContain('<meta http-equiv="Content-Security-Policy"')
  })

  it('should wrap content in full HTML structure if no <html> tag', () => {
    const html = '<div>Just a div</div>'
    const result = injectCspIntoHtml(html, { allowedOrigins: [] })

    expect(result).toContain('<!DOCTYPE html>')
    expect(result).toContain('<html>')
    expect(result).toContain('<head>')
    expect(result).toContain('<body>')
    expect(result).toContain('<div>Just a div</div>')
  })

  it('should handle HTML with attributes on tags', () => {
    const html =
      '<html lang="en"><head class="dark"><title>Test</title></head></html>'
    const result = injectCspIntoHtml(html, { allowedOrigins: [] })

    expect(result).toContain('lang="en"')
    expect(result).toContain('class="dark"')
    expect(result).toContain('<meta http-equiv="Content-Security-Policy"')
  })
})

describe('isOriginAllowed', () => {
  it('should return true for exact origin match', () => {
    const allowed = ['https://api.example.com', 'https://cdn.example.com']

    expect(isOriginAllowed('https://api.example.com/endpoint', allowed)).toBe(
      true
    )
    expect(isOriginAllowed('https://cdn.example.com/file.js', allowed)).toBe(
      true
    )
  })

  it('should return false for non-matching origin', () => {
    const allowed = ['https://api.example.com']

    expect(isOriginAllowed('https://evil.com/endpoint', allowed)).toBe(false)
    expect(isOriginAllowed('https://other.example.com/endpoint', allowed)).toBe(
      false
    )
  })

  it('should handle wildcard subdomain patterns', () => {
    const allowed = ['*.example.com']

    expect(isOriginAllowed('https://api.example.com/endpoint', allowed)).toBe(
      true
    )
    expect(isOriginAllowed('https://cdn.example.com/file.js', allowed)).toBe(
      true
    )
    expect(
      isOriginAllowed('https://sub.api.example.com/endpoint', allowed)
    ).toBe(true)
  })

  it('should return false for invalid URLs', () => {
    const allowed = ['https://api.example.com']

    expect(isOriginAllowed('not-a-url', allowed)).toBe(false)
    expect(isOriginAllowed('', allowed)).toBe(false)
  })

  it('should return false for empty allowlist', () => {
    expect(isOriginAllowed('https://api.example.com/endpoint', [])).toBe(false)
  })

  it('should match different protocols separately', () => {
    const allowed = ['https://api.example.com']

    expect(isOriginAllowed('https://api.example.com/endpoint', allowed)).toBe(
      true
    )
    expect(isOriginAllowed('http://api.example.com/endpoint', allowed)).toBe(
      false
    )
  })
})
