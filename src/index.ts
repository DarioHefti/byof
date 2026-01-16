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

import type { ByofInitOptions, ByofInstance } from './types'

/**
 * Create a BYOF instance
 *
 * @param options - Configuration options for the BYOF instance
 * @returns A BYOF instance with methods to control the UI
 */
export function createByof(_options: ByofInitOptions): ByofInstance {
  // Stub implementation - will be implemented in later tasks
  throw new Error('Not implemented yet')
}
