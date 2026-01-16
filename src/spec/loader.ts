import type { z } from 'zod'

import { openApiSpecSchema } from '../schemas'
import {
  ByofErrorCode,
  ByofException,
  type ByofLogger,
  defaultLogger,
} from '../types'

export interface NormalizedSpec {
  rawText: string
  json: z.infer<typeof openApiSpecSchema>
}

export interface LoadSpecOptions {
  logger?: ByofLogger
  /** AbortSignal for cancellation support */
  signal?: AbortSignal
}

/**
 * Load an API spec from a URL
 * @param url - URL to fetch the JSON spec from
 * @param options - Optional configuration including logger and AbortSignal
 * @returns Promise resolving to the spec as a string
 * @throws ByofException with code 'SPEC_ERROR' on failure
 */
export async function loadSpecFromUrl(
  url: string,
  options: LoadSpecOptions = {}
): Promise<string> {
  const logger = options.logger ?? defaultLogger

  logger.debug('Loading spec from URL', { url })

  try {
    const fetchOptions: RequestInit = {}
    if (options.signal) {
      fetchOptions.signal = options.signal
    }
    const response = await fetch(url, fetchOptions)

    if (!response.ok) {
      throw new Error(
        `Failed to fetch spec: ${response.status} ${response.statusText}`
      )
    }

    const text = await response.text()
    logger.info('Spec loaded successfully', { url, length: text.length })
    return text
  } catch (error: unknown) {
    // Don't wrap AbortError
    if (error instanceof Error && error.name === 'AbortError') {
      throw error
    }

    logger.error('Failed to load spec', { url, error })
    throw new ByofException(
      ByofErrorCode.SPEC_ERROR,
      `Failed to load spec from ${url}`,
      error
    )
  }
}

/**
 * Normalize and validate a raw API spec string using Zod
 * @param raw - Raw JSON string
 * @param options - Optional configuration including logger
 * @returns NormalizedSpec with both raw text and parsed JSON
 * @throws ByofException with code 'SPEC_ERROR' on invalid JSON or missing required fields
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
    throw new ByofException(
      ByofErrorCode.SPEC_ERROR,
      'Invalid JSON in API spec',
      error
    )
  }

  // Validate with Zod schema
  const result = openApiSpecSchema.safeParse(parsed)

  if (!result.success) {
    const errorMessage = result.error.errors
      .map((e) => `${e.path.join('.')}: ${e.message}`)
      .join('; ')
    logger.error('API spec validation failed', { errors: result.error.errors })
    throw new ByofException(
      ByofErrorCode.SPEC_ERROR,
      `Invalid API spec: ${errorMessage}`,
      result.error
    )
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

/**
 * Load and normalize an API spec from a URL in one step
 * @param url - URL to fetch the JSON spec from
 * @param options - Optional configuration including logger and AbortSignal
 * @returns Promise resolving to the normalized spec
 * @throws ByofException with code 'SPEC_ERROR' on failure
 */
export async function loadAndNormalizeSpec(
  url: string,
  options: LoadSpecOptions = {}
): Promise<NormalizedSpec> {
  const raw = await loadSpecFromUrl(url, options)
  return normalizeSpec(raw, options)
}
