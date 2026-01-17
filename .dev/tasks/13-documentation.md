# Task 13: Documentation

## Objective
Create comprehensive documentation including README, API reference, and security notes.

## Requirements

### 1. Create `README.md`

```markdown
# BYOF (Bring Your Own Frontend)

A framework-agnostic TypeScript library that provides a chat-based UI for generating single-file HTML applications from OpenAPI specs.

## Features

- **Chat-based UI generation**: Describe what you want, get a working UI
- **OpenAPI-driven**: Generated UIs interact with your API based on the spec
- **Sandboxed execution**: Generated HTML runs safely in an iframe
- **Save/Load support**: Persist and restore generated UIs
- **Zero dependencies**: Pure TypeScript, no framework lock-in
- **Fully typed**: Complete TypeScript support with exported types

## Installation

```bash
npm install byof
```

## Quick Start

```typescript
import { createByof } from 'byof'

const byof = createByof({
  mount: document.getElementById('app'),
  chatEndpoint: 'https://your-api.com/chat',
  saveEndpoint: 'https://your-api.com/byof',  // Optional
  apiSpecUrl: 'https://your-api.com/openapi.json',
  sandbox: {
    allowlist: ['https://your-api.com'],
  },
})
```

## Configuration

### ByofInitOptions

| Option | Type | Required | Description |
|--------|------|----------|-------------|
| `mount` | `HTMLElement` | Yes | Container element to render into |
| `chatEndpoint` | `string` | Yes | URL for the chat/generation endpoint |
| `saveEndpoint` | `string` | No | Base URL for save/load endpoints |
| `apiSpec` | `string` | Yes* | OpenAPI spec as JSON string |
| `apiSpecUrl` | `string` | Yes* | URL to fetch OpenAPI spec from |
| `projectId` | `string` | No | Project identifier for context |
| `userId` | `string` | No | User identifier for context |
| `sandbox` | `object` | No | Sandbox configuration |
| `sandbox.allowlist` | `string[]` | No | Allowed origins for API calls |
| `theme` | `ByofTheme` | No | Theme customization |
| `onHtmlGenerated` | `function` | No | Called when HTML is generated |
| `onError` | `function` | No | Called on errors |
| `onSaveComplete` | `function` | No | Called after successful save |
| `onLoadComplete` | `function` | No | Called after successful load |

*Either `apiSpec` or `apiSpecUrl` must be provided.

### Theme

```typescript
const byof = createByof({
  // ...
  theme: {
    primaryColor: '#0066cc',
    backgroundColor: '#ffffff',
    textColor: '#333333',
    borderColor: '#e0e0e0',
    errorColor: '#cc0000',
    successColor: '#00aa00',
    fontFamily: 'Inter, sans-serif',
    fontSize: '14px',
    borderRadius: '8px',
    padding: '16px',
    // Custom CSS variables
    customVariables: {
      'header-height': '60px',
    },
  },
})
```

## API

### ByofInstance

```typescript
interface ByofInstance {
  // Clean up and remove the UI
  destroy(): void
  
  // Update the API spec
  setApiSpec(spec: string): void
  
  // Update endpoints
  setChatEndpoint(url: string): void
  setSaveEndpoint(url: string): void
  
  // Programmatic save/load
  saveCurrent(name?: string): Promise<SavedByofRef>
  loadSaved(id: string): Promise<void>
  
  // Reset the conversation
  reset(): void
}
```

## Backend Integration

BYOF requires you to implement backend endpoints. See [Backend Contracts](#backend-contracts) for details.

### Chat Endpoint

**Request:** `POST {chatEndpoint}`

```typescript
interface ChatRequest {
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
```

**Response:**

```typescript
interface ChatResponse {
  html: string
  title?: string
  warnings?: string[]
}
```

### Save Endpoint

**Save:** `POST {saveEndpoint}/save`

```typescript
// Request
interface SaveRequest {
  name?: string
  html: string
  messages?: Array<{ role: string; content: string; ts: number }>
  apiSpec?: string
  context?: { projectId?: string; userId?: string }
  meta?: { createdAt?: string; byofVersion?: string }
}

// Response
interface SaveResponse {
  id: string
  name?: string
  updatedAt?: string
}
```

**Load:** `GET {saveEndpoint}/load?id={id}`

```typescript
interface LoadResponse {
  id: string
  name?: string
  html: string
  messages?: Array<{ role: string; content: string; ts: number }>
  apiSpec?: string
  updatedAt?: string
}
```

**List:** `GET {saveEndpoint}/list?projectId={projectId}`

```typescript
interface ListResponse {
  items: Array<{
    id: string
    name?: string
    updatedAt?: string
  }>
}
```

## Security

### Sandbox

Generated HTML runs in an iframe with the following restrictions:
- `sandbox="allow-scripts allow-forms"` (no `allow-same-origin`)
- CSP meta tag restricts network calls to the allowlist
- No access to parent window APIs

### Recommendations

1. **Validate HTML server-side** before saving
2. **Use authentication** for save/load endpoints
3. **Rate-limit** the chat endpoint
4. **Keep the allowlist minimal** - only include necessary API origins

## Examples

See the `examples/` directory for a complete working example with:
- Vanilla JavaScript frontend
- Python FastAPI backend with LLM integration

## TypeScript

All types are exported for use in your backend:

```typescript
import type {
  ChatRequest,
  ChatResponse,
  SaveRequest,
  SaveResponse,
  LoadRequest,
  LoadResponse,
  ListRequest,
  ListResponse,
  ByofError,
} from 'byof'
```

## License

MIT
```

### 2. Create `SECURITY.md`

```markdown
# Security Considerations

## Sandbox Security

BYOF executes generated HTML in a sandboxed iframe. While this provides isolation, it is **not a complete security boundary**.

### Sandbox Attributes

The iframe uses:
```html
<iframe sandbox="allow-scripts allow-forms">
```

Notably, `allow-same-origin` is **NOT** included, which means:
- The iframe cannot access cookies or storage from the parent origin
- The iframe cannot make credentialed requests to the parent origin

### Content Security Policy

A CSP meta tag is injected into the generated HTML:
```
default-src 'self';
script-src 'unsafe-inline';
style-src 'unsafe-inline';
img-src 'self' data: blob:;
font-src 'self' data:;
connect-src 'self' {allowlist};
frame-src 'none';
object-src 'none';
```

This restricts:
- Network requests to only the allowlisted origins
- No nested iframes
- No plugins

### Limitations

1. **Inline scripts are allowed** - necessary for the single-file HTML approach
2. **The sandbox is client-side only** - a malicious backend could bypass it
3. **Browser bugs could allow escape** - though rare, sandbox escapes have occurred

## Recommendations

### For Production Use

1. **Server-side HTML validation**: Sanitize or validate HTML before saving
2. **Authentication**: Require authentication for save/load endpoints
3. **Rate limiting**: Limit chat requests to prevent abuse
4. **Audit logging**: Log generated HTML for review
5. **Allowlist carefully**: Only include necessary API origins

### API Key Security

Never expose LLM API keys to the frontend. The chat endpoint should:
- Be server-side
- Use environment variables for API keys
- Validate and sanitize inputs

### CORS Configuration

Configure CORS carefully:
- Specify exact allowed origins (avoid `*` in production)
- Only allow necessary HTTP methods
- Consider credentials requirements

## Reporting Security Issues

If you discover a security vulnerability, please email security@example.com instead of creating a public issue.
```

### 3. Add JSDoc comments to exported functions

Ensure all exported functions and types have JSDoc comments:

```typescript
/**
 * Create a new BYOF instance
 * @param options - Configuration options
 * @returns A ByofInstance for controlling the UI
 * @throws Error if required options are missing
 * @example
 * ```typescript
 * const byof = createByof({
 *   mount: document.getElementById('app'),
 *   chatEndpoint: '/api/chat',
 *   apiSpec: '{"openapi":"3.0.0",...}',
 * })
 * ```
 */
export function createByof(options: ByofInitOptions): ByofInstance
```

## Acceptance Criteria
- [ ] `README.md` covers installation, usage, configuration, and API
- [ ] `SECURITY.md` documents security considerations
- [ ] All exported functions have JSDoc comments
- [ ] Backend endpoint contracts are clearly documented
- [ ] TypeScript types are documented
- [ ] Examples are referenced
