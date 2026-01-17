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

  it('should throw with proper error when mount is not an HTMLElement', () => {
    const notAnElement = { nodeType: 1 } // Object that's not an HTMLElement

    expect(() =>
      createByof({
        mount: notAnElement as unknown as HTMLElement,
        chatEndpoint: 'https://api.example.com/chat',
        logger: testLogger,
      })
    ).toThrow('mount must be a valid HTMLElement')
  })

  it('should successfully save and call onSaveComplete callback', async () => {
    const onSaveComplete = vi.fn()

    // First call for list (on init)
    vi.mocked(globalThis.fetch)
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ items: [] }),
      } as Response)
      // Second call for chat
      .mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            html: '<html><body>Test</body></html>',
            title: 'Test UI',
          }),
      } as Response)
      // Third call for save
      .mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            id: 'saved-123',
            name: 'My UI',
            updatedAt: '2024-01-01T00:00:00Z',
          }),
      } as Response)
      // Fourth call for list refresh after save
      .mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            items: [{ id: 'saved-123', name: 'My UI' }],
          }),
      } as Response)

    const instance = createByof({
      mount: mountElement,
      chatEndpoint: 'https://api.example.com/chat',
      saveEndpoint: 'https://api.example.com/save',
      onSaveComplete,
      logger: testLogger,
    })

    // Wait for initial list load
    await new Promise((resolve) => setTimeout(resolve, 10))

    // Simulate sending a message by finding and triggering the send button
    const textarea = mountElement.querySelector(
      '.byof-textarea'
    ) as HTMLTextAreaElement
    const sendButton = mountElement.querySelector(
      '.byof-btn-send'
    ) as HTMLButtonElement

    textarea.value = 'Create a test UI'
    sendButton.click()

    // Wait for chat response
    await new Promise((resolve) => setTimeout(resolve, 50))

    // Now save
    const result = await instance.saveCurrent('My UI')

    expect(result.id).toBe('saved-123')
    expect(onSaveComplete).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'saved-123' })
    )

    instance.destroy()
  })

  it('should load saved UI and call onLoadComplete callback', async () => {
    const onLoadComplete = vi.fn()

    // Mock responses
    vi.mocked(globalThis.fetch)
      // Initial list
      .mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            items: [{ id: 'ui-123', name: 'Saved UI' }],
          }),
      } as Response)
      // Load response
      .mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            id: 'ui-123',
            name: 'Saved UI',
            html: '<html><body>Loaded content</body></html>',
            messages: [{ role: 'user', content: 'Test', ts: 1234567890 }],
          }),
      } as Response)

    const instance = createByof({
      mount: mountElement,
      chatEndpoint: 'https://api.example.com/chat',
      saveEndpoint: 'https://api.example.com/save',
      onLoadComplete,
      logger: testLogger,
    })

    // Wait for initial list
    await new Promise((resolve) => setTimeout(resolve, 10))

    // Load a saved UI
    await instance.loadSaved('ui-123')

    expect(onLoadComplete).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'ui-123', name: 'Saved UI' })
    )

    instance.destroy()
  })

  it('should call onHtmlGenerated when HTML is generated', async () => {
    const onHtmlGenerated = vi.fn()

    // Mock chat response
    vi.mocked(globalThis.fetch).mockResolvedValueOnce({
      ok: true,
      json: () =>
        Promise.resolve({
          html: '<html><body>Generated</body></html>',
          title: 'Generated UI',
        }),
    } as Response)

    const instance = createByof({
      mount: mountElement,
      chatEndpoint: 'https://api.example.com/chat',
      onHtmlGenerated,
      logger: testLogger,
    })

    // Simulate sending a message
    const textarea = mountElement.querySelector(
      '.byof-textarea'
    ) as HTMLTextAreaElement
    const sendButton = mountElement.querySelector(
      '.byof-btn-send'
    ) as HTMLButtonElement

    textarea.value = 'Create something'
    sendButton.click()

    // Wait for response
    await new Promise((resolve) => setTimeout(resolve, 50))

    expect(onHtmlGenerated).toHaveBeenCalledWith(
      '<html><body>Generated</body></html>',
      'Generated UI'
    )

    instance.destroy()
  })

  it('should handle chat errors and show error in UI', async () => {
    const onError = vi.fn()

    // Mock failed chat response
    vi.mocked(globalThis.fetch).mockResolvedValueOnce({
      ok: false,
      status: 500,
      statusText: 'Internal Server Error',
      text: () => Promise.resolve('Server error'),
    } as Response)

    const instance = createByof({
      mount: mountElement,
      chatEndpoint: 'https://api.example.com/chat',
      onError,
      logger: testLogger,
    })

    // Simulate sending a message
    const textarea = mountElement.querySelector(
      '.byof-textarea'
    ) as HTMLTextAreaElement
    const sendButton = mountElement.querySelector(
      '.byof-btn-send'
    ) as HTMLButtonElement

    textarea.value = 'Create something'
    sendButton.click()

    // Wait for error handling
    await new Promise((resolve) => setTimeout(resolve, 50))

    expect(onError).toHaveBeenCalledWith(
      expect.objectContaining({
        code: ByofErrorCode.CHAT_ERROR,
      })
    )

    // Error should be displayed in UI
    const errorDisplay = mountElement.querySelector('.byof-error')
    expect(errorDisplay?.classList.contains('visible')).toBe(true)

    instance.destroy()
  })

  it('should inject auth headers when getAuthHeaders is provided', async () => {
    const getAuthHeaders = vi.fn().mockReturnValue({
      Authorization: 'Bearer test-token',
    })

    // Mock responses
    vi.mocked(globalThis.fetch).mockResolvedValueOnce({
      ok: true,
      json: () =>
        Promise.resolve({
          html: '<html><head></head><body>Test</body></html>',
          title: 'Test',
        }),
    } as Response)

    const instance = createByof({
      mount: mountElement,
      chatEndpoint: 'https://api.example.com/chat',
      getAuthHeaders,
      logger: testLogger,
    })

    // Simulate sending a message
    const textarea = mountElement.querySelector(
      '.byof-textarea'
    ) as HTMLTextAreaElement
    const sendButton = mountElement.querySelector(
      '.byof-btn-send'
    ) as HTMLButtonElement

    textarea.value = 'Create something'
    sendButton.click()

    // Wait for response
    await new Promise((resolve) => setTimeout(resolve, 50))

    // Auth headers should have been called
    expect(getAuthHeaders).toHaveBeenCalled()

    instance.destroy()
  })

  it('should handle async getAuthHeaders', async () => {
    const getAuthHeaders = vi.fn().mockResolvedValue({
      Authorization: 'Bearer async-token',
    })

    // Mock responses
    vi.mocked(globalThis.fetch).mockResolvedValueOnce({
      ok: true,
      json: () =>
        Promise.resolve({
          html: '<html><head></head><body>Test</body></html>',
          title: 'Test',
        }),
    } as Response)

    const instance = createByof({
      mount: mountElement,
      chatEndpoint: 'https://api.example.com/chat',
      getAuthHeaders,
      logger: testLogger,
    })

    // Simulate sending a message
    const textarea = mountElement.querySelector(
      '.byof-textarea'
    ) as HTMLTextAreaElement
    const sendButton = mountElement.querySelector(
      '.byof-btn-send'
    ) as HTMLButtonElement

    textarea.value = 'Create something'
    sendButton.click()

    // Wait for response
    await new Promise((resolve) => setTimeout(resolve, 50))

    // Async auth headers should have been called
    expect(getAuthHeaders).toHaveBeenCalled()

    instance.destroy()
  })

  it('should use custom timeProvider', async () => {
    const mockTime = 1234567890000
    const timeProvider = {
      now: vi.fn().mockReturnValue(mockTime),
      isoString: vi.fn().mockReturnValue('2009-02-13T23:31:30.000Z'),
    }

    // Mock chat response
    vi.mocked(globalThis.fetch).mockResolvedValueOnce({
      ok: true,
      json: () =>
        Promise.resolve({
          html: '<html><body>Test</body></html>',
          title: 'Test',
        }),
    } as Response)

    const instance = createByof({
      mount: mountElement,
      chatEndpoint: 'https://api.example.com/chat',
      timeProvider,
      logger: testLogger,
    })

    // Simulate sending a message
    const textarea = mountElement.querySelector(
      '.byof-textarea'
    ) as HTMLTextAreaElement
    const sendButton = mountElement.querySelector(
      '.byof-btn-send'
    ) as HTMLButtonElement

    textarea.value = 'Test'
    sendButton.click()

    // Wait for response
    await new Promise((resolve) => setTimeout(resolve, 50))

    // Time provider should have been used
    expect(timeProvider.now).toHaveBeenCalled()

    instance.destroy()
  })

  it('should handle reset correctly and clear sandbox', () => {
    const instance = createByof({
      mount: mountElement,
      chatEndpoint: 'https://api.example.com/chat',
      logger: testLogger,
    })

    // Reset should work without errors
    instance.reset()

    // Sandbox should be cleared (placeholder visible)
    const placeholder = mountElement.querySelector('.byof-sandbox-placeholder')
    expect(placeholder).not.toBeNull()
    expect((placeholder as HTMLElement).style.display).toBe('block')

    instance.destroy()
  })

  it('should handle fullscreen toggle via button', () => {
    const instance = createByof({
      mount: mountElement,
      chatEndpoint: 'https://api.example.com/chat',
      logger: testLogger,
    })

    // The fullscreen button is inside .byof-sandbox-controls
    const fullscreenBtn = mountElement.querySelector(
      '.byof-sandbox-controls .byof-btn-icon'
    ) as HTMLButtonElement
    const sandboxContainer = mountElement.querySelector('.byof-sandbox')

    // Click fullscreen button
    fullscreenBtn.click()

    expect(sandboxContainer?.classList.contains('byof-fullscreen')).toBe(true)

    // Click again to toggle off
    fullscreenBtn.click()

    expect(sandboxContainer?.classList.contains('byof-fullscreen')).toBe(false)

    instance.destroy()
  })

  it('should include projectId and userId in context', async () => {
    // Mock responses
    vi.mocked(globalThis.fetch)
      // Initial list
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ items: [] }),
      } as Response)
      // Chat response
      .mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            html: '<html><body>Test</body></html>',
            title: 'Test',
          }),
      } as Response)

    const instance = createByof({
      mount: mountElement,
      chatEndpoint: 'https://api.example.com/chat',
      saveEndpoint: 'https://api.example.com/save',
      projectId: 'project-123',
      userId: 'user-456',
      logger: testLogger,
    })

    // Wait for list
    await new Promise((resolve) => setTimeout(resolve, 10))

    // Simulate sending a message
    const textarea = mountElement.querySelector(
      '.byof-textarea'
    ) as HTMLTextAreaElement
    const sendButton = mountElement.querySelector(
      '.byof-btn-send'
    ) as HTMLButtonElement

    textarea.value = 'Test'
    sendButton.click()

    // Wait for chat
    await new Promise((resolve) => setTimeout(resolve, 50))

    // Check that chat was called with context containing projectId
    // The second call should be to the chat endpoint (first is list)
    const fetchCalls = vi.mocked(globalThis.fetch).mock.calls
    const chatCall = fetchCalls.find(
      (call) => call[0] === 'https://api.example.com/chat'
    )
    expect(chatCall).toBeDefined()
    expect(chatCall![1]).toEqual(
      expect.objectContaining({
        body: expect.stringContaining('project-123'),
      })
    )

    instance.destroy()
  })
})
