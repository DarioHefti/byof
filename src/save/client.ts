import { TIMEOUTS } from '../constants'
import {
  listResponseSchema,
  loadResponseSchema,
  saveResponseSchema,
} from '../schemas'
import {
  type ByofLogger,
  type ByofMessage,
  ByofErrorCode,
  type ListRequest,
  type ListResponse,
  type LoadRequest,
  type LoadResponse,
  type SaveRequest,
  type SaveResponse,
  defaultLogger,
} from '../types'
import { fetchWithValidation } from '../utils'

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
    timeout = TIMEOUTS.SAVE_REQUEST_MS,
    signal,
    logger = defaultLogger,
  } = options

  logger.debug('Saving UI', {
    endpoint,
    htmlLength: html.length,
    hasMessages: messages !== undefined && messages.length > 0,
  })

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

  const { data: parsed } = await fetchWithValidation({
    endpoint,
    body: request,
    schema: saveResponseSchema,
    errorCode: ByofErrorCode.SAVE_ERROR,
    operationName: 'Save',
    timeout,
    signal,
    logger,
  })

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
    timeout = TIMEOUTS.SAVE_REQUEST_MS,
    signal,
    logger = defaultLogger,
  } = options

  logger.debug('Loading UI', {
    endpoint,
    id,
  })

  const request: LoadRequest = {
    id,
  }

  // Append /load to the endpoint
  const loadUrl = endpoint.endsWith('/')
    ? `${endpoint}load`
    : `${endpoint}/load`

  const { data: parsed } = await fetchWithValidation({
    endpoint: loadUrl,
    body: request,
    schema: loadResponseSchema,
    errorCode: ByofErrorCode.LOAD_ERROR,
    operationName: 'Load',
    timeout,
    signal,
    logger,
  })

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
    loadResponse.messages = parsed.messages.map((m) => ({
      role: m.role,
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
    timeout = TIMEOUTS.SAVE_REQUEST_MS,
    signal,
    logger = defaultLogger,
  } = options

  logger.debug('Listing saved UIs', {
    endpoint,
    projectId,
  })

  const request: ListRequest = {}

  // Only add optional fields if provided (exactOptionalPropertyTypes compliance)
  if (projectId !== undefined) {
    request.projectId = projectId
  }

  // Append /list to the endpoint
  const listUrl = endpoint.endsWith('/')
    ? `${endpoint}list`
    : `${endpoint}/list`

  const { data: parsed } = await fetchWithValidation({
    endpoint: listUrl,
    body: request,
    schema: listResponseSchema,
    errorCode: ByofErrorCode.LOAD_ERROR,
    operationName: 'List',
    timeout,
    signal,
    logger,
  })

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
}
