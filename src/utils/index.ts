/**
 * Shared utility functions for BYOF
 */

export { fetchWithValidation } from './fetch'
export type {
  FetchWithValidationOptions,
  FetchWithValidationResult,
} from './fetch'

/**
 * Combine two AbortSignals into one that aborts when either signal aborts.
 *
 * @param signal1 - First AbortSignal
 * @param signal2 - Second AbortSignal
 * @returns A new AbortSignal that aborts when either input signal aborts
 */
export function combineAbortSignals(
  signal1: AbortSignal,
  signal2: AbortSignal
): AbortSignal {
  const controller = new AbortController()

  const abort = () => controller.abort()
  signal1.addEventListener('abort', abort, { once: true })
  signal2.addEventListener('abort', abort, { once: true })

  // If either signal is already aborted, abort immediately
  if (signal1.aborted || signal2.aborted) {
    controller.abort()
  }

  return controller.signal
}

/**
 * Check if an error is an AbortError (from fetch timeout or manual abort).
 * Uses duck typing for broader compatibility across environments.
 *
 * @param error - The error to check
 * @returns true if the error is an AbortError
 */
export function isAbortError(error: unknown): boolean {
  // Must be an object with a name property
  if (typeof error !== 'object' || error === null) {
    return false
  }

  // Check for name property (Error or DOMException)
  if ('name' in error && (error as { name: unknown }).name === 'AbortError') {
    return true
  }

  // DOMException.ABORT_ERR = 20
  if ('code' in error && (error as { code: unknown }).code === 20) {
    return true
  }

  return false
}
