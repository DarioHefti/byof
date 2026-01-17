// CSP utilities
export {
  generateCsp,
  generateCspMetaTag,
  injectCspIntoHtml,
  isOriginAllowed,
} from './csp'

export type { CspOptions } from './csp'

// Sandbox runner utilities
export {
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
} from './runner'

export type {
  SandboxOptions,
  SandboxResult,
  IframeSandboxConfig,
} from './runner'

// Auth injection utilities
export {
  AUTH_GLOBAL_NAME,
  generateAuthScript,
  injectAuthIntoHtml,
  hasAuthInjection,
} from './auth'
