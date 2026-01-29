/**
 * Main BYOF integration module
 *
 * This module provides the createByof() function that ties together
 * all the components: UI, chat, save/load, spec loading, and sandbox.
 */

import { sendChat } from '../chat'
import { buildSystemPrompt, getApiBaseUrl } from '../prompt'
import { injectAuthIntoHtml, loadIntoIframe, openInNewTab } from '../sandbox'
import { listSavedUIs, loadUI, saveUI } from '../save'
import { defaultHtmlResponseSchema } from '../schemas'
import { loadSpecFromUrl } from '../spec'
import {
  type AuthHeaders,
  type ByofError,
  type ByofInitOptions,
  type ByofInstance,
  type ByofLogger,
  type ByofMessage,
  ByofErrorCode,
  ByofException,
  type SavedByofRef,
  type TimeProvider,
  defaultLogger,
  defaultTimeProvider,
} from '../types'
import {
  type UIElements,
  type UIState,
  cleanupStyles,
  clearSandbox,
  createUIState,
  renderUI,
  toggleFullscreen,
  updateUI,
} from '../ui'
import { VERSION } from '../version'

// ============================================================================
// Internal State
// ============================================================================

interface ByofInternalState {
  options: ByofInitOptions
  elements: UIElements
  uiState: UIState
  apiSpec: string
  chatEndpoint: string
  saveEndpoint: string | null
  allowedOrigins: string[]
  logger: ByofLogger
  timeProvider: TimeProvider
  abortController: AbortController | null
  isDestroyed: boolean
}

// ============================================================================
// Main Factory Function
// ============================================================================

/**
 * Create a BYOF instance
 *
 * @param options - Configuration options for the BYOF instance
 * @returns A BYOF instance with methods to control the UI
 * @throws ByofException if initialization fails
 */
export function createByof(options: ByofInitOptions): ByofInstance {
  const logger = options.logger ?? defaultLogger
  const timeProvider = options.timeProvider ?? defaultTimeProvider

  logger.info('Creating BYOF instance', { version: VERSION })

  // Validate required options
  if (!options.mount || !(options.mount instanceof HTMLElement)) {
    throw new ByofException(
      ByofErrorCode.SANDBOX_ERROR,
      'mount must be a valid HTMLElement'
    )
  }

  if (!options.chatEndpoint) {
    throw new ByofException(
      ByofErrorCode.CHAT_ERROR,
      'chatEndpoint is required'
    )
  }

  // Determine allowed origins from sandbox config
  const allowedOrigins = options.sandbox?.allowlist ?? []

  // Initialize internal state
  const state: ByofInternalState = {
    options,
    elements: null as unknown as UIElements, // Will be set below
    uiState: createUIState(),
    apiSpec: options.apiSpec ?? '',
    chatEndpoint: options.chatEndpoint,
    saveEndpoint: options.saveEndpoint ?? null,
    allowedOrigins,
    logger,
    timeProvider,
    abortController: null,
    isDestroyed: false,
  }

  // Create UI callbacks
  const callbacks = {
    onSend: (message: string) => handleSend(state, message),
    onReset: () => handleReset(state),
    onSave: (name: string) => void handleSave(state, name),
    onLoad: (id: string) => void handleLoad(state, id),
    onFullscreen: () => handleFullscreen(state),
    onNewTab: () => handleNewTab(state),
  }

  // Render UI
  state.elements = renderUI(options.mount, options.theme, callbacks)

  // Load API spec from URL if provided
  if (options.apiSpecUrl && !options.apiSpec) {
    void loadApiSpec(state, options.apiSpecUrl)
  }

  // Load saved items if save endpoint is configured
  if (options.saveEndpoint) {
    void refreshSavedItems(state)
  }

  // Load default HTML if provided (URL takes precedence over string)
  if (options.defaultHtmlUrl) {
    void loadDefaultHtmlFromUrl(state, options.defaultHtmlUrl)
  } else if (options.defaultHtml) {
    void loadDefaultHtml(state, options.defaultHtml)
  }

  // Return public API
  return {
    destroy: () => destroy(state),
    setApiSpec: (spec: string) => setApiSpec(state, spec),
    setChatEndpoint: (url: string) => setChatEndpoint(state, url),
    setSaveEndpoint: (url: string) => setSaveEndpoint(state, url),
    saveCurrent: (name?: string) => saveCurrent(state, name),
    loadSaved: (id: string) => loadSaved(state, id),
    reset: () => handleReset(state),
  }
}

// ============================================================================
// Public API Implementations
// ============================================================================

function destroy(state: ByofInternalState): void {
  if (state.isDestroyed) {
    return
  }

  state.logger.info('Destroying BYOF instance')

  // Abort any pending requests
  if (state.abortController) {
    state.abortController.abort()
    state.abortController = null
  }

  // Remove UI from DOM
  if (state.elements.container.parentNode) {
    state.elements.container.parentNode.removeChild(state.elements.container)
  }

  // Cleanup styles
  cleanupStyles()

  state.isDestroyed = true
}

function setApiSpec(state: ByofInternalState, spec: string): void {
  assertNotDestroyed(state)
  state.apiSpec = spec
  state.logger.debug('API spec updated', { specLength: spec.length })
}

function setChatEndpoint(state: ByofInternalState, url: string): void {
  assertNotDestroyed(state)
  state.chatEndpoint = url
  state.logger.debug('Chat endpoint updated', { endpoint: url })
}

function setSaveEndpoint(state: ByofInternalState, url: string): void {
  assertNotDestroyed(state)
  state.saveEndpoint = url
  state.logger.debug('Save endpoint updated', { endpoint: url })

  // Refresh saved items with new endpoint
  void refreshSavedItems(state)
}

async function saveCurrent(
  state: ByofInternalState,
  name?: string
): Promise<SavedByofRef> {
  assertNotDestroyed(state)

  if (!state.saveEndpoint) {
    throw new ByofException(
      ByofErrorCode.SAVE_ERROR,
      'Save endpoint not configured'
    )
  }

  if (!state.uiState.currentHtml) {
    throw new ByofException(ByofErrorCode.SAVE_ERROR, 'No HTML to save')
  }

  state.logger.info('Saving current UI', { name })

  // Build save options with exactOptionalPropertyTypes compliance
  const saveOptions: Parameters<typeof saveUI>[0] = {
    endpoint: state.saveEndpoint,
    html: state.uiState.currentHtml,
    messages: state.uiState.messages,
    apiSpec: state.apiSpec,
    meta: {
      createdAt: state.timeProvider.isoString(),
      byofVersion: VERSION,
    },
    logger: state.logger,
  }

  // Only add optional fields if defined
  if (name !== undefined && name !== '') {
    saveOptions.name = name
  }

  const ctx = buildContext(state)
  if (ctx !== undefined) {
    saveOptions.context = ctx
  }

  const result = await saveUI(saveOptions)

  // Update state
  state.uiState.lastSavedId = result.id
  state.uiState.isDirty = false

  // Refresh saved items list
  await refreshSavedItems(state)

  // Call callback if provided
  if (state.options.onSaveComplete) {
    state.options.onSaveComplete(result)
  }

  return result
}

async function loadSaved(state: ByofInternalState, id: string): Promise<void> {
  assertNotDestroyed(state)

  if (!state.saveEndpoint) {
    throw new ByofException(
      ByofErrorCode.LOAD_ERROR,
      'Save endpoint not configured'
    )
  }

  state.logger.info('Loading saved UI', { id })

  setLoading(state, true)

  try {
    const result = await loadUI({
      endpoint: state.saveEndpoint,
      id,
      logger: state.logger,
    })

    // Update state
    state.uiState.currentHtml = result.html
    state.uiState.messages = result.messages ?? []
    state.uiState.lastSavedId = result.id
    state.uiState.isDirty = false

    if (result.apiSpec) {
      state.apiSpec = result.apiSpec
    }

    // Load HTML into sandbox (with auth injection if configured)
    await loadHtmlIntoSandboxWithAuth(state, result.html)

    // Update UI
    updateUI(state.elements, state.uiState)

    // Call callback if provided
    if (state.options.onLoadComplete) {
      const loadRef: SavedByofRef = { id: result.id }
      if (result.name !== undefined) {
        loadRef.name = result.name
      }
      if (result.updatedAt !== undefined) {
        loadRef.updatedAt = result.updatedAt
      }
      state.options.onLoadComplete(loadRef)
    }
  } catch (error: unknown) {
    handleError(state, error)
    throw error
  } finally {
    setLoading(state, false)
  }
}

// ============================================================================
// UI Event Handlers
// ============================================================================

function handleSend(state: ByofInternalState, message: string): void {
  assertNotDestroyed(state)

  if (!message.trim()) {
    return
  }

  state.logger.debug('Handling send', { messageLength: message.length })

  // Add user message to state
  const userMessage: ByofMessage = {
    role: 'user',
    content: message,
    ts: state.timeProvider.now(),
  }
  state.uiState.messages.push(userMessage)
  state.uiState.isDirty = true

  // Update UI immediately to show user message
  updateUI(state.elements, state.uiState)

  // Send chat request
  void sendChatRequest(state)
}

function handleReset(state: ByofInternalState): void {
  assertNotDestroyed(state)

  state.logger.info('Resetting BYOF state')

  // Abort any pending requests
  if (state.abortController) {
    state.abortController.abort()
    state.abortController = null
  }

  // Reset state
  state.uiState = createUIState()

  // Refresh saved items (keep the list)
  if (state.saveEndpoint) {
    void refreshSavedItems(state)
  }

  // Clear sandbox
  clearSandbox(state.elements)

  // Update UI
  updateUI(state.elements, state.uiState)
}

function handleFullscreen(state: ByofInternalState): void {
  assertNotDestroyed(state)
  toggleFullscreen(state.elements.sandboxContainer)
}

function handleNewTab(state: ByofInternalState): void {
  assertNotDestroyed(state)

  if (!state.uiState.currentHtml) {
    state.logger.warn('No HTML to open in new tab')
    return
  }

  openInNewTab(state.uiState.currentHtml, {
    allowedOrigins: state.allowedOrigins,
    logger: state.logger,
  })
}

async function handleSave(
  state: ByofInternalState,
  name: string
): Promise<void> {
  assertNotDestroyed(state)

  try {
    await saveCurrent(state, name || undefined)
  } catch (error: unknown) {
    handleError(state, error)
  }
}

async function handleLoad(state: ByofInternalState, id: string): Promise<void> {
  assertNotDestroyed(state)

  try {
    await loadSaved(state, id)
  } catch (error: unknown) {
    handleError(state, error)
  }
}

// ============================================================================
// Internal Helpers
// ============================================================================

async function sendChatRequest(state: ByofInternalState): Promise<void> {
  setLoading(state, true)
  clearError(state)

  // Create abort controller for this request
  state.abortController = new AbortController()

  try {
    // Check if auth is configured
    const hasAuth = state.options.getAuthHeaders !== undefined

    // Build system prompt using library or custom config
    const promptConfig = state.options.prompt
    const apiBaseUrl = getApiBaseUrl(state.allowedOrigins)
    const systemPrompt = buildSystemPrompt(
      {
        apiSpec: state.apiSpec || undefined,
        apiBaseUrl,
        allowedOrigins: state.allowedOrigins,
        hasAuth,
      },
      promptConfig
    )

    // Build chat options with exactOptionalPropertyTypes compliance
    const chatOptions: Parameters<typeof sendChat>[0] = {
      endpoint: state.chatEndpoint,
      messages: state.uiState.messages,
      systemPrompt,
      signal: state.abortController.signal,
      logger: state.logger,
    }

    // Only add optional fields if defined
    if (state.apiSpec) {
      chatOptions.apiSpec = state.apiSpec
    }

    // Include current HTML for iterative refinement (not stored in message history)
    if (state.uiState.currentHtml) {
      chatOptions.currentHtml = state.uiState.currentHtml
    }

    const ctx = buildContext(state)
    if (ctx !== undefined) {
      chatOptions.context = ctx
    }

    const response = await sendChat(chatOptions)

    // Add assistant message only if there's a message from the AI
    if (response.message) {
      const assistantMessage: ByofMessage = {
        role: 'assistant',
        content: response.message,
        ts: state.timeProvider.now(),
      }
      state.uiState.messages.push(assistantMessage)
    }

    // Update HTML state
    state.uiState.currentHtml = response.html
    state.uiState.isDirty = true

    // Load HTML into sandbox (with auth injection if configured)
    await loadHtmlIntoSandboxWithAuth(state, response.html)

    // Call callback if provided
    if (state.options.onHtmlGenerated) {
      state.options.onHtmlGenerated(response.html, response.title)
    }

    // Log any warnings
    if (response.warnings && response.warnings.length > 0) {
      state.logger.warn('Chat response warnings', {
        warnings: response.warnings,
      })
    }
  } catch (error: unknown) {
    handleError(state, error)
  } finally {
    state.abortController = null
    setLoading(state, false)
    updateUI(state.elements, state.uiState)
  }
}

async function loadApiSpec(
  state: ByofInternalState,
  url: string
): Promise<void> {
  state.logger.info('Loading API spec from URL', { url })

  try {
    const spec = await loadSpecFromUrl(url, {
      logger: state.logger,
    })

    state.apiSpec = spec
    state.logger.info('API spec loaded', { specLength: spec.length })
  } catch (error: unknown) {
    handleError(state, error)
  }
}

/**
 * Load default HTML string directly into sandbox
 */
async function loadDefaultHtml(
  state: ByofInternalState,
  html: string
): Promise<void> {
  state.logger.info('Loading default HTML', { htmlLength: html.length })

  try {
    // Load into sandbox first (with auth injection if configured)
    // Only set state after successful load to avoid inconsistency
    await loadHtmlIntoSandboxWithAuth(state, html)

    // Set state only after successful sandbox load
    state.uiState.currentHtml = html

    // Update UI to show sandbox content
    updateUI(state.elements, state.uiState)

    state.logger.info('Default HTML loaded successfully')
  } catch (error: unknown) {
    // Don't set currentHtml if load failed - state remains consistent
    handleError(state, error)
  }
}

/**
 * Fetch default HTML from URL and load into sandbox
 */
async function loadDefaultHtmlFromUrl(
  state: ByofInternalState,
  url: string
): Promise<void> {
  state.logger.info('Loading default HTML from URL', { url })

  try {
    const response = await fetch(url)

    if (!response.ok) {
      throw new ByofException(
        ByofErrorCode.NETWORK_ERROR,
        `Failed to fetch default HTML: ${response.status} ${response.statusText}`
      )
    }

    // Parse and validate response with schema
    const json: unknown = await response.json()
    const result = defaultHtmlResponseSchema.safeParse(json)

    if (!result.success) {
      throw new ByofException(
        ByofErrorCode.NETWORK_ERROR,
        `Invalid default HTML response: ${result.error.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join(', ')}`
      )
    }

    const data = result.data

    state.logger.debug('Default HTML fetched', {
      htmlLength: data.html.length,
      title: data.title,
    })

    // Load into sandbox
    await loadDefaultHtml(state, data.html)
  } catch (error: unknown) {
    handleError(state, error)
  }
}

async function refreshSavedItems(state: ByofInternalState): Promise<void> {
  if (!state.saveEndpoint) {
    return
  }

  try {
    // Build list options with exactOptionalPropertyTypes compliance
    const listOptions: Parameters<typeof listSavedUIs>[0] = {
      endpoint: state.saveEndpoint,
      logger: state.logger,
    }

    if (state.options.projectId !== undefined) {
      listOptions.projectId = state.options.projectId
    }

    const result = await listSavedUIs(listOptions)

    // Map items with exactOptionalPropertyTypes compliance
    state.uiState.savedItems = result.items.map((item) => {
      const savedItem: { id: string; name?: string; updatedAt?: string } = {
        id: item.id,
      }
      if (item.name !== undefined) {
        savedItem.name = item.name
      }
      if (item.updatedAt !== undefined) {
        savedItem.updatedAt = item.updatedAt
      }
      return savedItem
    })

    updateUI(state.elements, state.uiState)
  } catch (error: unknown) {
    // Don't show error for failed refresh, just log it
    state.logger.warn('Failed to refresh saved items', { error })
  }
}

/**
 * Load HTML into sandbox with optional auth header injection
 * @throws Re-throws errors after handling so callers can respond appropriately
 */
async function loadHtmlIntoSandboxWithAuth(
  state: ByofInternalState,
  html: string
): Promise<void> {
  try {
    let processedHtml = html

    // Inject auth headers if callback is configured
    if (state.options.getAuthHeaders) {
      state.logger.debug('Getting auth headers for sandbox')
      const authHeaders = await resolveAuthHeaders(state)
      if (Object.keys(authHeaders).length > 0) {
        processedHtml = injectAuthIntoHtml(html, authHeaders)
        state.logger.debug('Auth headers injected into HTML', {
          headerCount: Object.keys(authHeaders).length,
        })
      }
    }

    loadIntoIframe({
      iframe: state.elements.sandboxIframe,
      html: processedHtml,
      options: {
        allowedOrigins: state.allowedOrigins,
        logger: state.logger,
      },
    })
  } catch (error: unknown) {
    // Handle error (logs, shows in UI, calls callback)
    handleError(state, error)
    // Re-throw so callers can respond (e.g., not update state)
    throw error
  }
}

/**
 * Resolve auth headers from callback (sync or async)
 */
async function resolveAuthHeaders(
  state: ByofInternalState
): Promise<AuthHeaders> {
  if (!state.options.getAuthHeaders) {
    return {}
  }

  try {
    const result = state.options.getAuthHeaders()
    // Handle both sync and async returns
    return result instanceof Promise ? await result : result
  } catch (error: unknown) {
    state.logger.error('Failed to get auth headers', { error })
    return {}
  }
}

function buildContext(
  state: ByofInternalState
): { projectId?: string; userId?: string } | undefined {
  const ctx: { projectId?: string; userId?: string } = {}

  if (state.options.projectId !== undefined) {
    ctx.projectId = state.options.projectId
  }

  if (state.options.userId !== undefined) {
    ctx.userId = state.options.userId
  }

  return Object.keys(ctx).length > 0 ? ctx : undefined
}

function setLoading(state: ByofInternalState, isLoading: boolean): void {
  state.uiState.isLoading = isLoading
  updateUI(state.elements, state.uiState)
}

function showError(state: ByofInternalState, message: string): void {
  state.uiState.error = message
  updateUI(state.elements, state.uiState)
}

function clearError(state: ByofInternalState): void {
  state.uiState.error = null
  updateUI(state.elements, state.uiState)
}

function handleError(state: ByofInternalState, error: unknown): void {
  let byofError: ByofError

  if (error instanceof ByofException) {
    byofError = error.toByofError()
  } else if (error instanceof Error) {
    byofError = {
      code: ByofErrorCode.NETWORK_ERROR,
      message: error.message,
      details: error,
    }
  } else {
    byofError = {
      code: ByofErrorCode.NETWORK_ERROR,
      message: 'An unknown error occurred',
      details: error,
    }
  }

  state.logger.error('Error occurred', { error: byofError })
  showError(state, byofError.message)

  // Call error callback if provided
  if (state.options.onError) {
    state.options.onError(byofError)
  }
}

function assertNotDestroyed(state: ByofInternalState): void {
  if (state.isDestroyed) {
    throw new ByofException(
      ByofErrorCode.SANDBOX_ERROR,
      'BYOF instance has been destroyed'
    )
  }
}
