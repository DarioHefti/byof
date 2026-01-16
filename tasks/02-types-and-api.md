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
export interface ByofError {
  code: 'CHAT_ERROR' | 'SAVE_ERROR' | 'LOAD_ERROR' | 'SPEC_ERROR' | 'SANDBOX_ERROR' | 'NETWORK_ERROR'
  message: string
  details?: unknown
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

import type { ByofInitOptions, ByofInstance } from './types'

export function createByof(options: ByofInitOptions): ByofInstance {
  // Stub implementation - will be implemented in later tasks
  throw new Error('Not implemented yet')
}
```

### 3. Create `src/version.ts`
```typescript
export const VERSION = '0.1.0'
```

## Acceptance Criteria
- [ ] All types are defined in `src/types.ts`
- [ ] Types are exported from `src/index.ts`
- [ ] `npm run build` succeeds
- [ ] Types are available in `dist/index.d.ts`
- [ ] No TypeScript errors
