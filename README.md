# BYOF

**Bring Your Own Frontend** — A typescript library that lets users generate their own frontend while using your app.

```
┌─────────────────────────────────────┐
│  Chat with AI                       │
├─────────────────────────────────────┤
│  > Build me a todo app              │
│                                     │
│  ┌─────────────────────────────┐    │
│  │ Generated App Preview       │    │
│  │ ┌─────────────────────────┐ │    │
│  │ │ ☐ Buy groceries         │ │    │
│  │ │ ☑ Walk the dog          │ │    │
│  │ └─────────────────────────┘ │    │
│  └─────────────────────────────┘    │
└─────────────────────────────────────┘
```

## Features

- **Chat-driven UI generation** — Describe what you want, get a working HTML app
- **OpenAPI-aware** — Generated apps know how to call your API
- **Sandboxed execution** — Apps run in secure iframes with CSP protection
- **Save & load** — Persist and restore generated applications
- **Fully themeable** — CSS variables + theme objects for complete customization
- **Zero dependencies** — Pure TypeScript, works with any framework
- **Type-safe** — Full TypeScript support with exported types for backends

## Quick Start

```bash
npm install byof
```

```typescript
import { createByof } from 'byof';

const byof = createByof({
  mount: document.getElementById('app'),
  chatEndpoint: '/api/chat',
  saveEndpoint: '/api/byof',
  apiSpec: openApiJsonString,
  sandbox: {
    allowlist: ['https://api.example.com']
  },
  onHtmlGenerated: (html) => console.log('Generated:', html.length, 'bytes'),
  onError: (error) => console.error('Error:', error)
});
```

## How It Works

```
┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐
│  User    │───▶│  BYOF    │───▶│  Your    │───▶│  LLM     │
│  Input   │    │  Client  │    │  Backend │    │  (Claude │
└──────────┘    └──────────┘    └──────────┘    │  / GPT)  │
                     │                          └──────────┘
                     │
                     ▼
              ┌──────────────┐
              │  Sandboxed   │
              │  iframe with │
              │  generated   │
              │  HTML app    │
              └──────────────┘
```

1. **User describes** what they want in the chat
2. **BYOF sends** the request + OpenAPI spec to your backend
3. **Your backend** calls an LLM (Anthropic/OpenAI) with the prompt
4. **LLM generates** a complete single-file HTML app
5. **BYOF renders** the app in a sandboxed iframe
6. **User can save** the generated app for later

## Configuration

```typescript
interface ByofInitOptions {
  // Required
  mount: HTMLElement;              // Where to render the UI
  chatEndpoint: string;            // Your backend chat endpoint

  // API Spec (one required)
  apiSpec?: string;                // OpenAPI JSON as string
  apiSpecUrl?: string;             // URL to fetch OpenAPI JSON

  // Optional
  saveEndpoint?: string;           // Backend for save/load functionality
  projectId?: string;              // Group saved items by project
  userId?: string;                 // Associate with a user
  
  sandbox?: {
    allowlist?: string[];          // Origins the generated app can call
  };
  
  theme?: ByofTheme;               // Customization options
  
  // Callbacks
  onHtmlGenerated?: (html: string) => void;
  onError?: (error: ByofError) => void;
  onSaveComplete?: (ref: SavedByofRef) => void;
  onLoadComplete?: (data: LoadedByof) => void;
}
```

## Backend API Contracts

BYOF expects your backend to implement these endpoints:

### Chat Endpoint

```
POST {chatEndpoint}

Request:
{
  "messages": [{ "role": "user" | "assistant", "content": "..." }],
  "apiSpec": "{ OpenAPI JSON }",
  "context": { "projectId": "...", "userId": "..." },
  "instructions": { "outputFormat": "single_html", "sandboxRules": {...} }
}

Response:
{
  "html": "<!DOCTYPE html>...",
  "title": "My Todo App",       // optional
  "warnings": ["..."]           // optional
}
```

### Save Endpoint (Optional)

```
POST {saveEndpoint}/save
GET  {saveEndpoint}/load?id=...
GET  {saveEndpoint}/list?projectId=...
```

See [Backend Types](#backend-types) for full TypeScript definitions.

## Theming

```typescript
createByof({
  // ...
  theme: {
    colors: {
      primary: '#6366f1',
      background: '#0f172a',
      surface: '#1e293b',
      text: '#f8fafc',
      textMuted: '#94a3b8',
      border: '#334155',
      error: '#ef4444',
      success: '#22c55e'
    },
    fonts: {
      sans: 'Inter, system-ui, sans-serif',
      mono: 'JetBrains Mono, monospace'
    },
    spacing: {
      xs: '0.25rem',
      sm: '0.5rem',
      md: '1rem',
      lg: '1.5rem',
      xl: '2rem'
    },
    radii: {
      sm: '0.25rem',
      md: '0.5rem',
      lg: '0.75rem'
    }
  }
});
```

Or use CSS variables directly:

```css
:root {
  --byof-primary: #6366f1;
  --byof-bg: #0f172a;
  --byof-surface: #1e293b;
  --byof-text: #f8fafc;
  --byof-text-muted: #94a3b8;
  --byof-border: #334155;
  --byof-error: #ef4444;
  --byof-success: #22c55e;
  --byof-font-sans: Inter, system-ui, sans-serif;
  --byof-font-mono: JetBrains Mono, monospace;
  --byof-radius-sm: 0.25rem;
  --byof-radius-md: 0.5rem;
  --byof-radius-lg: 0.75rem;
}
```

## Instance Methods

```typescript
const byof = createByof(options);

// Update configuration
byof.setApiSpec(newSpec);
byof.setChatEndpoint(newUrl);
byof.setSaveEndpoint(newUrl);

// Save/Load
await byof.saveCurrent('My App');     // Returns SavedByofRef
await byof.loadSaved('abc123');       // Restores saved state

// Reset conversation
byof.reset();

// Cleanup
byof.destroy();
```

## Backend Types

Import types for your backend implementation:

```typescript
import type {
  // Chat endpoint
  ChatRequest,
  ChatResponse,
  
  // Save endpoint
  SaveRequest,
  SaveResponse,
  LoadResponse,
  ListResponse,
  
  // Common
  Message,
  ByofContext
} from 'byof/types';
```

## Security

BYOF takes security seriously:

- **Sandboxed iframes** — Generated apps run without `allow-same-origin`
- **CSP protection** — Meta tag restricts network calls to allowlisted origins
- **No external scripts** — Generated HTML is self-contained
- **postMessage bridge** — Safe communication between parent and iframe

**Recommendations for production:**

- Validate/sanitize HTML on your backend before saving
- Implement rate limiting on chat endpoints
- Require authentication for save/load operations
- Use HTTPS everywhere

## Example Backend (Python)

See the [`examples/backend`](./examples/backend) folder for a complete FastAPI implementation with:

- Anthropic Claude / OpenAI GPT integration
- Todo CRUD API (for generated apps to call)
- In-memory save/load storage
- CORS configuration

```bash
cd examples/backend
pip install -r requirements.txt
ANTHROPIC_API_KEY=sk-... python app.py
```

## Development

```bash
# Install dependencies
npm install

# Build the library
npm run build

# Run example (library + backend)
npm run dev

# Run tests
npm run test

# Type check
npm run typecheck

# Lint
npm run lint
```

## Architecture

```
src/
├── index.ts          # Public API exports
├── types/            # TypeScript interfaces
├── ui/               # DOM-based UI renderer
├── spec/             # OpenAPI spec loader
├── chat/             # Chat client
├── save/             # Save/load client
├── sandbox/          # Iframe runner + postMessage bridge
└── utils/            # Logger, time provider, errors
```

## Browser Support

BYOF works in all modern browsers that support:

- ES2020+
- `<iframe sandbox>`
- CSS Custom Properties
- `fetch` API

## License

MIT

---

Built for developers who want AI-generated UIs without the complexity.
