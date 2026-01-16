# Task 05: Chat Client

## Objective
Implement the chat client that sends messages to the developer-provided chat endpoint and receives generated HTML.

## Requirements

### 1. Create `src/chat/client.ts`

```typescript
import { 
  ChatRequest, 
  ChatResponse, 
  ByofError, 
  ByofMessage 
} from '../types'

export interface SendChatOptions {
  endpoint: string
  messages: ByofMessage[]
  apiSpec: string
  context?: {
    projectId?: string
    userId?: string
  }
  allowedOrigins: string[]
  timeout?: number  // Default: 60000ms (1 minute)
  signal?: AbortSignal
}

/**
 * Send a chat request to the backend endpoint
 * @returns Promise resolving to ChatResponse with generated HTML
 * @throws ByofError with code 'CHAT_ERROR' or 'NETWORK_ERROR'
 */
export async function sendChat(options: SendChatOptions): Promise<ChatResponse> {
  const {
    endpoint,
    messages,
    apiSpec,
    context,
    allowedOrigins,
    timeout = 60000,
    signal,
  } = options

  // Create abort controller for timeout
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeout)
  
  // Combine signals if one was provided
  const combinedSignal = signal 
    ? combineAbortSignals(signal, controller.signal)
    : controller.signal

  try {
    const request: ChatRequest = {
      messages: messages.map(m => ({ role: m.role, content: m.content })),
      apiSpec,
      context,
      instructions: {
        outputFormat: 'single_html',
        allowedOrigins,
      },
    }

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
      signal: combinedSignal,
    })

    clearTimeout(timeoutId)

    if (!response.ok) {
      const errorText = await response.text().catch(() => '')
      throw createChatError(
        `Chat request failed: ${response.status} ${response.statusText}`,
        { status: response.status, body: errorText }
      )
    }

    const data = await response.json()
    
    // Validate response structure
    if (!data.html || typeof data.html !== 'string') {
      throw createChatError('Invalid response: missing html field')
    }

    return {
      html: data.html,
      title: data.title,
      warnings: data.warnings,
    }
  } catch (error) {
    clearTimeout(timeoutId)
    
    if (error instanceof Error && error.name === 'AbortError') {
      throw createNetworkError('Chat request timed out or was aborted')
    }
    
    if (isByofError(error)) {
      throw error
    }
    
    throw createNetworkError('Chat request failed', error)
  }
}

function combineAbortSignals(signal1: AbortSignal, signal2: AbortSignal): AbortSignal {
  const controller = new AbortController()
  
  const abort = () => controller.abort()
  signal1.addEventListener('abort', abort)
  signal2.addEventListener('abort', abort)
  
  return controller.signal
}

function createChatError(message: string, details?: unknown): ByofError {
  return {
    code: 'CHAT_ERROR',
    message,
    details,
  }
}

function createNetworkError(message: string, details?: unknown): ByofError {
  return {
    code: 'NETWORK_ERROR',
    message,
    details,
  }
}

function isByofError(error: unknown): error is ByofError {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    'message' in error
  )
}
```

### 2. Create `src/chat/index.ts`

```typescript
export * from './client'
```

### 3. Add unit tests in `src/chat/client.test.ts`

```typescript
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { sendChat } from './client'

describe('sendChat', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })
  
  afterEach(() => {
    vi.useRealTimers()
    vi.restoreAllMocks()
  })

  it('should send chat request and return HTML', async () => {
    const mockResponse = { html: '<html></html>', title: 'Test' }
    
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockResponse),
    })

    const result = await sendChat({
      endpoint: 'https://api.example.com/chat',
      messages: [{ role: 'user', content: 'Hello', ts: Date.now() }],
      apiSpec: '{"openapi":"3.0.0","paths":{}}',
      allowedOrigins: ['https://api.example.com'],
    })

    expect(result.html).toBe('<html></html>')
    expect(result.title).toBe('Test')
    expect(global.fetch).toHaveBeenCalledWith(
      'https://api.example.com/chat',
      expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })
    )
  })

  it('should throw CHAT_ERROR on HTTP error', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      statusText: 'Internal Server Error',
      text: () => Promise.resolve('Server error'),
    })

    await expect(sendChat({
      endpoint: 'https://api.example.com/chat',
      messages: [],
      apiSpec: '{}',
      allowedOrigins: [],
    })).rejects.toMatchObject({
      code: 'CHAT_ERROR',
    })
  })

  it('should throw CHAT_ERROR on invalid response', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ notHtml: true }),
    })

    await expect(sendChat({
      endpoint: 'https://api.example.com/chat',
      messages: [],
      apiSpec: '{}',
      allowedOrigins: [],
    })).rejects.toMatchObject({
      code: 'CHAT_ERROR',
      message: expect.stringContaining('missing html'),
    })
  })

  it('should throw NETWORK_ERROR on timeout', async () => {
    global.fetch = vi.fn().mockImplementation(() => 
      new Promise((_, reject) => {
        setTimeout(() => reject(new DOMException('Aborted', 'AbortError')), 100)
      })
    )

    const promise = sendChat({
      endpoint: 'https://api.example.com/chat',
      messages: [],
      apiSpec: '{}',
      allowedOrigins: [],
      timeout: 50,
    })

    vi.advanceTimersByTime(100)

    await expect(promise).rejects.toMatchObject({
      code: 'NETWORK_ERROR',
      message: expect.stringContaining('timed out'),
    })
  })

  it('should throw NETWORK_ERROR on fetch failure', async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error('Network error'))

    await expect(sendChat({
      endpoint: 'https://api.example.com/chat',
      messages: [],
      apiSpec: '{}',
      allowedOrigins: [],
    })).rejects.toMatchObject({
      code: 'NETWORK_ERROR',
    })
  })

  it('should support external abort signal', async () => {
    const controller = new AbortController()
    
    global.fetch = vi.fn().mockImplementation(() => 
      new Promise((_, reject) => {
        controller.signal.addEventListener('abort', () => {
          reject(new DOMException('Aborted', 'AbortError'))
        })
      })
    )

    const promise = sendChat({
      endpoint: 'https://api.example.com/chat',
      messages: [],
      apiSpec: '{}',
      allowedOrigins: [],
      signal: controller.signal,
    })

    controller.abort()

    await expect(promise).rejects.toMatchObject({
      code: 'NETWORK_ERROR',
    })
  })
})
```

## Acceptance Criteria
- [ ] `sendChat` sends properly formatted POST request
- [ ] Request includes messages, apiSpec, context, and instructions
- [ ] Returns `ChatResponse` with html, title, warnings
- [ ] Throws `ByofError` with code `CHAT_ERROR` on HTTP errors
- [ ] Throws `ByofError` with code `CHAT_ERROR` on invalid response
- [ ] Throws `ByofError` with code `NETWORK_ERROR` on timeout
- [ ] Throws `ByofError` with code `NETWORK_ERROR` on fetch failure
- [ ] Supports external abort signal
- [ ] All unit tests pass
