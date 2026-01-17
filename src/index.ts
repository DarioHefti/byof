/**
 * BYOF - Bring Your Own Frontend
 *
 * A TypeScript library for generating custom frontend UIs through chat-based LLM interaction.
 *
 * @example
 * ```typescript
 * import { createByof } from 'byof'
 *
 * const byof = createByof({
 *   mount: document.getElementById('app')!,
 *   chatEndpoint: '/api/chat',
 *   onHtmlGenerated: (html) => console.log('Generated!', html),
 * })
 *
 * // Cleanup when done
 * byof.destroy()
 * ```
 *
 * @packageDocumentation
 */

// =============================================================================
// Main API - What most developers need
// =============================================================================

/** Main factory function to create a BYOF instance */
export { createByof } from './core'

/** Library version */
export { VERSION } from './version'

// =============================================================================
// Core Types - Required for TypeScript users
// =============================================================================

export type {
  // Initialization
  ByofInitOptions,
  ByofInstance,
  ByofTheme,
  ByofSandboxOptions,
  ByofCallbacks,
  ByofPromptConfig,

  // Messages
  ByofMessage,

  // Error handling
  ByofError,

  // Auth
  AuthHeaders,
  GetAuthHeadersFn,

  // Backend contract types (for implementing backends)
  ChatRequest,
  ChatResponse,
  SaveRequest,
  SaveResponse,
  LoadRequest,
  LoadResponse,
  ListRequest,
  ListResponse,
  SavedByofRef,

  // Observability
  ByofLogger,
  TimeProvider,
} from './types'

// Export the error code const and exception class (needed for error handling)
export {
  ByofErrorCode,
  ByofException,
  defaultLogger,
  noopLogger,
} from './types'

// =============================================================================
// Advanced API - For customization and backend builders
// =============================================================================

// Prompt building (for custom prompt customization)
export { buildSystemPrompt, buildDefaultPrompt, getApiBaseUrl } from './prompt'
export type { PromptOptions, PromptConfig } from './prompt'

// Zod schemas (for backend response validation)
export {
  chatResponseSchema,
  saveResponseSchema,
  loadResponseSchema,
  listResponseSchema,
  openApiSpecSchema,
} from './schemas'

export type {
  ChatResponseParsed,
  SaveResponseParsed,
  LoadResponseParsed,
  ListResponseParsed,
  OpenApiSpecParsed,
} from './schemas'

// =============================================================================
// Low-level API - For advanced customization (rarely needed)
// =============================================================================

// Direct API clients (if not using createByof)
export { sendChat } from './chat'
export type { SendChatOptions } from './chat'

export { saveUI, loadUI, listSavedUIs } from './save'
export type { SaveOptions, LoadOptions, ListOptions } from './save'

// Spec loading
export { loadSpecFromUrl, normalizeSpec, loadAndNormalizeSpec } from './spec'
export type { NormalizedSpec, LoadSpecOptions } from './spec'

// Sandbox utilities
export {
  prepareSandboxHtml,
  loadIntoIframe,
  openInNewTab,
  downloadHtml,
  validateHtml,
} from './sandbox'

export type {
  SandboxOptions,
  SandboxResult,
  IframeSandboxConfig,
} from './sandbox'
