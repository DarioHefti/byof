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
  ByofErrorCode,
  ByofMessage,
  ByofLogger,
  defaultLogger,
} from '../types'
import { chatResponseSchema } from '../schemas'

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
  logger?: ByofLogger
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
    logger = defaultLogger,
  } = options

  logger.debug('Sending chat request', { 
    endpoint, 
    messageCount: messages.length,
    allowedOrigins,
  })

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
      logger.error('Chat request HTTP error', { 
        status: response.status, 
        statusText: response.statusText,
      })
      throw createChatError(
        `Chat request failed: ${response.status} ${response.statusText}`,
        { status: response.status, body: errorText }
      )
    }

    const data: unknown = await response.json()
    
    // Validate response with Zod schema
    const parseResult = chatResponseSchema.safeParse(data)
    
    if (!parseResult.success) {
      const errorMessage = parseResult.error.errors
        .map(e => `${e.path.join('.')}: ${e.message}`)
        .join('; ')
      logger.error('Invalid chat response', { errors: parseResult.error.errors })
      throw createChatError(`Invalid response: ${errorMessage}`, parseResult.error)
    }

    logger.info('Chat response received', { 
      htmlLength: parseResult.data.html.length,
      title: parseResult.data.title,
      warningCount: parseResult.data.warnings?.length ?? 0,
    })

    return parseResult.data
  } catch (error: unknown) {
    clearTimeout(timeoutId)
    
    if (error instanceof Error && error.name === 'AbortError') {
      logger.warn('Chat request aborted or timed out')
      throw createNetworkError('Chat request timed out or was aborted')
    }
    
    if (isByofError(error)) {
      throw error
    }
    
    logger.error('Chat request failed', { error })
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
    code: ByofErrorCode.CHAT_ERROR,
    message,
    details,
  }
}

function createNetworkError(message: string, details?: unknown): ByofError {
  return {
    code: ByofErrorCode.NETWORK_ERROR,
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

import { noopLogger } from '../types'

import { sendChat } from './client'

// Use noop logger in tests to avoid console noise
const testLogger = noopLogger

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
      logger: testLogger,
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
      logger: testLogger,
    })).rejects.toMatchObject({
      code: 'CHAT_ERROR',
    })
  })

  it('should throw CHAT_ERROR on invalid response (Zod validation)', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ notHtml: true }),
    })

    await expect(sendChat({
      endpoint: 'https://api.example.com/chat',
      messages: [],
      apiSpec: '{}',
      allowedOrigins: [],
      logger: testLogger,
    })).rejects.toMatchObject({
      code: 'CHAT_ERROR',
      message: expect.stringContaining('Invalid response'),
    })
  })

  it('should throw CHAT_ERROR when html is empty string', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ html: '' }),
    })

    await expect(sendChat({
      endpoint: 'https://api.example.com/chat',
      messages: [],
      apiSpec: '{}',
      allowedOrigins: [],
      logger: testLogger,
    })).rejects.toMatchObject({
      code: 'CHAT_ERROR',
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
      logger: testLogger,
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
      logger: testLogger,
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
      logger: testLogger,
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
- [ ] Response is validated with Zod schema
- [ ] Throws `ByofError` with code `CHAT_ERROR` on HTTP errors
- [ ] Throws `ByofError` with code `CHAT_ERROR` on invalid response
- [ ] Throws `ByofError` with code `NETWORK_ERROR` on timeout
- [ ] Throws `ByofError` with code `NETWORK_ERROR` on fetch failure
- [ ] Supports external abort signal
- [ ] Supports pluggable logger via options
- [ ] All unit tests pass
