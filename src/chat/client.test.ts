import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

import { noopLogger } from '../types'

import { sendChat } from './client'

// Use noop logger in tests to avoid console noise
const testLogger = noopLogger

describe('sendChat', () => {
  const originalFetch = globalThis.fetch

  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.restoreAllMocks()
    globalThis.fetch = originalFetch
  })

  it('should send chat request and return HTML', async () => {
    const mockResponse = { html: '<html></html>', title: 'Test' }

    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockResponse),
    })

    const resultPromise = sendChat({
      endpoint: 'https://api.example.com/chat',
      messages: [{ role: 'user', content: 'Hello', ts: Date.now() }],
      systemPrompt: 'Generate HTML',
      apiSpec: '{"openapi":"3.0.0","paths":{}}',
      logger: testLogger,
    })

    // Advance timers to clear any pending timeouts
    await vi.runAllTimersAsync()

    const result = await resultPromise

    expect(result.html).toBe('<html></html>')
    expect(result.title).toBe('Test')
    expect(globalThis.fetch).toHaveBeenCalledWith(
      'https://api.example.com/chat',
      expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })
    )
  })

  it('should throw CHAT_ERROR on HTTP error', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      statusText: 'Internal Server Error',
      text: () => Promise.resolve('Server error'),
    })

    await expect(
      sendChat({
        endpoint: 'https://api.example.com/chat',
        messages: [],
        systemPrompt: 'Generate HTML',
        logger: testLogger,
      })
    ).rejects.toMatchObject({
      code: 'CHAT_ERROR',
    })
  })

  it('should throw CHAT_ERROR on invalid response (Zod validation)', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ notHtml: true }),
    })

    await expect(
      sendChat({
        endpoint: 'https://api.example.com/chat',
        messages: [],
        systemPrompt: 'Generate HTML',
        logger: testLogger,
      })
    ).rejects.toMatchObject({
      code: 'CHAT_ERROR',
      message: expect.stringContaining('Invalid response'),
    })
  })

  it('should throw CHAT_ERROR when html is empty string', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ html: '' }),
    })

    await expect(
      sendChat({
        endpoint: 'https://api.example.com/chat',
        messages: [],
        systemPrompt: 'Generate HTML',
        logger: testLogger,
      })
    ).rejects.toMatchObject({
      code: 'CHAT_ERROR',
    })
  })

  it('should throw NETWORK_ERROR on timeout', async () => {
    // Use real timers for more predictable behavior
    vi.useRealTimers()

    // Mock fetch that respects abort signal
    globalThis.fetch = vi.fn().mockImplementation(
      (_url: string, options?: { signal?: AbortSignal }) =>
        new Promise((_resolve, reject) => {
          const signal = options?.signal
          if (signal) {
            if (signal.aborted) {
              reject(new DOMException('Aborted', 'AbortError'))
              return
            }
            signal.addEventListener('abort', () => {
              reject(new DOMException('Aborted', 'AbortError'))
            })
          }
        })
    )

    await expect(
      sendChat({
        endpoint: 'https://api.example.com/chat',
        messages: [],
        systemPrompt: 'Generate HTML',
        timeout: 10, // Very short timeout (10ms)
        logger: testLogger,
      })
    ).rejects.toMatchObject({
      code: 'NETWORK_ERROR',
    })
  }, 1000) // Test timeout of 1 second

  it('should throw NETWORK_ERROR on fetch failure', async () => {
    globalThis.fetch = vi.fn().mockRejectedValue(new Error('Network error'))

    await expect(
      sendChat({
        endpoint: 'https://api.example.com/chat',
        messages: [],
        systemPrompt: 'Generate HTML',
        logger: testLogger,
      })
    ).rejects.toMatchObject({
      code: 'NETWORK_ERROR',
    })
  })

  it('should support external abort signal', async () => {
    const controller = new AbortController()

    globalThis.fetch = vi.fn().mockImplementation(
      (_url, options: { signal?: AbortSignal }) =>
        new Promise((_resolve, reject) => {
          if (options?.signal) {
            if (options.signal.aborted) {
              reject(new DOMException('Aborted', 'AbortError'))
              return
            }
            options.signal.addEventListener('abort', () => {
              reject(new DOMException('Aborted', 'AbortError'))
            })
          }
        })
    )

    // Abort before awaiting
    controller.abort()

    await expect(
      sendChat({
        endpoint: 'https://api.example.com/chat',
        messages: [],
        systemPrompt: 'Generate HTML',
        signal: controller.signal,
        logger: testLogger,
      })
    ).rejects.toMatchObject({
      code: 'NETWORK_ERROR',
    })
  })

  it('should include context in request', async () => {
    const mockResponse = { html: '<html></html>' }

    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockResponse),
    })

    await sendChat({
      endpoint: 'https://api.example.com/chat',
      messages: [{ role: 'user', content: 'Hello', ts: Date.now() }],
      systemPrompt: 'Generate HTML',
      context: { projectId: 'proj-123', userId: 'user-456' },
      logger: testLogger,
    })

    expect(globalThis.fetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        body: expect.stringContaining('"projectId":"proj-123"'),
      })
    )
  })
})
