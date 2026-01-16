// ============================================================================
// Configuration Types
// ============================================================================

/** Theme configuration for UI customization */
export interface ByofTheme {
  // CSS variable overrides
  primaryColor?: string
  backgroundColor?: string
  textColor?: string
  borderColor?: string
  errorColor?: string
  successColor?: string

  // Typography
  fontFamily?: string
  fontSize?: string

  // Spacing
  borderRadius?: string
  padding?: string

  // Custom CSS variables (key without -- prefix, value)
  customVariables?: Record<string, string>
}

/** Sandbox configuration for generated HTML security */
export interface ByofSandboxOptions {
  /** Allowed origins for API calls from generated HTML */
  allowlist?: string[]
}

/** Callback types for lifecycle events */
export interface ByofCallbacks {
  onHtmlGenerated?: (html: string, title?: string) => void
  onError?: (error: ByofError) => void
  onSaveComplete?: (ref: SavedByofRef) => void
  onLoadComplete?: (ref: SavedByofRef) => void
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
  /** Project identifier for context */
  projectId?: string
  /** User identifier for context */
  userId?: string
  /** Sandbox configuration */
  sandbox?: ByofSandboxOptions
  /** Theme configuration */
  theme?: ByofTheme

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
  apiSpec: string
  context?: {
    projectId?: string
    userId?: string
  }
  instructions: {
    outputFormat: 'single_html'
    allowedOrigins: string[]
  }
}

/** Response from the chat endpoint */
export interface ChatResponse {
  html: string
  title?: string
  warnings?: string[]
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
