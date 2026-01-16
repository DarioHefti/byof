# Task 02: Core Types and API Definition

## Objective
Define all TypeScript types and the public API surface for the BYOF library.

## Requirements

### 1. Create `src/types.ts` with all type definitions

#### Configuration Types
```typescript
// Theme configuration
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

// Sandbox configuration
export interface ByofSandboxOptions {
  allowlist?: string[]  // Allowed origins for API calls from generated HTML
}

// Callback types
export interface ByofCallbacks {
  onHtmlGenerated?: (html: string, title?: string) => void
  onError?: (error: ByofError) => void
  onSaveComplete?: (ref: SavedByofRef) => void
  onLoadComplete?: (ref: SavedByofRef) => void
}

// Main initialization options
export interface ByofInitOptions extends ByofCallbacks {
  mount: HTMLElement
  chatEndpoint: string
  saveEndpoint?: string
  apiSpec?: string           // Direct JSON string
  apiSpecUrl?: string        // URL to fetch JSON spec from
  projectId?: string
  userId?: string
  sandbox?: ByofSandboxOptions
  theme?: ByofTheme
  
  // Observability - pluggable logger
  logger?: ByofLogger
  
  // Determinism - injectable time provider
  timeProvider?: TimeProvider
}
```

#### Message Types
```typescript
export interface ByofMessage {
  role: 'user' | 'assistant' | 'system'
  content: string
  ts: number  // Unix timestamp
}
```

#### Chat Endpoint Types (export for backend developers)
```typescript
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

export interface ChatResponse {
  html: string
  title?: string
  warnings?: string[]
}
```

#### Save/Load Endpoint Types (export for backend developers)
```typescript
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

export interface SaveResponse {
  id: string
  name?: string
  updatedAt?: string
}

export interface LoadRequest {
  id: string
}

export interface LoadResponse {
  id: string
  name?: string
  html: string
  messages?: ByofMessage[]
  apiSpec?: string
  updatedAt?: string
}

export interface ListRequest {
  projectId?: string
}

export interface ListResponse {
  items: Array<{
    id: string
    name?: string
    updatedAt?: string
  }>
}

export type SavedByofRef = SaveResponse
```

#### Error Types
```typescript
export const ByofErrorCode = {
  CHAT_ERROR: 'CHAT_ERROR',
  SAVE_ERROR: 'SAVE_ERROR',
  LOAD_ERROR: 'LOAD_ERROR',
  SPEC_ERROR: 'SPEC_ERROR',
  SANDBOX_ERROR: 'SANDBOX_ERROR',
  NETWORK_ERROR: 'NETWORK_ERROR',
} as const

export type ByofErrorCode = typeof ByofErrorCode[keyof typeof ByofErrorCode]

export interface ByofError {
  code: ByofErrorCode
  message: string
  details?: unknown
}
```

#### Logger Interface (Pluggable Observability)
```typescript
export interface ByofLogger {
  debug(message: string, context?: Record<string, unknown>): void
  info(message: string, context?: Record<string, unknown>): void
  warn(message: string, context?: Record<string, unknown>): void
  error(message: string, context?: Record<string, unknown>): void
}

// Default console logger
export const defaultLogger: ByofLogger = {
  debug: (msg, ctx) => console.debug(`[BYOF] ${msg}`, ctx ?? ''),
  info: (msg, ctx) => console.info(`[BYOF] ${msg}`, ctx ?? ''),
  warn: (msg, ctx) => console.warn(`[BYOF] ${msg}`, ctx ?? ''),
  error: (msg, ctx) => console.error(`[BYOF] ${msg}`, ctx ?? ''),
}

// No-op logger for silent operation
export const noopLogger: ByofLogger = {
  debug: () => {},
  info: () => {},
  warn: () => {},
  error: () => {},
}
```

#### Time Provider (Injectable for Determinism)
```typescript
export interface TimeProvider {
  now(): number
  isoString(): string
}

export const defaultTimeProvider: TimeProvider = {
  now: () => Date.now(),
  isoString: () => new Date().toISOString(),
}
```

#### Instance Type
```typescript
export interface ByofInstance {
  destroy(): void
  setApiSpec(spec: string): void
  setChatEndpoint(url: string): void
  setSaveEndpoint(url: string): void
  saveCurrent(name?: string): Promise<SavedByofRef>
  loadSaved(id: string): Promise<void>
  reset(): void
}
```

### 2. Update `src/index.ts` to export types and createByof stub

```typescript
export * from './types'
export { VERSION } from './version'
export { defaultLogger, noopLogger } from './types'
export { defaultTimeProvider } from './types'

import type { ByofInitOptions, ByofInstance } from './types'

export function createByof(options: ByofInitOptions): ByofInstance {
  // Stub implementation - will be implemented in later tasks
  throw new Error('Not implemented yet')
}
```

### 3. Create Zod schemas for runtime validation

Create `src/schemas.ts`:

```typescript
import { z } from 'zod'

// Chat response validation
export const chatResponseSchema = z.object({
  html: z.string().min(1),
  title: z.string().optional(),
  warnings: z.array(z.string()).optional(),
})

export type ChatResponseParsed = z.infer<typeof chatResponseSchema>

// Save response validation
export const saveResponseSchema = z.object({
  id: z.string().min(1),
  name: z.string().optional(),
  updatedAt: z.string().optional(),
})

export type SaveResponseParsed = z.infer<typeof saveResponseSchema>

// Load response validation
export const loadResponseSchema = z.object({
  id: z.string().min(1),
  name: z.string().optional(),
  html: z.string().min(1),
  messages: z.array(z.object({
    role: z.string(),
    content: z.string(),
    ts: z.number(),
  })).optional(),
  apiSpec: z.string().optional(),
  updatedAt: z.string().optional(),
})

export type LoadResponseParsed = z.infer<typeof loadResponseSchema>

// List response validation
export const listResponseSchema = z.object({
  items: z.array(z.object({
    id: z.string(),
    name: z.string().optional(),
    updatedAt: z.string().optional(),
  })),
})

export type ListResponseParsed = z.infer<typeof listResponseSchema>

// OpenAPI spec validation (minimal)
export const openApiSpecSchema = z.object({
  openapi: z.string().optional(),
  swagger: z.string().optional(),
  paths: z.record(z.unknown()),
}).refine(
  (data) => data.openapi !== undefined || data.swagger !== undefined,
  { message: 'API spec must have "openapi" or "swagger" version field' }
)
```

### 4. Create `src/version.ts`
```typescript
export const VERSION = '0.1.0'
```

## Acceptance Criteria
- [ ] All types are defined in `src/types.ts`
- [ ] Zod schemas are defined in `src/schemas.ts`
- [ ] `ByofLogger` interface enables pluggable logging
- [ ] `TimeProvider` interface enables injectable time
- [ ] `ByofErrorCode` is a const object (not just string union) for exhaustive checking
- [ ] Types are exported from `src/index.ts`
- [ ] `npm run build` succeeds
- [ ] Types are available in `dist/index.d.ts`
- [ ] No TypeScript errors
