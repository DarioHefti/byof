/**
 * Library version, injected at build time from package.json.
 * Falls back to 'dev' if not built with tsup (e.g., in tests).
 */
declare const __BYOF_VERSION__: string | undefined

export const VERSION =
  typeof __BYOF_VERSION__ !== 'undefined' ? __BYOF_VERSION__ : '0.1.0'
