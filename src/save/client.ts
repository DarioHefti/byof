import {
  listResponseSchema,
  loadResponseSchema,
  saveResponseSchema,
} from '../schemas'
import {
  type ByofLogger,
  type ByofMessage,
  ByofErrorCode,
  ByofException,
  type ListRequest,
  type ListResponse,
  type LoadRequest,
  type LoadResponse,
  type SaveRequest,
  type SaveResponse,
  defaultLogger,
} from '../types'
import { combineAbortSignals, isAbortError } from '../utils'

// ============================================================================
// Shared Types
// ============================================================================

interface BaseRequestOptions {
  /** Base endpoint URL for save/load operations */
  endpoint: string
  /** Timeout in milliseconds. Default: 30000ms (30 seconds) */
  timeout?: number
  /** AbortSignal for cancellation */
  signal?: AbortSignal
  /** Logger for observability */
  logger?: ByofLogger
}

// ============================================================================
// Save
// ============================================================================

export interface SaveOptions extends BaseRequestOptions {
  /** Optional name for the saved UI */
  name?: string
  /** The generated HTML to save */
  html: string
  /** Chat message history */
  messages?: ByofMessage[]
  /** API specification used to generate the HTML */
  apiSpec?: string
  /** Context information */
  context?: {
    projectId?: string
    userId?: string
  }
  /** Metadata */
  meta?: {
    createdAt?: string
    byofVersion?: string
  }
}

/**
 * Save a generated UI to the backend
 * @returns Promise resolving to SaveResponse with the saved item ID
 * @throws ByofException with code 'SAVE_ERROR' or 'NETWORK_ERROR'
 */
export async function saveUI(options: SaveOptions): Promise<SaveResponse> {
  const {
    endpoint,
    name,
    html,
    messages,
    apiSpec,
    context,
    meta,
    timeout = 30000,
    signal,
    logger = defaultLogger,
  } = options

  logger.debug('Saving UI', {
    endpoint,
    htmlLength: html.length,
    hasMessages: messages !== undefined && messages.length > 0,
  })

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeout)

  const combinedSignal = signal
    ? combineAbortSignals(signal, controller.signal)
    : controller.signal

  try {
    const request: SaveRequest = {
      html,
    }

    // Only add optional fields if provided (exactOptionalPropertyTypes compliance)
    if (name !== undefined) {
      request.name = name
    }
    if (messages !== undefined) {
      request.messages = messages
    }
    if (apiSpec !== undefined) {
      request.apiSpec = apiSpec
    }
    if (context !== undefined) {
      request.context = context
    }
    if (meta !== undefined) {
      request.meta = meta
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
      logger.error('Save request HTTP error', {
        status: response.status,
        statusText: response.statusText,
      })
      throw new ByofException(
        ByofErrorCode.SAVE_ERROR,
        `Save request failed: ${response.status} ${response.statusText}`,
        { status: response.status, body: errorText }
      )
    }

    const data: unknown = await response.json()

    // Validate response with Zod schema
    const parseResult = saveResponseSchema.safeParse(data)

    if (!parseResult.success) {
      const errorMessage = parseResult.error.errors
        .map((e) => `${e.path.join('.')}: ${e.message}`)
        .join('; ')
      logger.error('Invalid save response', {
        errors: parseResult.error.errors,
      })
      throw new ByofException(
        ByofErrorCode.SAVE_ERROR,
        `Invalid response: ${errorMessage}`,
        parseResult.error
      )
    }

    const parsed = parseResult.data

    logger.info('Save completed', {
      id: parsed.id,
      name: parsed.name,
    })

    // Build response with exact types (exactOptionalPropertyTypes compliance)
    const saveResponse: SaveResponse = {
      id: parsed.id,
    }
    if (parsed.name !== undefined) {
      saveResponse.name = parsed.name
    }
    if (parsed.updatedAt !== undefined) {
      saveResponse.updatedAt = parsed.updatedAt
    }

    return saveResponse
  } catch (error: unknown) {
    clearTimeout(timeoutId)

    // Check for AbortError (timeout or external abort)
    if (isAbortError(error)) {
      logger.warn('Save request aborted or timed out')
      throw new ByofException(
        ByofErrorCode.NETWORK_ERROR,
        'Save request timed out or was aborted'
      )
    }

    if (error instanceof ByofException) {
      throw error
    }

    logger.error('Save request failed', { error })
    throw new ByofException(
      ByofErrorCode.NETWORK_ERROR,
      'Save request failed',
      error
    )
  }
}

// ============================================================================
// Load
// ============================================================================

export interface LoadOptions extends BaseRequestOptions {
  /** ID of the saved UI to load */
  id: string
}

/**
 * Load a previously saved UI from the backend
 * @returns Promise resolving to LoadResponse with the saved HTML and metadata
 * @throws ByofException with code 'LOAD_ERROR' or 'NETWORK_ERROR'
 */
export async function loadUI(options: LoadOptions): Promise<LoadResponse> {
  const {
    endpoint,
    id,
    timeout = 30000,
    signal,
    logger = defaultLogger,
  } = options

  logger.debug('Loading UI', {
    endpoint,
    id,
  })

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeout)

  const combinedSignal = signal
    ? combineAbortSignals(signal, controller.signal)
    : controller.signal

  try {
    const request: LoadRequest = {
      id,
    }

    // Append /load to the endpoint
    const loadUrl = endpoint.endsWith('/')
      ? `${endpoint}load`
      : `${endpoint}/load`

    const response = await fetch(loadUrl, {
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
      logger.error('Load request HTTP error', {
        status: response.status,
        statusText: response.statusText,
      })
      throw new ByofException(
        ByofErrorCode.LOAD_ERROR,
        `Load request failed: ${response.status} ${response.statusText}`,
        { status: response.status, body: errorText }
      )
    }

    const data: unknown = await response.json()

    // Validate response with Zod schema
    const parseResult = loadResponseSchema.safeParse(data)

    if (!parseResult.success) {
      const errorMessage = parseResult.error.errors
        .map((e) => `${e.path.join('.')}: ${e.message}`)
        .join('; ')
      logger.error('Invalid load response', {
        errors: parseResult.error.errors,
      })
      throw new ByofException(
        ByofErrorCode.LOAD_ERROR,
        `Invalid response: ${errorMessage}`,
        parseResult.error
      )
    }

    const parsed = parseResult.data

    logger.info('Load completed', {
      id: parsed.id,
      name: parsed.name,
      htmlLength: parsed.html.length,
    })

    // Build response with exact types (exactOptionalPropertyTypes compliance)
    const loadResponse: LoadResponse = {
      id: parsed.id,
      html: parsed.html,
    }
    if (parsed.name !== undefined) {
      loadResponse.name = parsed.name
    }
    if (parsed.messages !== undefined) {
      // Transform messages to ensure correct typing
      loadResponse.messages = parsed.messages.map((m) => ({
        role: m.role as 'user' | 'assistant' | 'system',
        content: m.content,
        ts: m.ts,
      }))
    }
    if (parsed.apiSpec !== undefined) {
      loadResponse.apiSpec = parsed.apiSpec
    }
    if (parsed.updatedAt !== undefined) {
      loadResponse.updatedAt = parsed.updatedAt
    }

    return loadResponse
  } catch (error: unknown) {
    clearTimeout(timeoutId)

    // Check for AbortError (timeout or external abort)
    if (isAbortError(error)) {
      logger.warn('Load request aborted or timed out')
      throw new ByofException(
        ByofErrorCode.NETWORK_ERROR,
        'Load request timed out or was aborted'
      )
    }

    if (error instanceof ByofException) {
      throw error
    }

    logger.error('Load request failed', { error })
    throw new ByofException(
      ByofErrorCode.NETWORK_ERROR,
      'Load request failed',
      error
    )
  }
}

// ============================================================================
// List
// ============================================================================

export interface ListOptions extends BaseRequestOptions {
  /** Optional project ID to filter by */
  projectId?: string
}

/**
 * List all saved UIs from the backend
 * @returns Promise resolving to ListResponse with array of saved items
 * @throws ByofException with code 'LOAD_ERROR' or 'NETWORK_ERROR'
 */
export async function listSavedUIs(
  options: ListOptions
): Promise<ListResponse> {
  const {
    endpoint,
    projectId,
    timeout = 30000,
    signal,
    logger = defaultLogger,
  } = options

  logger.debug('Listing saved UIs', {
    endpoint,
    projectId,
  })

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeout)

  const combinedSignal = signal
    ? combineAbortSignals(signal, controller.signal)
    : controller.signal

  try {
    const request: ListRequest = {}

    // Only add optional fields if provided (exactOptionalPropertyTypes compliance)
    if (projectId !== undefined) {
      request.projectId = projectId
    }

    // Append /list to the endpoint
    const listUrl = endpoint.endsWith('/')
      ? `${endpoint}list`
      : `${endpoint}/list`

    const response = await fetch(listUrl, {
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
      logger.error('List request HTTP error', {
        status: response.status,
        statusText: response.statusText,
      })
      throw new ByofException(
        ByofErrorCode.LOAD_ERROR,
        `List request failed: ${response.status} ${response.statusText}`,
        { status: response.status, body: errorText }
      )
    }

    const data: unknown = await response.json()

    // Validate response with Zod schema
    const parseResult = listResponseSchema.safeParse(data)

    if (!parseResult.success) {
      const errorMessage = parseResult.error.errors
        .map((e) => `${e.path.join('.')}: ${e.message}`)
        .join('; ')
      logger.error('Invalid list response', {
        errors: parseResult.error.errors,
      })
      throw new ByofException(
        ByofErrorCode.LOAD_ERROR,
        `Invalid response: ${errorMessage}`,
        parseResult.error
      )
    }

    const parsed = parseResult.data

    logger.info('List completed', {
      itemCount: parsed.items.length,
    })

    // Build response with exact types (exactOptionalPropertyTypes compliance)
    const listResponse: ListResponse = {
      items: parsed.items.map((item) => {
        const mappedItem: ListResponse['items'][number] = {
          id: item.id,
        }
        if (item.name !== undefined) {
          mappedItem.name = item.name
        }
        if (item.updatedAt !== undefined) {
          mappedItem.updatedAt = item.updatedAt
        }
        return mappedItem
      }),
    }

    return listResponse
  } catch (error: unknown) {
    clearTimeout(timeoutId)

    // Check for AbortError (timeout or external abort)
    if (isAbortError(error)) {
      logger.warn('List request aborted or timed out')
      throw new ByofException(
        ByofErrorCode.NETWORK_ERROR,
        'List request timed out or was aborted'
      )
    }

    if (error instanceof ByofException) {
      throw error
    }

    logger.error('List request failed', { error })
    throw new ByofException(
      ByofErrorCode.NETWORK_ERROR,
      'List request failed',
      error
    )
  }
}
