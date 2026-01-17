import { describe, expect, it, vi } from 'vitest'

import { combineAbortSignals, isAbortError } from './index'

describe('combineAbortSignals', () => {
  it('should return a signal that is not aborted when neither input is aborted', () => {
    const controller1 = new AbortController()
    const controller2 = new AbortController()

    const combined = combineAbortSignals(controller1.signal, controller2.signal)

    expect(combined.aborted).toBe(false)
  })

  it('should abort when the first signal aborts', () => {
    const controller1 = new AbortController()
    const controller2 = new AbortController()

    const combined = combineAbortSignals(controller1.signal, controller2.signal)
    controller1.abort()

    expect(combined.aborted).toBe(true)
  })

  it('should abort when the second signal aborts', () => {
    const controller1 = new AbortController()
    const controller2 = new AbortController()

    const combined = combineAbortSignals(controller1.signal, controller2.signal)
    controller2.abort()

    expect(combined.aborted).toBe(true)
  })

  it('should be aborted immediately if first signal is already aborted', () => {
    const controller1 = new AbortController()
    const controller2 = new AbortController()
    controller1.abort()

    const combined = combineAbortSignals(controller1.signal, controller2.signal)

    expect(combined.aborted).toBe(true)
  })

  it('should be aborted immediately if second signal is already aborted', () => {
    const controller1 = new AbortController()
    const controller2 = new AbortController()
    controller2.abort()

    const combined = combineAbortSignals(controller1.signal, controller2.signal)

    expect(combined.aborted).toBe(true)
  })

  it('should trigger abort event listeners', () => {
    const controller1 = new AbortController()
    const controller2 = new AbortController()

    const combined = combineAbortSignals(controller1.signal, controller2.signal)
    const abortHandler = vi.fn()
    combined.addEventListener('abort', abortHandler)

    controller1.abort()

    expect(abortHandler).toHaveBeenCalled()
  })
})

describe('isAbortError', () => {
  it('should return false for non-Error values', () => {
    expect(isAbortError(null)).toBe(false)
    expect(isAbortError(undefined)).toBe(false)
    expect(isAbortError('error')).toBe(false)
    expect(isAbortError(42)).toBe(false)
    expect(isAbortError({})).toBe(false)
  })

  it('should return true for an Error with name "AbortError"', () => {
    const error = new Error('aborted')
    error.name = 'AbortError'

    expect(isAbortError(error)).toBe(true)
  })

  it('should return false for a regular Error', () => {
    const error = new Error('some error')

    expect(isAbortError(error)).toBe(false)
  })

  it('should return true for DOMException with ABORT_ERR code', () => {
    const error = new DOMException('aborted', 'AbortError')

    expect(isAbortError(error)).toBe(true)
  })

  it('should return false for other DOMExceptions', () => {
    const error = new DOMException('network error', 'NetworkError')

    expect(isAbortError(error)).toBe(false)
  })

  it('should return true for an error with code 20', () => {
    const error = new Error('aborted') as Error & { code: number }
    error.code = 20 // DOMException.ABORT_ERR

    expect(isAbortError(error)).toBe(true)
  })
})
