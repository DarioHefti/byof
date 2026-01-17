# BYOF Progress

## Completed Tasks

- [x] Task 01: Project Scaffold
  - Initialized npm package with ESM/CJS dual module exports
  - Installed dependencies (TypeScript, tsup, ESLint, Prettier, Vitest, Zod)
  - Created tsconfig.json with strict TypeScript settings
  - Created tsup.config.ts for bundling
  - Created ESLint v9 flat config
  - Created .prettierrc and .gitignore
  - Created folder structure (src/ui, src/chat, src/save, src/spec, src/sandbox, examples)

- [x] Task 02: Core Types and API Definition
  - Created src/types.ts with all type definitions
  - Created src/version.ts
  - Created src/schemas.ts with Zod validation schemas
  - Updated src/index.ts to export types and createByof stub
  - Downgraded to zod v3 for compatibility

- [x] Task 03: UI Renderer
  - Created src/ui/styles.ts with CSS variables for theming
  - Created src/ui/render.ts with renderUI function and all UI elements
  - Created src/ui/state.ts for UI state management
  - Created src/ui/index.ts to export all UI components
  - Added UI exports to main index.ts

- [x] Task 04: API Spec Loader
  - Created src/spec/loader.ts with loadSpecFromUrl and normalizeSpec
  - Created ByofException class for proper error handling
  - Added AbortSignal support for cancellation
  - Created src/spec/index.ts to export functions
  - Added 11 unit tests (all passing)
  - Exported spec loader from main index.ts

- [x] Task 05: Chat Client
  - Created src/chat/client.ts with sendChat function
  - Supports timeout and AbortSignal for cancellation
  - Validates response with Zod schema
  - Throws ByofException with CHAT_ERROR or NETWORK_ERROR codes
  - Created src/chat/index.ts to export functions
  - Added 8 unit tests (all passing)
  - Exported chat client from main index.ts
  - Updated ESLint config to relax rules in test files

- [x] Task 06: Save/Load Client
  - Created src/save/client.ts with saveUI, loadUI, and listSavedUIs functions
  - All functions support timeout and AbortSignal for cancellation
  - Validates responses with Zod schemas (saveResponseSchema, loadResponseSchema, listResponseSchema)
  - Throws ByofException with SAVE_ERROR, LOAD_ERROR, or NETWORK_ERROR codes
  - Created src/save/index.ts to export functions
  - Added 19 unit tests (all passing, total 38 tests)
  - Exported save client from main index.ts
  - Follows exactOptionalPropertyTypes compliance for all optional fields

- [x] Task 07: Sandbox Runner
  - Created src/sandbox/csp.ts with CSP policy generation:
    - `generateCsp()` - Generates Content-Security-Policy string
    - `generateCspMetaTag()` - Creates HTML meta tag for CSP
    - `injectCspIntoHtml()` - Injects CSP into HTML documents
    - `isOriginAllowed()` - Validates URLs against allowlist (supports wildcards)
  - Created src/sandbox/runner.ts with sandbox execution:
    - `prepareSandboxHtml()` - Prepares HTML with CSP injection
    - `loadIntoIframe()` - Loads HTML into sandboxed iframe
    - `configureSandboxAttributes()` - Sets iframe sandbox attributes
    - `openInNewTab()` - Opens HTML in new browser tab
    - `downloadHtml()` - Creates downloadable HTML file
    - `validateHtml()` - Validates HTML for security warnings
    - `basicSanitize()` - Removes dangerous elements (meta refresh, base tags)
  - Created src/sandbox/index.ts to export all functions and types
  - Added 44 unit tests (21 CSP + 23 runner, total 82 tests)
  - Exported sandbox module from main index.ts
  - Throws ByofException with SANDBOX_ERROR code

- [x] Task 08: Main Integration
  - Created src/core/byof.ts with `createByof()` factory function:
    - Integrates UI rendering, chat, save/load, spec loading, and sandbox
    - Internal state management with proper lifecycle handling
    - Supports all callbacks: `onHtmlGenerated`, `onError`, `onSaveComplete`, `onLoadComplete`
    - Async API spec loading from URL
    - Auto-refreshes saved items list
    - Proper error handling with `ByofException`
  - Created src/core/index.ts to export `createByof`
  - Implements full `ByofInstance` interface:
    - `destroy()` - Cleanup and remove UI
    - `setApiSpec()` - Update API specification
    - `setChatEndpoint()` - Update chat endpoint URL
    - `setSaveEndpoint()` - Update save endpoint URL
    - `saveCurrent()` - Save current UI state
    - `loadSaved()` - Load a previously saved UI
    - `reset()` - Reset to initial state
  - Added 19 unit tests with jsdom environment (total 101 tests)
  - Updated main index.ts to export `createByof` from core module
  - Installed jsdom for DOM testing

- [x] Task 09: Example Frontend
  - Created examples/vanilla/index.html with complete demo page
  - Features:
    - Configuration panel for chat endpoint, save endpoint, and API spec URL
    - Theme selector (Default, Dark, Brand Colors)
    - Initialize/Destroy buttons to control BYOF lifecycle
    - Event log panel showing all SDK callbacks in real-time
    - Demo notice explaining how to run with backend
  - Demonstrates full SDK usage:
    - `createByof()` initialization with all options
    - Theme customization via presets
    - Callback handlers: `onHtmlGenerated`, `onError`, `onSaveComplete`, `onLoadComplete`
    - Sandbox allowlist configuration
    - Project/user context
  - Clean, modern styling matching SDK theme
  - ES module import from dist folder

- [x] Task 10: Example Backend
  - Created examples/backend/package.json with dependencies (express, cors)
  - Created examples/backend/server.js with complete API implementation:
    - `POST /api/chat` - Generate HTML from chat messages (mock LLM)
    - `POST /api/save` - Save a generated UI to in-memory store
    - `POST /api/save/load` - Load a saved UI by ID
    - `POST /api/save/list` - List saved UIs with optional projectId filter
    - `GET /health` - Health check endpoint
  - Mock HTML generation based on keywords:
    - "dashboard" / "stats" -> Dashboard with stats grid and bar chart
    - "form" / "input" -> Contact form with validation
    - "table" / "list" / "data" -> User directory table
    - "card" / "profile" -> Profile card with stats
    - "chart" / "graph" -> Analytics view with charts
    - Default -> Generic UI with request echo
  - Features:
    - In-memory storage for saved UIs
    - CORS enabled for cross-origin requests
    - Request logging for debugging
    - Clean HTML templates with modern CSS
    - Proper error handling and validation
  - Updated frontend example with getting started instructions

## Current Issues

- [x] Fixed NETWORK_ERROR: "Chat request timed out or was aborted"
  - Root cause 1: Azure Responses API returns content with `type: "output_text"` instead of `type: "text"`
  - Root cause 2: Default timeout was 60s, AI generation can take longer
  - Fix 1: Updated `examples/backend/server.js` to handle `output_text` content type
  - Fix 2: Increased default timeout from 60s to 300s (5 min) in `src/chat/client.ts`

- [x] Improved LLM system prompt for better HTML generation
  - Added comprehensive context about BYOF library
  - Explained sandbox constraints and security model
  - Provided clear API integration instructions
  - Added design guidelines and example structure
  - **Explicitly forbade localStorage/sessionStorage** - must use API
  - Added concrete fetch() examples with base URL

- [x] Fixed sandbox security warning
  - Removed `allow-same-origin` from iframe sandbox attributes
  - This blocks localStorage/sessionStorage access (enforces API usage)
  - fetch() to external APIs still works via CSP
  - Eliminates "can remove its sandboxing" browser warning

- [x] Fixed CORS issues with API calls
  - Updated LLM prompt to use correct `http://localhost:3001` base URL
  - Added smart base URL detection (prefers localhost for development)
  - Updated vanilla example allowlist to explicit ports instead of wildcards
  - Added `'self'` to CSP `connect-src` directive

- [x] Added actual REST API endpoints to example backend
  - Added full CRUD for `/users` endpoint (GET, POST, PUT, DELETE)
  - Added in-memory data store with 5 seed users
  - Updated vanilla example API spec to match actual endpoints
  - Now generated UIs can actually call working API endpoints!
  - Endpoints: GET /users, GET /users/:id, POST /users, PUT /users/:id, DELETE /users/:id

- [x] Moved system prompt to library (developer-overridable)
  - Created `src/prompt/builder.ts` with minimal system prompt
  - Added `buildSystemPrompt()`, `buildDefaultPrompt()`, `getApiBaseUrl()` exports
  - Added `ByofPromptConfig` type with three override options:
    - `systemPrompt`: Complete replacement
    - `systemPromptSuffix`: Append to default
    - `buildSystemPrompt`: Custom builder function
  - Updated `ChatRequest` to include `systemPrompt` field
  - Library now builds prompt and sends to backend (backend just forwards it)
  - Simplified example backend to use the library-provided prompt
  - Added 14 tests for prompt builder (total: 115 tests)

- [x] Added framework-agnostic auth support via `getAuthHeaders` callback
  - Added `getAuthHeaders?: () => AuthHeaders | Promise<AuthHeaders>` to `ByofInitOptions`
  - Created `src/sandbox/auth.ts` with auth injection utilities:
    - `generateAuthScript()` - Creates script tag with escaped JSON
    - `injectAuthIntoHtml()` - Injects auth into HTML document
    - `hasAuthInjection()` - Checks if auth is already injected
  - Auth headers are injected as `window.__BYOF_AUTH__` in the iframe
  - Updated prompt builder to instruct LLM to use auth headers in fetch() calls
  - Called before each HTML load to support token refresh
  - Works with any auth system: JWT, API keys, session tokens, etc.
  - Added 13 tests for auth injection (total: 128 tests)

## All Tasks Complete!

---

## Test Summary

| Task             | Tests   |
| ---------------- | ------- |
| Spec Loader      | 11      |
| Chat Client      | 8       |
| Save/Load Client | 19      |
| Sandbox CSP      | 21      |
| Sandbox Runner   | 23      |
| Sandbox Auth     | 13      |
| Core Integration | 19      |
| Prompt Builder   | 14      |
| **Total**        | **128** |
