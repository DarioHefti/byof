import { describe, it, expect } from 'vitest'

import {
  AUTH_GLOBAL_NAME,
  generateAuthScript,
  hasAuthInjection,
  injectAuthIntoHtml,
} from './auth'

describe('generateAuthScript', () => {
  it('should generate script with auth headers', () => {
    const headers = { Authorization: 'Bearer token123' }
    const script = generateAuthScript(headers)

    expect(script).toContain(`window.${AUTH_GLOBAL_NAME}`)
    expect(script).toContain('Authorization')
    expect(script).toContain('Bearer token123')
    expect(script).toMatch(/^<script>.*<\/script>$/)
  })

  it('should escape HTML special characters', () => {
    const headers = { 'X-Data': '<script>alert("xss")</script>' }
    const script = generateAuthScript(headers)

    // Should not contain raw < or >
    expect(script).not.toContain('><')
    expect(script).toContain('\\u003c')
    expect(script).toContain('\\u003e')
  })

  it('should handle empty headers', () => {
    const script = generateAuthScript({})

    expect(script).toContain(`window.${AUTH_GLOBAL_NAME}={}`)
  })

  it('should handle multiple headers', () => {
    const headers = {
      Authorization: 'Bearer token',
      'X-API-Key': 'key123',
      'X-Custom': 'value',
    }
    const script = generateAuthScript(headers)

    expect(script).toContain('Authorization')
    expect(script).toContain('X-API-Key')
    expect(script).toContain('X-Custom')
  })
})

describe('injectAuthIntoHtml', () => {
  it('should inject after <head> tag', () => {
    const html =
      '<!DOCTYPE html><html><head><title>Test</title></head><body></body></html>'
    const headers = { Authorization: 'Bearer token' }

    const result = injectAuthIntoHtml(html, headers)

    expect(result).toContain(`window.${AUTH_GLOBAL_NAME}`)
    // Script should be after <head> but before <title>
    const headPos = result.indexOf('<head>')
    const scriptPos = result.indexOf(`window.${AUTH_GLOBAL_NAME}`)
    const titlePos = result.indexOf('<title>')

    expect(scriptPos).toBeGreaterThan(headPos)
    expect(scriptPos).toBeLessThan(titlePos)
  })

  it('should inject after <html> if no <head>', () => {
    const html = '<html><body>Content</body></html>'
    const headers = { Authorization: 'Bearer token' }

    const result = injectAuthIntoHtml(html, headers)

    expect(result).toContain(`window.${AUTH_GLOBAL_NAME}`)
    expect(result).toContain('<head>')
    expect(result).toContain('</head>')
  })

  it('should prepend if no <html> tag', () => {
    const html = '<body>Just body</body>'
    const headers = { Authorization: 'Bearer token' }

    const result = injectAuthIntoHtml(html, headers)

    expect(result).toContain(`window.${AUTH_GLOBAL_NAME}`)
    expect(result.indexOf(`window.${AUTH_GLOBAL_NAME}`)).toBeLessThan(
      result.indexOf('<body>')
    )
  })

  it('should not modify HTML if headers are empty', () => {
    const html = '<!DOCTYPE html><html><head></head><body></body></html>'

    const result = injectAuthIntoHtml(html, {})

    expect(result).toBe(html)
  })

  it('should handle HTML with attributes on tags', () => {
    const html =
      '<html lang="en"><head class="main"><title>Test</title></head></html>'
    const headers = { Authorization: 'Bearer token' }

    const result = injectAuthIntoHtml(html, headers)

    expect(result).toContain(`window.${AUTH_GLOBAL_NAME}`)
    expect(result).toContain('lang="en"')
    expect(result).toContain('class="main"')
  })
})

describe('hasAuthInjection', () => {
  it('should return true if auth is injected', () => {
    const html = `<html><head><script>window.${AUTH_GLOBAL_NAME}={}</script></head></html>`

    expect(hasAuthInjection(html)).toBe(true)
  })

  it('should return false if auth is not injected', () => {
    const html = '<html><head></head><body></body></html>'

    expect(hasAuthInjection(html)).toBe(false)
  })

  it('should return false for empty string', () => {
    expect(hasAuthInjection('')).toBe(false)
  })
})

describe('AUTH_GLOBAL_NAME', () => {
  it('should be __BYOF_AUTH__', () => {
    expect(AUTH_GLOBAL_NAME).toBe('__BYOF_AUTH__')
  })
})
