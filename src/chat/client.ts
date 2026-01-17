import { chatResponseSchema } from '../schemas'
import {
  type ByofLogger,
  type ByofMessage,
  ByofErrorCode,
  ByofException,
  type ChatRequest,
  type ChatResponse,
  defaultLogger,
} from '../types'

export interface SendChatOptions {
  endpoint: string
  messages: ByofMessage[]
  /** System prompt built by the library */
  systemPrompt: string
  /** API spec as JSON string (optional, for backend reference) */
  apiSpec?: string
  context?: {
    projectId?: string
    userId?: string
  }
  /** Timeout in milliseconds. Default: 300000ms (5 minutes) */
  timeout?: number
  /** AbortSignal for cancellation */
  signal?: AbortSignal
  /** Logger for observability */
  logger?: ByofLogger
}

/**
 * Send a chat request to the backend endpoint
 * @returns Promise resolving to ChatResponse with generated HTML
 * @throws ByofException with code 'CHAT_ERROR' or 'NETWORK_ERROR'
 */
export async function sendChat(
  options: SendChatOptions
): Promise<ChatResponse> {
  const {
    endpoint,
    messages,
    systemPrompt,
    apiSpec,
    context,
    timeout = 300000,
    signal,
    logger = defaultLogger,
  } = options

  logger.debug('Sending chat request', {
    endpoint,
    messageCount: messages.length,
    systemPromptLength: systemPrompt.length,
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
      messages: messages.map((m) => ({ role: m.role, content: m.content })),
      systemPrompt,
    }

    // Only add optional fields if provided (exactOptionalPropertyTypes compliance)
    if (apiSpec !== undefined) {
      request.apiSpec = apiSpec
    }
    if (context) {
      request.context = context
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
      throw new ByofException(
        ByofErrorCode.CHAT_ERROR,
        `Chat request failed: ${response.status} ${response.statusText}`,
        { status: response.status, body: errorText }
      )
    }

    const data: unknown = await response.json()

    // Validate response with Zod schema
    const parseResult = chatResponseSchema.safeParse(data)

    if (!parseResult.success) {
      const errorMessage = parseResult.error.errors
        .map((e) => `${e.path.join('.')}: ${e.message}`)
        .join('; ')
      logger.error('Invalid chat response', {
        errors: parseResult.error.errors,
      })
      throw new ByofException(
        ByofErrorCode.CHAT_ERROR,
        `Invalid response: ${errorMessage}`,
        parseResult.error
      )
    }

    const parsed = parseResult.data

    logger.info('Chat response received', {
      htmlLength: parsed.html.length,
      title: parsed.title,
      warningCount: parsed.warnings?.length ?? 0,
    })

    // Build response with exact types (exactOptionalPropertyTypes compliance)
    const chatResponse: ChatResponse = {
      html: parsed.html,
    }
    if (parsed.title !== undefined) {
      chatResponse.title = parsed.title
    }
    if (parsed.warnings !== undefined) {
      chatResponse.warnings = parsed.warnings
    }

    return chatResponse
  } catch (error: unknown) {
    clearTimeout(timeoutId)

    if (error instanceof Error && error.name === 'AbortError') {
      logger.warn('Chat request aborted or timed out')
      throw new ByofException(
        ByofErrorCode.NETWORK_ERROR,
        'Chat request timed out or was aborted'
      )
    }

    if (error instanceof ByofException) {
      throw error
    }

    logger.error('Chat request failed', { error })
    throw new ByofException(
      ByofErrorCode.NETWORK_ERROR,
      'Chat request failed',
      error
    )
  }
}

/**
 * Combine two AbortSignals into one
 */
function combineAbortSignals(
  signal1: AbortSignal,
  signal2: AbortSignal
): AbortSignal {
  const controller = new AbortController()

  const abort = () => controller.abort()
  signal1.addEventListener('abort', abort)
  signal2.addEventListener('abort', abort)

  // If either signal is already aborted, abort immediately
  if (signal1.aborted || signal2.aborted) {
    controller.abort()
  }

  return controller.signal
}
