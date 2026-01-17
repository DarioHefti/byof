# Task 04: API Spec Loader

## Objective
Implement the API spec loading and normalization module that handles JSON OpenAPI specs.

## Requirements

### 1. Create `src/spec/loader.ts`

```typescript
import { z } from 'zod'

import { ByofError, ByofErrorCode, ByofLogger, defaultLogger } from '../types'
import { openApiSpecSchema } from '../schemas'

export interface NormalizedSpec {
  rawText: string
  json: z.infer<typeof openApiSpecSchema>
}

export interface LoadSpecOptions {
  logger?: ByofLogger
}

/**
 * Load an API spec from a URL
 * @param url - URL to fetch the JSON spec from
 * @param options - Optional configuration including logger
 * @returns Promise resolving to the spec as a string
 * @throws ByofError with code 'SPEC_ERROR' on failure
 */
export async function loadSpecFromUrl(
  url: string,
  options: LoadSpecOptions = {}
): Promise<string> {
  const logger = options.logger ?? defaultLogger
  
  logger.debug('Loading spec from URL', { url })
  
  try {
    const response = await fetch(url)
    
    if (!response.ok) {
      throw new Error(`Failed to fetch spec: ${response.status} ${response.statusText}`)
    }
    
    const text = await response.text()
    logger.info('Spec loaded successfully', { url, length: text.length })
    return text
  } catch (error: unknown) {
    logger.error('Failed to load spec', { url, error })
    throw createSpecError(`Failed to load spec from ${url}`, error)
  }
}

/**
 * Normalize and validate a raw API spec string using Zod
 * @param raw - Raw JSON string
 * @param options - Optional configuration including logger
 * @returns NormalizedSpec with both raw text and parsed JSON
 * @throws ByofError with code 'SPEC_ERROR' on invalid JSON or missing required fields
 */
export function normalizeSpec(
  raw: string,
  options: LoadSpecOptions = {}
): NormalizedSpec {
  const logger = options.logger ?? defaultLogger
  
  logger.debug('Normalizing API spec', { length: raw.length })
  
  let parsed: unknown
  
  try {
    parsed = JSON.parse(raw) as unknown
  } catch (error: unknown) {
    logger.error('Invalid JSON in API spec', { error })
    throw createSpecError('Invalid JSON in API spec', error)
  }
  
  // Validate with Zod schema
  const result = openApiSpecSchema.safeParse(parsed)
  
  if (!result.success) {
    const errorMessage = result.error.errors
      .map(e => `${e.path.join('.')}: ${e.message}`)
      .join('; ')
    logger.error('API spec validation failed', { errors: result.error.errors })
    throw createSpecError(`Invalid API spec: ${errorMessage}`, result.error)
  }
  
  logger.info('API spec normalized successfully', { 
    version: result.data.openapi ?? result.data.swagger,
    pathCount: Object.keys(result.data.paths).length,
  })
  
  return {
    rawText: raw,
    json: result.data,
  }
}

function createSpecError(message: string, details?: unknown): ByofError {
  return {
    code: ByofErrorCode.SPEC_ERROR,
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
        '/test': { get: { summary: 'Test endpoint' } }
      }
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
      paths: {}
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
    expect(() => normalizeSpec(spec, testOptions)).toThrow('paths')
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
  it('should fetch spec from URL', async () => {
    const mockSpec = JSON.stringify({ openapi: '3.0.0', paths: {} })
    
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      text: () => Promise.resolve(mockSpec),
    })
    
    const result = await loadSpecFromUrl('https://example.com/spec.json', testOptions)
    expect(result).toBe(mockSpec)
  })
  
  it('should throw on HTTP error', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 404,
      statusText: 'Not Found',
    })
    
    await expect(loadSpecFromUrl('https://example.com/spec.json', testOptions))
      .rejects.toThrow('404')
  })
  
  it('should throw on network error', async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error('Network error'))
    
    await expect(loadSpecFromUrl('https://example.com/spec.json', testOptions))
      .rejects.toThrow()
  })
  
  it('should return ByofError with SPEC_ERROR code on failure', async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error('Network error'))
    
    try {
      await loadSpecFromUrl('https://example.com/spec.json', testOptions)
      expect.fail('Should have thrown')
    } catch (error) {
      expect(error).toMatchObject({ code: 'SPEC_ERROR' })
    }
  })
})
```

## Acceptance Criteria
- [ ] `loadSpecFromUrl` fetches and returns spec text
- [ ] `normalizeSpec` parses JSON and validates with Zod schema
- [ ] Throws `ByofError` with code `SPEC_ERROR` on failures
- [ ] Validates presence of `openapi`/`swagger` version field
- [ ] Validates presence of `paths` object
- [ ] Supports pluggable logger via options
- [ ] All unit tests pass
