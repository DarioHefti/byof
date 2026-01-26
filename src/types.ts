// ============================================================================
// Configuration Types
// ============================================================================

/**
 * Theme configuration for UI customization.
 *
 * All colors support any valid CSS color value.
 *
 * @example
 * // Dark theme
 * {
 *   primaryColor: '#6c5ce7',
 *   backgroundColor: '#1a1a2e',
 *   textColor: '#e0e0e0',
 *   borderColor: '#3a3a5e',
 *   customVariables: {
 *     'byof-bg-secondary': '#2a2a4e',
 *     'byof-error-bg': '#3a2020',
 *   }
 * }
 */
export interface ByofTheme {
  // CSS variable overrides
  /** Primary accent color (buttons, links, focus states) */
  primaryColor?: string
  /** Main background color */
  backgroundColor?: string
  /** Primary text color */
  textColor?: string
  /** Border color for inputs, dividers */
  borderColor?: string
  /** Error text and border color */
  errorColor?: string
  /** Success indicator color */
  successColor?: string

  // Typography
  fontFamily?: string
  fontSize?: string

  // Spacing
  borderRadius?: string
  padding?: string

  /**
   * Custom CSS variables (key without -- prefix, value).
   *
   * Available variables for theming:
   * - `byof-bg-secondary`: Secondary background (inputs, iframe container)
   * - `byof-text-muted`: Muted/secondary text color
   * - `byof-error-bg`: Error message background color
   */
  customVariables?: Record<string, string>
}

/** Sandbox configuration for generated HTML security */
export interface ByofSandboxOptions {
  /** Allowed origins for API calls from generated HTML */
  allowlist?: string[]
}

/** Auth headers type - simple key-value pairs */
export type AuthHeaders = Record<string, string>

/** Callback to get auth headers for API calls in generated HTML */
export type GetAuthHeadersFn = () => AuthHeaders | Promise<AuthHeaders>

/** Callback types for lifecycle events */
export interface ByofCallbacks {
  onHtmlGenerated?: (html: string, title?: string) => void
  onError?: (error: ByofError) => void
  onSaveComplete?: (ref: SavedByofRef) => void
  onLoadComplete?: (ref: SavedByofRef) => void
}

/** Options for customizing the LLM system prompt */
export interface ByofPromptConfig {
  /** Completely replace the default system prompt */
  systemPrompt?: string
  /** Append additional instructions to the default prompt */
  systemPromptSuffix?: string
  /** Custom prompt builder function */
  buildSystemPrompt?: (options: {
    apiSpec?: string | undefined
    apiBaseUrl?: string | undefined
    allowedOrigins?: string[] | undefined
  }) => string
}

/** Main initialization options */
export interface ByofInitOptions extends ByofCallbacks {
  /** The DOM element to mount the UI into */
  mount: HTMLElement
  /** Chat endpoint URL */
  chatEndpoint: string
  /** Save/load endpoint URL (optional) */
  saveEndpoint?: string
  /** Direct JSON string of the API spec */
  apiSpec?: string
  /** URL to fetch JSON spec from */
  apiSpecUrl?: string
  /** Default HTML to show in sandbox on initialization */
  defaultHtml?: string
  /** URL to fetch default HTML from (takes precedence over defaultHtml) */
  defaultHtmlUrl?: string
  /** Project identifier for context */
  projectId?: string
  /** User identifier for context */
  userId?: string
  /** Sandbox configuration */
  sandbox?: ByofSandboxOptions
  /** Theme configuration */
  theme?: ByofTheme
  /** System prompt customization */
  prompt?: ByofPromptConfig

  /**
   * Callback to get auth headers for API calls in generated HTML.
   * Called before each HTML load to support token refresh.
   *
   * @example
   * // JWT token
   * getAuthHeaders: () => ({
   *   'Authorization': `Bearer ${localStorage.getItem('token')}`
   * })
   *
   * @example
   * // Async with refresh
   * getAuthHeaders: async () => {
   *   await authService.refreshIfNeeded()
   *   return { 'Authorization': `Bearer ${authService.token}` }
   * }
   *
   * @example
   * // API Key
   * getAuthHeaders: () => ({ 'X-API-Key': 'sk-...' })
   */
  getAuthHeaders?: GetAuthHeadersFn

  /** Pluggable logger for observability */
  logger?: ByofLogger

  /** Injectable time provider for determinism */
  timeProvider?: TimeProvider
}

// ============================================================================
// Message Types
// ============================================================================

/** A single chat message */
export interface ByofMessage {
  role: 'user' | 'assistant' | 'system'
  content: string
  /** Unix timestamp in milliseconds */
  ts: number
}

// ============================================================================
// Chat Endpoint Types (export for backend developers)
// ============================================================================

/** Request payload sent to the chat endpoint */
export interface ChatRequest {
  messages: Array<{ role: string; content: string }>
  /** System prompt for the LLM (built by the library) */
  systemPrompt: string
  /** API spec as JSON string (for reference, also embedded in systemPrompt) */
  apiSpec?: string
  context?: {
    projectId?: string
    userId?: string
  }
}

/** Response from the chat endpoint */
export interface ChatResponse {
  html: string
  title?: string
  warnings?: string[]
}

/** Response from the default HTML endpoint */
export interface DefaultHtmlResponse {
  html: string
  title?: string
}

// ============================================================================
// Save/Load Endpoint Types (export for backend developers)
// ============================================================================

/** Request payload for saving a generated UI */
export interface SaveRequest {
  name?: string
  html: string
  messages?: ByofMessage[]
  apiSpec?: string
  context?: {
    projectId?: string
    userId?: string
  }
  meta?: {
    createdAt?: string
    byofVersion?: string
  }
}

/** Response from the save endpoint */
export interface SaveResponse {
  id: string
  name?: string
  updatedAt?: string
}

/** Request payload for loading a saved UI */
export interface LoadRequest {
  id: string
}

/** Response from the load endpoint */
export interface LoadResponse {
  id: string
  name?: string
  html: string
  messages?: ByofMessage[]
  apiSpec?: string
  updatedAt?: string
}

/** Request payload for listing saved UIs */
export interface ListRequest {
  projectId?: string
}

/** Response from the list endpoint */
export interface ListResponse {
  items: Array<{
    id: string
    name?: string
    updatedAt?: string
  }>
}

/** Reference to a saved BYOF UI */
export type SavedByofRef = SaveResponse

// ============================================================================
// Error Types
// ============================================================================

/** Error codes as const object for exhaustive switch checking */
export const ByofErrorCode = {
  CHAT_ERROR: 'CHAT_ERROR',
  SAVE_ERROR: 'SAVE_ERROR',
  LOAD_ERROR: 'LOAD_ERROR',
  SPEC_ERROR: 'SPEC_ERROR',
  SANDBOX_ERROR: 'SANDBOX_ERROR',
  NETWORK_ERROR: 'NETWORK_ERROR',
} as const

export type ByofErrorCode = (typeof ByofErrorCode)[keyof typeof ByofErrorCode]

/** Structured error type */
export interface ByofError {
  code: ByofErrorCode
  message: string
  details?: unknown
}

/**
 * Error class that implements ByofError interface
 * Use this when throwing errors to satisfy ESLint's only-throw-error rule
 */
export class ByofException extends Error implements ByofError {
  readonly code: ByofErrorCode
  readonly details?: unknown

  constructor(code: ByofErrorCode, message: string, details?: unknown) {
    super(message)
    this.name = 'ByofException'
    this.code = code
    this.details = details

    // Maintains proper stack trace for where our error was thrown (only in V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, ByofException)
    }
  }

  /** Convert to plain ByofError object */
  toByofError(): ByofError {
    return {
      code: this.code,
      message: this.message,
      details: this.details,
    }
  }
}

// ============================================================================
// Logger Interface (Pluggable Observability)
// ============================================================================

/** Logger interface for pluggable observability */
export interface ByofLogger {
  debug(message: string, context?: Record<string, unknown>): void
  info(message: string, context?: Record<string, unknown>): void
  warn(message: string, context?: Record<string, unknown>): void
  error(message: string, context?: Record<string, unknown>): void
}

/** Default console logger */
export const defaultLogger: ByofLogger = {
  debug: (msg, ctx) => console.debug(`[BYOF] ${msg}`, ctx ?? ''),
  info: (msg, ctx) => console.info(`[BYOF] ${msg}`, ctx ?? ''),
  warn: (msg, ctx) => console.warn(`[BYOF] ${msg}`, ctx ?? ''),
  error: (msg, ctx) => console.error(`[BYOF] ${msg}`, ctx ?? ''),
}

/** No-op logger for silent operation */
export const noopLogger: ByofLogger = {
  debug: () => {},
  info: () => {},
  warn: () => {},
  error: () => {},
}

// ============================================================================
// Time Provider (Injectable for Determinism)
// ============================================================================

/** Time provider interface for injectable time */
export interface TimeProvider {
  /** Returns current Unix timestamp in milliseconds */
  now(): number
  /** Returns current time as ISO 8601 string */
  isoString(): string
}

/** Default time provider using Date */
export const defaultTimeProvider: TimeProvider = {
  now: () => Date.now(),
  isoString: () => new Date().toISOString(),
}

// ============================================================================
// Instance Type
// ============================================================================

/** The BYOF instance returned from createByof */
export interface ByofInstance {
  /** Clean up and remove the UI */
  destroy(): void
  /** Update the API specification */
  setApiSpec(spec: string): void
  /** Update the chat endpoint URL */
  setChatEndpoint(url: string): void
  /** Update the save endpoint URL */
  setSaveEndpoint(url: string): void
  /** Save the current UI state */
  saveCurrent(name?: string): Promise<SavedByofRef>
  /** Load a previously saved UI */
  loadSaved(id: string): Promise<void>
  /** Reset to initial state */
  reset(): void
}
