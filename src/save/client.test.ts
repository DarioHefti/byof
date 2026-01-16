import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

import { noopLogger } from '../types'

import { listSavedUIs, loadUI, saveUI } from './client'

// Use noop logger in tests to avoid console noise
const testLogger = noopLogger

describe('saveUI', () => {
  const originalFetch = globalThis.fetch

  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.restoreAllMocks()
    globalThis.fetch = originalFetch
  })

  it('should save UI and return id', async () => {
    const mockResponse = { id: 'saved-123', name: 'My UI' }

    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockResponse),
    })

    const resultPromise = saveUI({
      endpoint: 'https://api.example.com/save',
      html: '<html>test</html>',
      name: 'My UI',
      logger: testLogger,
    })

    await vi.runAllTimersAsync()
    const result = await resultPromise

    expect(result.id).toBe('saved-123')
    expect(result.name).toBe('My UI')
    expect(globalThis.fetch).toHaveBeenCalledWith(
      'https://api.example.com/save',
      expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })
    )
  })

  it('should include messages and apiSpec in request', async () => {
    const mockResponse = { id: 'saved-456' }

    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockResponse),
    })

    await saveUI({
      endpoint: 'https://api.example.com/save',
      html: '<html></html>',
      messages: [{ role: 'user', content: 'Hello', ts: 1234567890 }],
      apiSpec: '{"openapi":"3.0.0"}',
      context: { projectId: 'proj-1' },
      logger: testLogger,
    })

    const callArgs = vi.mocked(globalThis.fetch).mock.calls[0]
    expect(callArgs).toBeDefined()
    const body = JSON.parse(callArgs?.[1]?.body as string) as Record<
      string,
      unknown
    >

    expect(body).toHaveProperty('html', '<html></html>')
    expect(body).toHaveProperty('messages')
    expect(body).toHaveProperty('apiSpec', '{"openapi":"3.0.0"}')
    expect(body).toHaveProperty('context')
  })

  it('should throw SAVE_ERROR on HTTP error', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      statusText: 'Internal Server Error',
      text: () => Promise.resolve('Server error'),
    })

    await expect(
      saveUI({
        endpoint: 'https://api.example.com/save',
        html: '<html></html>',
        logger: testLogger,
      })
    ).rejects.toMatchObject({
      code: 'SAVE_ERROR',
    })
  })

  it('should throw SAVE_ERROR on invalid response', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ noId: true }),
    })

    await expect(
      saveUI({
        endpoint: 'https://api.example.com/save',
        html: '<html></html>',
        logger: testLogger,
      })
    ).rejects.toMatchObject({
      code: 'SAVE_ERROR',
      message: expect.stringContaining('Invalid response'),
    })
  })

  it('should throw NETWORK_ERROR on timeout', async () => {
    vi.useRealTimers()

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
      saveUI({
        endpoint: 'https://api.example.com/save',
        html: '<html></html>',
        timeout: 10,
        logger: testLogger,
      })
    ).rejects.toMatchObject({
      code: 'NETWORK_ERROR',
      message: expect.stringContaining('timed out'),
    })
  }, 1000)

  it('should support external abort signal', async () => {
    const controller = new AbortController()

    globalThis.fetch = vi.fn().mockImplementation(
      (_url: string, options?: { signal?: AbortSignal }) =>
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

    controller.abort()

    await expect(
      saveUI({
        endpoint: 'https://api.example.com/save',
        html: '<html></html>',
        signal: controller.signal,
        logger: testLogger,
      })
    ).rejects.toMatchObject({
      code: 'NETWORK_ERROR',
    })
  })
})

describe('loadUI', () => {
  const originalFetch = globalThis.fetch

  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.restoreAllMocks()
    globalThis.fetch = originalFetch
  })

  it('should load UI and return HTML', async () => {
    const mockResponse = {
      id: 'saved-123',
      name: 'My UI',
      html: '<html>loaded</html>',
      updatedAt: '2024-01-01T00:00:00Z',
    }

    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockResponse),
    })

    const resultPromise = loadUI({
      endpoint: 'https://api.example.com/load',
      id: 'saved-123',
      logger: testLogger,
    })

    await vi.runAllTimersAsync()
    const result = await resultPromise

    expect(result.id).toBe('saved-123')
    expect(result.html).toBe('<html>loaded</html>')
    expect(result.name).toBe('My UI')
    expect(result.updatedAt).toBe('2024-01-01T00:00:00Z')
  })

  it('should include messages in response', async () => {
    const mockResponse = {
      id: 'saved-123',
      html: '<html></html>',
      messages: [{ role: 'user', content: 'Hi', ts: 1234567890 }],
    }

    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockResponse),
    })

    const result = await loadUI({
      endpoint: 'https://api.example.com/load',
      id: 'saved-123',
      logger: testLogger,
    })

    expect(result.messages).toHaveLength(1)
    expect(result.messages?.[0]).toMatchObject({
      role: 'user',
      content: 'Hi',
      ts: 1234567890,
    })
  })

  it('should throw LOAD_ERROR on HTTP error', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 404,
      statusText: 'Not Found',
      text: () => Promise.resolve('Not found'),
    })

    await expect(
      loadUI({
        endpoint: 'https://api.example.com/load',
        id: 'nonexistent',
        logger: testLogger,
      })
    ).rejects.toMatchObject({
      code: 'LOAD_ERROR',
    })
  })

  it('should throw LOAD_ERROR on invalid response', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ id: 'test' }), // missing html
    })

    await expect(
      loadUI({
        endpoint: 'https://api.example.com/load',
        id: 'test',
        logger: testLogger,
      })
    ).rejects.toMatchObject({
      code: 'LOAD_ERROR',
      message: expect.stringContaining('Invalid response'),
    })
  })

  it('should throw NETWORK_ERROR on timeout', async () => {
    vi.useRealTimers()

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
      loadUI({
        endpoint: 'https://api.example.com/load',
        id: 'test',
        timeout: 10,
        logger: testLogger,
      })
    ).rejects.toMatchObject({
      code: 'NETWORK_ERROR',
      message: expect.stringContaining('timed out'),
    })
  }, 1000)

  it('should support external abort signal', async () => {
    const controller = new AbortController()

    globalThis.fetch = vi.fn().mockImplementation(
      (_url: string, options?: { signal?: AbortSignal }) =>
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

    controller.abort()

    await expect(
      loadUI({
        endpoint: 'https://api.example.com/load',
        id: 'test',
        signal: controller.signal,
        logger: testLogger,
      })
    ).rejects.toMatchObject({
      code: 'NETWORK_ERROR',
    })
  })
})

describe('listSavedUIs', () => {
  const originalFetch = globalThis.fetch

  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.restoreAllMocks()
    globalThis.fetch = originalFetch
  })

  it('should list saved UIs', async () => {
    const mockResponse = {
      items: [
        { id: 'ui-1', name: 'First', updatedAt: '2024-01-01' },
        { id: 'ui-2', name: 'Second' },
      ],
    }

    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockResponse),
    })

    const resultPromise = listSavedUIs({
      endpoint: 'https://api.example.com/list',
      logger: testLogger,
    })

    await vi.runAllTimersAsync()
    const result = await resultPromise

    expect(result.items).toHaveLength(2)
    expect(result.items[0]).toMatchObject({ id: 'ui-1', name: 'First' })
    expect(result.items[1]).toMatchObject({ id: 'ui-2', name: 'Second' })
  })

  it('should include projectId in request', async () => {
    const mockResponse = { items: [] }

    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockResponse),
    })

    await listSavedUIs({
      endpoint: 'https://api.example.com/list',
      projectId: 'proj-123',
      logger: testLogger,
    })

    const callArgs = vi.mocked(globalThis.fetch).mock.calls[0]
    expect(callArgs).toBeDefined()
    const body = JSON.parse(callArgs?.[1]?.body as string) as Record<
      string,
      unknown
    >

    expect(body).toHaveProperty('projectId', 'proj-123')
  })

  it('should throw LOAD_ERROR on HTTP error', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      statusText: 'Internal Server Error',
      text: () => Promise.resolve('Server error'),
    })

    await expect(
      listSavedUIs({
        endpoint: 'https://api.example.com/list',
        logger: testLogger,
      })
    ).rejects.toMatchObject({
      code: 'LOAD_ERROR',
    })
  })

  it('should throw LOAD_ERROR on invalid response', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ notItems: [] }),
    })

    await expect(
      listSavedUIs({
        endpoint: 'https://api.example.com/list',
        logger: testLogger,
      })
    ).rejects.toMatchObject({
      code: 'LOAD_ERROR',
      message: expect.stringContaining('Invalid response'),
    })
  })

  it('should throw NETWORK_ERROR on timeout', async () => {
    vi.useRealTimers()

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
      listSavedUIs({
        endpoint: 'https://api.example.com/list',
        timeout: 10,
        logger: testLogger,
      })
    ).rejects.toMatchObject({
      code: 'NETWORK_ERROR',
      message: expect.stringContaining('timed out'),
    })
  }, 1000)

  it('should support external abort signal', async () => {
    const controller = new AbortController()

    globalThis.fetch = vi.fn().mockImplementation(
      (_url: string, options?: { signal?: AbortSignal }) =>
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

    controller.abort()

    await expect(
      listSavedUIs({
        endpoint: 'https://api.example.com/list',
        signal: controller.signal,
        logger: testLogger,
      })
    ).rejects.toMatchObject({
      code: 'NETWORK_ERROR',
    })
  })

  it('should handle empty list', async () => {
    const mockResponse = { items: [] }

    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockResponse),
    })

    const result = await listSavedUIs({
      endpoint: 'https://api.example.com/list',
      logger: testLogger,
    })

    expect(result.items).toHaveLength(0)
  })
})
