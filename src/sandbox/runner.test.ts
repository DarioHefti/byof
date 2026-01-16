import { describe, it, expect } from 'vitest'

import { noopLogger } from '../types'

import {
  prepareSandboxHtml,
  validateHtml,
  basicSanitize,
  isIframeEmpty,
} from './runner'

const testLogger = noopLogger

describe('prepareSandboxHtml', () => {
  it('should inject CSP into HTML', () => {
    const html = '<html><head></head><body>Hello</body></html>'
    const result = prepareSandboxHtml(html, {
      allowedOrigins: ['https://api.example.com'],
      logger: testLogger,
    })

    expect(result.cspInjected).toBe(true)
    expect(result.html).toContain('Content-Security-Policy')
    expect(result.html).toContain('https://api.example.com')
  })

  it('should throw SANDBOX_ERROR for empty HTML', () => {
    expect(() =>
      prepareSandboxHtml('', {
        allowedOrigins: [],
        logger: testLogger,
      })
    ).toThrow()

    expect(() =>
      prepareSandboxHtml('   ', {
        allowedOrigins: [],
        logger: testLogger,
      })
    ).toThrow()
  })

  it('should preserve original HTML content', () => {
    const html = '<html><head></head><body><h1>Hello World</h1></body></html>'
    const result = prepareSandboxHtml(html, {
      allowedOrigins: [],
      logger: testLogger,
    })

    expect(result.html).toContain('<h1>Hello World</h1>')
  })

  it('should handle HTML without structure', () => {
    const html = '<div>Just a div</div>'
    const result = prepareSandboxHtml(html, {
      allowedOrigins: [],
      logger: testLogger,
    })

    expect(result.cspInjected).toBe(true)
    expect(result.html).toContain('<!DOCTYPE html>')
    expect(result.html).toContain('<div>Just a div</div>')
  })

  it('should include multiple allowed origins', () => {
    const html = '<html><head></head><body></body></html>'
    const result = prepareSandboxHtml(html, {
      allowedOrigins: ['https://api1.example.com', 'https://api2.example.com'],
      logger: testLogger,
    })

    expect(result.html).toContain('https://api1.example.com')
    expect(result.html).toContain('https://api2.example.com')
  })
})

describe('validateHtml', () => {
  it('should return valid for basic HTML', () => {
    const result = validateHtml('<html><body>Hello</body></html>')

    expect(result.valid).toBe(true)
    expect(result.warnings).toHaveLength(0)
  })

  it('should return invalid for empty HTML', () => {
    const result = validateHtml('')

    expect(result.valid).toBe(false)
    expect(result.warnings).toContain('HTML content is empty')
  })

  it('should return invalid for whitespace-only HTML', () => {
    const result = validateHtml('   \n\t  ')

    expect(result.valid).toBe(false)
  })

  it('should warn about script tags', () => {
    const result = validateHtml('<html><script>alert(1)</script></html>')

    expect(result.valid).toBe(true)
    expect(result.warnings.some((w) => w.includes('script tags'))).toBe(true)
  })

  it('should warn about javascript: URLs', () => {
    const result = validateHtml('<a href="javascript:alert(1)">Click</a>')

    expect(result.valid).toBe(true)
    expect(result.warnings.some((w) => w.includes('javascript:'))).toBe(true)
  })

  it('should warn about document.cookie access', () => {
    const result = validateHtml('<script>document.cookie = "foo"</script>')

    expect(result.valid).toBe(true)
    expect(result.warnings.some((w) => w.includes('document.cookie'))).toBe(
      true
    )
  })

  it('should warn about localStorage access', () => {
    const result = validateHtml(
      '<script>localStorage.setItem("key", "value")</script>'
    )

    expect(result.valid).toBe(true)
    expect(result.warnings.some((w) => w.includes('Web Storage'))).toBe(true)
  })

  it('should warn about sessionStorage access', () => {
    const result = validateHtml(
      '<script>sessionStorage.getItem("key")</script>'
    )

    expect(result.valid).toBe(true)
    expect(result.warnings.some((w) => w.includes('Web Storage'))).toBe(true)
  })

  it('should warn about protocol-relative URLs', () => {
    const result = validateHtml(
      '<script src="//cdn.example.com/script.js"></script>'
    )

    expect(result.valid).toBe(true)
    expect(result.warnings.some((w) => w.includes('protocol-relative'))).toBe(
      true
    )
  })
})

describe('basicSanitize', () => {
  it('should remove meta refresh tags', () => {
    const html =
      '<html><head><meta http-equiv="refresh" content="0;url=evil.com"></head></html>'
    const result = basicSanitize(html)

    expect(result).not.toContain('http-equiv="refresh"')
    expect(result).toContain('<!-- meta refresh removed -->')
  })

  it('should remove base tags', () => {
    const html = '<html><head><base href="https://evil.com/"></head></html>'
    const result = basicSanitize(html)

    expect(result).not.toContain('<base')
    expect(result).toContain('<!-- base tag removed -->')
  })

  it('should preserve other content', () => {
    const html =
      '<html><head><title>Test</title></head><body><h1>Hello</h1></body></html>'
    const result = basicSanitize(html)

    expect(result).toContain('<title>Test</title>')
    expect(result).toContain('<h1>Hello</h1>')
  })

  it('should handle multiple dangerous elements', () => {
    const html = `
      <html>
        <head>
          <base href="https://evil.com/">
          <meta http-equiv="refresh" content="0;url=bad.com">
          <title>Test</title>
        </head>
        <body>Content</body>
      </html>
    `
    const result = basicSanitize(html)

    expect(result).not.toContain('<base')
    expect(result).not.toContain('http-equiv="refresh"')
    expect(result).toContain('<title>Test</title>')
    expect(result).toContain('Content')
  })
})

describe('isIframeEmpty', () => {
  it('should return true for iframe with no srcdoc or src', () => {
    const iframe = {
      srcdoc: '',
      src: '',
    } as HTMLIFrameElement

    expect(isIframeEmpty(iframe)).toBe(true)
  })

  it('should return true for iframe with about:blank src', () => {
    const iframe = {
      srcdoc: '',
      src: 'about:blank',
    } as HTMLIFrameElement

    expect(isIframeEmpty(iframe)).toBe(true)
  })

  it('should return false for iframe with srcdoc content', () => {
    const iframe = {
      srcdoc: '<html></html>',
      src: '',
    } as HTMLIFrameElement

    expect(isIframeEmpty(iframe)).toBe(false)
  })

  it('should return false for iframe with src', () => {
    const iframe = {
      srcdoc: '',
      src: 'https://example.com',
    } as HTMLIFrameElement

    expect(isIframeEmpty(iframe)).toBe(false)
  })

  it('should return true for whitespace-only srcdoc', () => {
    const iframe = {
      srcdoc: '   ',
      src: '',
    } as HTMLIFrameElement

    expect(isIframeEmpty(iframe)).toBe(true)
  })
})
