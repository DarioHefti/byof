import { describe, it, expect } from 'vitest'

import { buildDefaultPrompt, buildSystemPrompt, getApiBaseUrl } from './builder'

describe('getApiBaseUrl', () => {
  it('should return undefined for empty array', () => {
    expect(getApiBaseUrl([])).toBeUndefined()
  })

  it('should prefer localhost origin', () => {
    expect(
      getApiBaseUrl([
        'https://api.example.com',
        'http://localhost:3001',
        'https://cdn.example.com',
      ])
    ).toBe('http://localhost:3001')
  })

  it('should prefer 127.0.0.1 origin', () => {
    expect(
      getApiBaseUrl(['https://api.example.com', 'http://127.0.0.1:8080'])
    ).toBe('http://127.0.0.1:8080')
  })

  it('should strip wildcard port from localhost', () => {
    expect(getApiBaseUrl(['http://localhost:*'])).toBe('http://localhost:3001')
  })

  it('should fall back to first origin if no localhost', () => {
    expect(
      getApiBaseUrl(['https://api.example.com', 'https://cdn.example.com'])
    ).toBe('https://api.example.com')
  })
})

describe('buildDefaultPrompt', () => {
  it('should include basic output rules', () => {
    const prompt = buildDefaultPrompt({})

    expect(prompt).toContain('Generate a single, self-contained HTML file')
    expect(prompt).toContain('<!DOCTYPE html>')
    expect(prompt).toContain('Do NOT wrap in markdown')
    expect(prompt).toContain('No external dependencies')
  })

  it('should include API base URL when provided', () => {
    const prompt = buildDefaultPrompt({
      apiBaseUrl: 'http://localhost:3001',
    })

    expect(prompt).toContain('Base URL: http://localhost:3001')
    expect(prompt).toContain('localStorage/sessionStorage are BLOCKED')
  })

  it('should include API spec when provided', () => {
    const apiSpec = '{"openapi":"3.0.0","paths":{}}'
    const prompt = buildDefaultPrompt({
      apiSpec,
    })

    expect(prompt).toContain('API specification:')
    expect(prompt).toContain(apiSpec)
  })

  it('should not include API section when no base URL or spec', () => {
    const prompt = buildDefaultPrompt({})

    expect(prompt).not.toContain('API integration:')
    expect(prompt).not.toContain('Base URL:')
  })
})

describe('buildSystemPrompt', () => {
  it('should use default prompt when no config provided', () => {
    const prompt = buildSystemPrompt({})

    expect(prompt).toContain('Generate a single, self-contained HTML file')
  })

  it('should use custom systemPrompt when provided', () => {
    const customPrompt = 'You are a custom assistant'
    const prompt = buildSystemPrompt({}, { systemPrompt: customPrompt })

    expect(prompt).toBe(customPrompt)
    expect(prompt).not.toContain('Generate a single')
  })

  it('should append suffix to default prompt', () => {
    const suffix = 'Always use blue colors.'
    const prompt = buildSystemPrompt({}, { systemPromptSuffix: suffix })

    expect(prompt).toContain('Generate a single, self-contained HTML file')
    expect(prompt).toContain(suffix)
  })

  it('should use custom buildSystemPrompt function', () => {
    const customBuilder = (options: { apiBaseUrl?: string | undefined }) =>
      `Custom prompt with base: ${options.apiBaseUrl ?? 'none'}`

    const prompt = buildSystemPrompt(
      { apiBaseUrl: 'http://test.com' },
      { buildSystemPrompt: customBuilder }
    )

    expect(prompt).toBe('Custom prompt with base: http://test.com')
  })

  it('should pass options to default builder', () => {
    const prompt = buildSystemPrompt({
      apiSpec: '{"test":true}',
      apiBaseUrl: 'http://localhost:8080',
    })

    expect(prompt).toContain('http://localhost:8080')
    expect(prompt).toContain('{"test":true}')
  })
})
