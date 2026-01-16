import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

import { noopLogger } from '../types'

import { loadSpecFromUrl, normalizeSpec } from './loader'

// Use noop logger in tests to avoid console noise
const testOptions = { logger: noopLogger }

describe('normalizeSpec', () => {
  it('should parse valid OpenAPI 3 JSON', () => {
    const spec = JSON.stringify({
      openapi: '3.0.0',
      info: { title: 'Test API', version: '1.0.0' },
      paths: {
        '/test': { get: { summary: 'Test endpoint' } },
      },
    })

    const result = normalizeSpec(spec, testOptions)

    expect(result.rawText).toBe(spec)
    expect(result.json).toHaveProperty('openapi', '3.0.0')
    expect(result.json).toHaveProperty('paths')
  })

  it('should parse valid Swagger 2 JSON', () => {
    const spec = JSON.stringify({
      swagger: '2.0',
      info: { title: 'Test API', version: '1.0.0' },
      paths: {},
    })

    const result = normalizeSpec(spec, testOptions)
    expect(result.json).toHaveProperty('swagger', '2.0')
  })

  it('should throw on invalid JSON', () => {
    expect(() => normalizeSpec('not json', testOptions)).toThrow()
  })

  it('should throw if missing openapi/swagger version', () => {
    const spec = JSON.stringify({ paths: {} })
    expect(() => normalizeSpec(spec, testOptions)).toThrow('openapi')
  })

  it('should throw if missing paths', () => {
    const spec = JSON.stringify({ openapi: '3.0.0' })
    expect(() => normalizeSpec(spec, testOptions)).toThrow()
  })

  it('should return ByofError with SPEC_ERROR code', () => {
    try {
      normalizeSpec('invalid', testOptions)
      expect.fail('Should have thrown')
    } catch (error) {
      expect(error).toMatchObject({ code: 'SPEC_ERROR' })
    }
  })
})

describe('loadSpecFromUrl', () => {
  const originalFetch = globalThis.fetch

  beforeEach(() => {
    vi.resetAllMocks()
  })

  afterEach(() => {
    globalThis.fetch = originalFetch
  })

  it('should fetch spec from URL', async () => {
    const mockSpec = JSON.stringify({ openapi: '3.0.0', paths: {} })

    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      text: () => Promise.resolve(mockSpec),
    })

    const result = await loadSpecFromUrl(
      'https://example.com/spec.json',
      testOptions
    )
    expect(result).toBe(mockSpec)
  })

  it('should throw on HTTP error', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 404,
      statusText: 'Not Found',
    })

    await expect(
      loadSpecFromUrl('https://example.com/spec.json', testOptions)
    ).rejects.toThrow('Failed to load spec')
  })

  it('should throw on network error', async () => {
    globalThis.fetch = vi.fn().mockRejectedValue(new Error('Network error'))

    await expect(
      loadSpecFromUrl('https://example.com/spec.json', testOptions)
    ).rejects.toThrow()
  })

  it('should return ByofError with SPEC_ERROR code on failure', async () => {
    globalThis.fetch = vi.fn().mockRejectedValue(new Error('Network error'))

    try {
      await loadSpecFromUrl('https://example.com/spec.json', testOptions)
      expect.fail('Should have thrown')
    } catch (error) {
      expect(error).toMatchObject({ code: 'SPEC_ERROR' })
    }
  })

  it('should pass through AbortError without wrapping', async () => {
    const abortError = new Error('Aborted')
    abortError.name = 'AbortError'
    globalThis.fetch = vi.fn().mockRejectedValue(abortError)

    try {
      await loadSpecFromUrl('https://example.com/spec.json', testOptions)
      expect.fail('Should have thrown')
    } catch (error) {
      expect(error).toBe(abortError)
      expect(error).not.toHaveProperty('code')
    }
  })
})
