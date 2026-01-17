// Re-export all types
export * from './types'

// Re-export version
export { VERSION } from './version'

// Re-export schemas for runtime validation
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

// Re-export UI components (internal use, also available for advanced usage)
export {
  renderUI,
  cleanupStyles,
  createUIState,
  updateUI,
  appendMessage,
  clearMessages,
  showError,
  clearError,
  loadHtmlIntoSandbox,
  clearSandbox,
  toggleFullscreen,
  styles,
} from './ui'

export type { UIElements, UICallbacks, UIState, SavedItem } from './ui'

// Re-export spec loader
export { loadSpecFromUrl, normalizeSpec, loadAndNormalizeSpec } from './spec'

export type { NormalizedSpec, LoadSpecOptions } from './spec'

// Re-export chat client
export { sendChat } from './chat'

export type { SendChatOptions } from './chat'

// Re-export save/load client
export { saveUI, loadUI, listSavedUIs } from './save'

export type { SaveOptions, LoadOptions, ListOptions } from './save'

// Re-export sandbox utilities
export {
  generateCsp,
  generateCspMetaTag,
  injectCspIntoHtml,
  isOriginAllowed,
  prepareSandboxHtml,
  loadIntoIframe,
  configureSandboxAttributes,
  openInNewTab,
  downloadHtml,
  extractHtmlFromIframe,
  clearIframe,
  isIframeEmpty,
  validateHtml,
  basicSanitize,
  AUTH_GLOBAL_NAME,
  generateAuthScript,
  injectAuthIntoHtml,
  hasAuthInjection,
} from './sandbox'

export type {
  CspOptions,
  SandboxOptions,
  SandboxResult,
  IframeSandboxConfig,
} from './sandbox'

// Re-export prompt builder utilities
export { buildSystemPrompt, buildDefaultPrompt, getApiBaseUrl } from './prompt'

export type { PromptOptions, PromptConfig } from './prompt'

// Re-export main factory function
export { createByof } from './core'
