# BYOF

**Bring Your Own Frontend** - A TypeScript library that lets users generate custom UIs through AI chat.

## Installation

```bash
npm install byof
```

## Quick Start

```typescript
import { createByof } from 'byof'

const byof = createByof({
  mount: document.getElementById('app')!,
  chatEndpoint: '/api/chat',
  onHtmlGenerated: (html) => console.log('Generated!'),
})

// Later: cleanup
byof.destroy()
```

That's it! BYOF renders a chat UI and sandbox for generated apps.

## How It Works

```
User Input → BYOF → Your Backend → LLM → Generated HTML → Sandboxed Iframe
```

1. User describes what they want in the chat
2. BYOF sends the request to your backend
3. Your backend calls an LLM (Claude/GPT)
4. LLM generates a single-file HTML app
5. BYOF renders it in a secure sandboxed iframe

## Configuration

```typescript
const byof = createByof({
  // Required
  mount: document.getElementById('app')!,
  chatEndpoint: '/api/chat',

  // Optional: API specification (so generated UIs know your API)
  apiSpec: '{ "openapi": "3.0.0", ... }', // or:
  apiSpecUrl: '/api/openapi.json',

  // Optional: Save/Load functionality
  saveEndpoint: '/api/save',

  // Optional: Context for multi-tenant apps
  projectId: 'project-123',
  userId: 'user-456',

  // Optional: Security - allowed origins for generated app API calls
  sandbox: {
    allowlist: ['https://api.example.com', 'http://localhost:3001'],
  },

  // Optional: Auth headers for generated apps
  getAuthHeaders: () => ({
    Authorization: `Bearer ${localStorage.getItem('token')}`,
  }),

  // Optional: Theme customization
  theme: {
    primaryColor: '#6366f1',
    backgroundColor: '#0f172a',
    textColor: '#f8fafc',
  },

  // Callbacks
  onHtmlGenerated: (html, title) => console.log('Generated:', title),
  onError: (error) => console.error(error.code, error.message),
  onSaveComplete: (ref) => console.log('Saved:', ref.id),
  onLoadComplete: (ref) => console.log('Loaded:', ref.id),
})
```

## Instance Methods

```typescript
// Update configuration
byof.setApiSpec(newSpec)
byof.setChatEndpoint('/api/v2/chat')
byof.setSaveEndpoint('/api/v2/save')

// Save/Load
const ref = await byof.saveCurrent('My App')
await byof.loadSaved(ref.id)

// Reset conversation
byof.reset()

// Cleanup
byof.destroy()
```

## Backend Implementation

BYOF sends requests to your backend endpoints. Here's what to implement:

### Chat Endpoint

```typescript
// POST /api/chat
interface ChatRequest {
  messages: Array<{ role: string; content: string }>
  systemPrompt: string // Built by BYOF - pass to LLM as system message
  apiSpec?: string // Your OpenAPI spec (also in systemPrompt)
  context?: { projectId?: string; userId?: string }
}

interface ChatResponse {
  html: string // The generated single-file HTML app
  title?: string // Optional title for the UI
  warnings?: string[] // Optional warnings to log
}
```

Your backend receives the `systemPrompt` from BYOF - just pass it to the LLM as the system message.

### Save Endpoints (Optional)

```typescript
// POST /api/save - Save a generated UI
// POST /api/save/load - Load by ID
// POST /api/save/list - List saved UIs
```

See `examples/backend/server.js` for a complete implementation.

## Backend Types

Import types for your backend:

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
} from 'byof'
```

## Theming

Pass a theme object or use CSS variables:

```typescript
// Theme object
createByof({
  theme: {
    primaryColor: '#6366f1',
    backgroundColor: '#0f172a',
    textColor: '#f8fafc',
    borderColor: '#334155',
    fontFamily: 'Inter, sans-serif',
    borderRadius: '8px',
  },
})
```

```css
/* Or CSS variables */
.byof-container {
  --byof-primary: #6366f1;
  --byof-bg: #0f172a;
  --byof-text: #f8fafc;
  --byof-border: #334155;
}
```

## Security

BYOF takes security seriously:

- **Sandboxed iframes** - Generated apps run in isolated iframes
- **CSP protection** - Network calls restricted to your allowlist
- **No localStorage** - Generated apps can't access parent storage
- **Auth injection** - Securely pass auth headers to generated apps

## Examples

Run the included example:

```bash
# Install dependencies
npm install

# Build library + run frontend + backend
npm run example
```

Then open http://localhost:3000

## Development

```bash
npm install          # Install dependencies
npm run build        # Build the library
npm run dev          # Watch mode
npm run test         # Run tests
npm run lint         # Lint code
npm run typecheck    # Type check
```

## License

MIT
