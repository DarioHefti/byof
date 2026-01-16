# Task 04: API Spec Loader

## Objective
Implement the API spec loading and normalization module that handles JSON OpenAPI specs.

## Requirements

### 1. Create `src/spec/loader.ts`

```typescript
import { ByofError } from '../types'

export interface NormalizedSpec {
  rawText: string
  json: object
}

/**
 * Load an API spec from a URL
 * @param url - URL to fetch the JSON spec from
 * @returns Promise resolving to the spec as a string
 * @throws ByofError with code 'SPEC_ERROR' on failure
 */
export async function loadSpecFromUrl(url: string): Promise<string> {
  try {
    const response = await fetch(url)
    
    if (!response.ok) {
      throw new Error(`Failed to fetch spec: ${response.status} ${response.statusText}`)
    }
    
    const text = await response.text()
    return text
  } catch (error) {
    throw createSpecError(`Failed to load spec from ${url}`, error)
  }
}

/**
 * Normalize and validate a raw API spec string
 * @param raw - Raw JSON string
 * @returns NormalizedSpec with both raw text and parsed JSON
 * @throws ByofError with code 'SPEC_ERROR' on invalid JSON or missing required fields
 */
export function normalizeSpec(raw: string): NormalizedSpec {
  let json: object
  
  try {
    json = JSON.parse(raw)
  } catch (error) {
    throw createSpecError('Invalid JSON in API spec', error)
  }
  
  // Validate it looks like an OpenAPI spec
  validateOpenApiSpec(json)
  
  return {
    rawText: raw,
    json,
  }
}

/**
 * Validate that the parsed spec has minimal OpenAPI structure
 * @throws ByofError if validation fails
 */
function validateOpenApiSpec(spec: object): void {
  // Check for required OpenAPI fields
  // - Must have 'openapi' or 'swagger' version field
  // - Must have 'paths' object
  // - 'info' is recommended but not strictly required
  
  const s = spec as Record<string, unknown>
  
  if (!s.openapi && !s.swagger) {
    throw createSpecError('API spec must have "openapi" or "swagger" version field')
  }
  
  if (!s.paths || typeof s.paths !== 'object') {
    throw createSpecError('API spec must have a "paths" object')
  }
}

function createSpecError(message: string, details?: unknown): ByofError {
  return {
    code: 'SPEC_ERROR',
    message,
    details,
  }
}
```

### 2. Create `src/spec/index.ts`

```typescript
export * from './loader'
```

### 3. Add unit tests in `src/spec/loader.test.ts`

```typescript
import { describe, it, expect, vi } from 'vitest'
import { loadSpecFromUrl, normalizeSpec } from './loader'

describe('normalizeSpec', () => {
  it('should parse valid OpenAPI 3 JSON', () => {
    const spec = JSON.stringify({
      openapi: '3.0.0',
      info: { title: 'Test API', version: '1.0.0' },
      paths: {
        '/test': { get: { summary: 'Test endpoint' } }
      }
    })
    
    const result = normalizeSpec(spec)
    
    expect(result.rawText).toBe(spec)
    expect(result.json).toHaveProperty('openapi', '3.0.0')
    expect(result.json).toHaveProperty('paths')
  })
  
  it('should parse valid Swagger 2 JSON', () => {
    const spec = JSON.stringify({
      swagger: '2.0',
      info: { title: 'Test API', version: '1.0.0' },
      paths: {}
    })
    
    const result = normalizeSpec(spec)
    expect(result.json).toHaveProperty('swagger', '2.0')
  })
  
  it('should throw on invalid JSON', () => {
    expect(() => normalizeSpec('not json')).toThrow()
  })
  
  it('should throw if missing openapi/swagger version', () => {
    const spec = JSON.stringify({ paths: {} })
    expect(() => normalizeSpec(spec)).toThrow('openapi')
  })
  
  it('should throw if missing paths', () => {
    const spec = JSON.stringify({ openapi: '3.0.0' })
    expect(() => normalizeSpec(spec)).toThrow('paths')
  })
})

describe('loadSpecFromUrl', () => {
  it('should fetch spec from URL', async () => {
    const mockSpec = JSON.stringify({ openapi: '3.0.0', paths: {} })
    
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      text: () => Promise.resolve(mockSpec),
    })
    
    const result = await loadSpecFromUrl('https://example.com/spec.json')
    expect(result).toBe(mockSpec)
  })
  
  it('should throw on HTTP error', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 404,
      statusText: 'Not Found',
    })
    
    await expect(loadSpecFromUrl('https://example.com/spec.json'))
      .rejects.toThrow('404')
  })
  
  it('should throw on network error', async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error('Network error'))
    
    await expect(loadSpecFromUrl('https://example.com/spec.json'))
      .rejects.toThrow()
  })
})
```

## Acceptance Criteria
- [ ] `loadSpecFromUrl` fetches and returns spec text
- [ ] `normalizeSpec` parses JSON and validates structure
- [ ] Throws `ByofError` with code `SPEC_ERROR` on failures
- [ ] Validates presence of `openapi`/`swagger` version field
- [ ] Validates presence of `paths` object
- [ ] All unit tests pass
