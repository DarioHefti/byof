/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

import { ByofErrorCode, noopLogger } from '../types'

import { createByof } from './byof'

const testLogger = noopLogger

describe('createByof', () => {
  let mountElement: HTMLElement
  const originalFetch = globalThis.fetch

  beforeEach(() => {
    // Create fresh mount element for each test
    mountElement = document.createElement('div')
    mountElement.id = 'test-mount'
    document.body.appendChild(mountElement)

    // Mock fetch
    globalThis.fetch = vi.fn()
  })

  afterEach(() => {
    // Cleanup
    if (mountElement.parentNode) {
      mountElement.parentNode.removeChild(mountElement)
    }
    // Clean up any style elements
    const styleEl = document.getElementById('byof-styles')
    if (styleEl) {
      styleEl.remove()
    }
    vi.restoreAllMocks()
    globalThis.fetch = originalFetch
  })

  it('should create a BYOF instance with required options', () => {
    const instance = createByof({
      mount: mountElement,
      chatEndpoint: 'https://api.example.com/chat',
      logger: testLogger,
    })

    expect(instance).toBeDefined()
    expect(typeof instance.destroy).toBe('function')
    expect(typeof instance.setApiSpec).toBe('function')
    expect(typeof instance.setChatEndpoint).toBe('function')
    expect(typeof instance.setSaveEndpoint).toBe('function')
    expect(typeof instance.saveCurrent).toBe('function')
    expect(typeof instance.loadSaved).toBe('function')
    expect(typeof instance.reset).toBe('function')

    // Cleanup
    instance.destroy()
  })

  it('should throw if mount element is missing', () => {
    expect(() =>
      createByof({
        mount: null as unknown as HTMLElement,
        chatEndpoint: 'https://api.example.com/chat',
        logger: testLogger,
      })
    ).toThrow()
  })

  it('should throw if chatEndpoint is missing', () => {
    expect(() =>
      createByof({
        mount: mountElement,
        chatEndpoint: '',
        logger: testLogger,
      })
    ).toThrow()
  })

  it('should render UI elements into mount', () => {
    const instance = createByof({
      mount: mountElement,
      chatEndpoint: 'https://api.example.com/chat',
      logger: testLogger,
    })

    // Check that UI container was added
    const container = mountElement.querySelector('.byof-container')
    expect(container).not.toBeNull()

    // Check for key UI elements
    expect(mountElement.querySelector('.byof-header')).not.toBeNull()
    expect(mountElement.querySelector('.byof-chat')).not.toBeNull()
    expect(mountElement.querySelector('.byof-sandbox')).not.toBeNull()

    instance.destroy()
  })

  it('should remove UI elements on destroy', () => {
    const instance = createByof({
      mount: mountElement,
      chatEndpoint: 'https://api.example.com/chat',
      logger: testLogger,
    })

    // Verify UI exists
    expect(mountElement.querySelector('.byof-container')).not.toBeNull()

    // Destroy
    instance.destroy()

    // Verify UI is removed
    expect(mountElement.querySelector('.byof-container')).toBeNull()
  })

  it('should allow setting API spec', () => {
    const instance = createByof({
      mount: mountElement,
      chatEndpoint: 'https://api.example.com/chat',
      logger: testLogger,
    })

    // Should not throw
    expect(() => {
      instance.setApiSpec('{"openapi":"3.0.0","paths":{}}')
    }).not.toThrow()

    instance.destroy()
  })

  it('should allow setting chat endpoint', () => {
    const instance = createByof({
      mount: mountElement,
      chatEndpoint: 'https://api.example.com/chat',
      logger: testLogger,
    })

    // Should not throw
    expect(() => {
      instance.setChatEndpoint('https://api.example.com/chat/v2')
    }).not.toThrow()

    instance.destroy()
  })

  it('should allow setting save endpoint', () => {
    const instance = createByof({
      mount: mountElement,
      chatEndpoint: 'https://api.example.com/chat',
      logger: testLogger,
    })

    // Mock the list endpoint response
    vi.mocked(globalThis.fetch).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ items: [] }),
    } as Response)

    // Should not throw
    expect(() => {
      instance.setSaveEndpoint('https://api.example.com/save')
    }).not.toThrow()

    instance.destroy()
  })

  it('should throw when calling methods after destroy', () => {
    const instance = createByof({
      mount: mountElement,
      chatEndpoint: 'https://api.example.com/chat',
      logger: testLogger,
    })

    instance.destroy()

    expect(() => instance.setApiSpec('test')).toThrow()
    expect(() => instance.reset()).toThrow()
  })

  it('should not throw when destroy is called multiple times', () => {
    const instance = createByof({
      mount: mountElement,
      chatEndpoint: 'https://api.example.com/chat',
      logger: testLogger,
    })

    instance.destroy()

    // Should not throw on second call
    expect(() => instance.destroy()).not.toThrow()
  })

  it('should use provided apiSpec', () => {
    const apiSpec = '{"openapi":"3.0.0","paths":{}}'

    const instance = createByof({
      mount: mountElement,
      chatEndpoint: 'https://api.example.com/chat',
      apiSpec,
      logger: testLogger,
    })

    // Instance should be created successfully
    expect(instance).toBeDefined()

    instance.destroy()
  })

  it('should throw SAVE_ERROR when saving without save endpoint', async () => {
    const instance = createByof({
      mount: mountElement,
      chatEndpoint: 'https://api.example.com/chat',
      logger: testLogger,
    })

    await expect(instance.saveCurrent()).rejects.toMatchObject({
      code: ByofErrorCode.SAVE_ERROR,
      message: expect.stringContaining('not configured'),
    })

    instance.destroy()
  })

  it('should throw SAVE_ERROR when saving with no HTML', async () => {
    vi.mocked(globalThis.fetch).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ items: [] }),
    } as Response)

    const instance = createByof({
      mount: mountElement,
      chatEndpoint: 'https://api.example.com/chat',
      saveEndpoint: 'https://api.example.com/save',
      logger: testLogger,
    })

    await expect(instance.saveCurrent()).rejects.toMatchObject({
      code: ByofErrorCode.SAVE_ERROR,
      message: expect.stringContaining('No HTML'),
    })

    instance.destroy()
  })

  it('should throw LOAD_ERROR when loading without save endpoint', async () => {
    const instance = createByof({
      mount: mountElement,
      chatEndpoint: 'https://api.example.com/chat',
      logger: testLogger,
    })

    await expect(instance.loadSaved('some-id')).rejects.toMatchObject({
      code: ByofErrorCode.LOAD_ERROR,
      message: expect.stringContaining('not configured'),
    })

    instance.destroy()
  })

  it('should call onError callback when load fails', async () => {
    const onError = vi.fn()

    // First call for list (on init), second for load
    vi.mocked(globalThis.fetch)
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ items: [] }),
      } as Response)
      .mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found',
        text: () => Promise.resolve('Not found'),
      } as Response)

    const instance = createByof({
      mount: mountElement,
      chatEndpoint: 'https://api.example.com/chat',
      saveEndpoint: 'https://api.example.com/save',
      onError,
      logger: testLogger,
    })

    // Try to load a non-existent item (will fail and call onError)
    await expect(instance.loadSaved('nonexistent-id')).rejects.toThrow()

    expect(onError).toHaveBeenCalled()
    expect(onError).toHaveBeenCalledWith(
      expect.objectContaining({
        code: ByofErrorCode.LOAD_ERROR,
      })
    )

    instance.destroy()
  })

  it('should reset state correctly', () => {
    const instance = createByof({
      mount: mountElement,
      chatEndpoint: 'https://api.example.com/chat',
      logger: testLogger,
    })

    // Reset should not throw
    expect(() => instance.reset()).not.toThrow()

    instance.destroy()
  })

  it('should apply theme configuration', () => {
    const instance = createByof({
      mount: mountElement,
      chatEndpoint: 'https://api.example.com/chat',
      theme: {
        primaryColor: '#ff0000',
        backgroundColor: '#000000',
      },
      logger: testLogger,
    })

    // Check that styles were injected
    const styleEl = document.getElementById('byof-styles')
    expect(styleEl).not.toBeNull()
    expect(styleEl?.textContent).toContain('--byof-primary')

    instance.destroy()
  })

  it('should load API spec from URL when apiSpecUrl is provided', async () => {
    const specJson = '{"openapi":"3.0.0","paths":{}}'

    vi.mocked(globalThis.fetch).mockResolvedValueOnce({
      ok: true,
      text: () => Promise.resolve(specJson),
    } as Response)

    const instance = createByof({
      mount: mountElement,
      chatEndpoint: 'https://api.example.com/chat',
      apiSpecUrl: 'https://api.example.com/spec.json',
      logger: testLogger,
    })

    // Wait for async spec loading
    await new Promise((resolve) => setTimeout(resolve, 10))

    expect(globalThis.fetch).toHaveBeenCalledWith(
      'https://api.example.com/spec.json',
      expect.any(Object)
    )

    instance.destroy()
  })

  it('should refresh saved items when save endpoint is provided', async () => {
    vi.mocked(globalThis.fetch).mockResolvedValueOnce({
      ok: true,
      json: () =>
        Promise.resolve({
          items: [
            { id: 'item-1', name: 'First Item' },
            { id: 'item-2', name: 'Second Item' },
          ],
        }),
    } as Response)

    const instance = createByof({
      mount: mountElement,
      chatEndpoint: 'https://api.example.com/chat',
      saveEndpoint: 'https://api.example.com/save',
      logger: testLogger,
    })

    // Wait for async list loading
    await new Promise((resolve) => setTimeout(resolve, 10))

    // Check that list endpoint was called
    expect(globalThis.fetch).toHaveBeenCalled()

    instance.destroy()
  })
})
