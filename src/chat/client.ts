import { TIMEOUTS } from '../constants'
import { chatResponseSchema } from '../schemas'
import {
  type ByofLogger,
  type ByofMessage,
  ByofErrorCode,
  type ChatRequest,
  type ChatResponse,
  defaultLogger,
} from '../types'
import { fetchWithValidation } from '../utils'

export interface SendChatOptions {
  endpoint: string
  messages: ByofMessage[]
  /** System prompt built by the library */
  systemPrompt: string
  /** API spec as JSON string (optional, for backend reference) */
  apiSpec?: string
  /** Current HTML state for iterative refinement (not stored in message history) */
  currentHtml?: string
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
    currentHtml,
    context,
    timeout = TIMEOUTS.CHAT_REQUEST_MS,
    signal,
    logger = defaultLogger,
  } = options

  logger.debug('Sending chat request', {
    endpoint,
    messageCount: messages.length,
    systemPromptLength: systemPrompt.length,
    hasCurrentHtml: !!currentHtml,
  })

  const request: ChatRequest = {
    messages: messages.map((m) => ({ role: m.role, content: m.content })),
    systemPrompt,
  }

  // Only add optional fields if provided (exactOptionalPropertyTypes compliance)
  if (apiSpec !== undefined) {
    request.apiSpec = apiSpec
  }
  if (currentHtml !== undefined) {
    request.currentHtml = currentHtml
  }
  if (context) {
    request.context = context
  }

  const { data: parsed } = await fetchWithValidation({
    endpoint,
    body: request,
    schema: chatResponseSchema,
    errorCode: ByofErrorCode.CHAT_ERROR,
    operationName: 'Chat',
    timeout,
    signal,
    logger,
  })

  // Normalize warnings (schema default handles undefined, this handles any edge cases)
  const warnings = parsed.warnings ?? []

  logger.info('Chat response received', {
    htmlLength: parsed.html.length,
    title: parsed.title,
    hasMessage: !!parsed.message,
    warningCount: warnings.length,
  })

  // Build response with exact types (exactOptionalPropertyTypes compliance)
  // Use != null to filter out both null and undefined (nullish schema values)
  const chatResponse: ChatResponse = {
    html: parsed.html,
  }
  if (parsed.title != null) {
    chatResponse.title = parsed.title
  }
  if (parsed.message != null) {
    chatResponse.message = parsed.message
  }
  if (warnings.length > 0) {
    chatResponse.warnings = warnings
  }

  return chatResponse
}
