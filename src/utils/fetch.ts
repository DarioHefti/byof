/**
 * Common fetch utility with timeout, signal handling, and Zod validation
 */

import type { z } from 'zod'

import { type ByofErrorCode, type ByofLogger, ByofException } from '../types'

import { combineAbortSignals, isAbortError } from './index'

export interface FetchWithValidationOptions<T> {
  /** Endpoint URL */
  endpoint: string
  /** Request body (will be JSON stringified) */
  body: object
  /** Zod schema for response validation */
  schema: z.ZodSchema<T>
  /** Error code to use on validation or HTTP errors */
  errorCode: ByofErrorCode
  /** Error code to use on network/timeout errors */
  networkErrorCode?: ByofErrorCode | undefined
  /** Operation name for error messages (e.g., "Chat", "Save") */
  operationName: string
  /** Timeout in milliseconds */
  timeout: number
  /** AbortSignal for external cancellation */
  signal?: AbortSignal | undefined
  /** Logger for observability */
  logger: ByofLogger
}

export interface FetchWithValidationResult<T> {
  /** Parsed and validated response data */
  data: T
}

/**
 * Perform a fetch request with timeout, combined abort signals, and Zod validation.
 *
 * @throws ByofException on HTTP errors, validation errors, or network errors
 */
export async function fetchWithValidation<T>(
  options: FetchWithValidationOptions<T>
): Promise<FetchWithValidationResult<T>> {
  const {
    endpoint,
    body,
    schema,
    errorCode,
    networkErrorCode = 'NETWORK_ERROR',
    operationName,
    timeout,
    signal,
    logger,
  } = options

  // Create abort controller for timeout
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeout)

  // Combine signals if one was provided
  const combinedSignal = signal
    ? combineAbortSignals(signal, controller.signal)
    : controller.signal

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
      signal: combinedSignal,
    })

    clearTimeout(timeoutId)

    if (!response.ok) {
      const errorText = await response.text().catch(() => '')
      logger.error(`${operationName} request HTTP error`, {
        status: response.status,
        statusText: response.statusText,
      })
      throw new ByofException(
        errorCode,
        `${operationName} request failed: ${response.status} ${response.statusText}`,
        { status: response.status, body: errorText }
      )
    }

    const data: unknown = await response.json()

    // Validate response with Zod schema
    const parseResult = schema.safeParse(data)

    if (!parseResult.success) {
      const errorMessage = parseResult.error.errors
        .map((e) => `${e.path.join('.')}: ${e.message}`)
        .join('; ')
      logger.error(`Invalid ${operationName.toLowerCase()} response`, {
        errors: parseResult.error.errors,
      })
      throw new ByofException(
        errorCode,
        `Invalid response: ${errorMessage}`,
        parseResult.error
      )
    }

    return { data: parseResult.data }
  } catch (error: unknown) {
    clearTimeout(timeoutId)

    // Check for AbortError (timeout or external abort)
    if (isAbortError(error)) {
      logger.warn(`${operationName} request aborted or timed out`)
      throw new ByofException(
        networkErrorCode,
        `${operationName} request timed out or was aborted`
      )
    }

    if (error instanceof ByofException) {
      throw error
    }

    logger.error(`${operationName} request failed`, { error })
    throw new ByofException(
      networkErrorCode,
      `${operationName} request failed`,
      error
    )
  }
}
