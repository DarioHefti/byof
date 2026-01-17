## BYOF (bring your own frontend) — Implementation Plan

### Project Overview
BYOF is a framework-agnostic TypeScript library that provides a chat-based UI for generating single-file HTML applications from OpenAPI specs, with save/load functionality. The generated HTML runs in a sandboxed iframe.

---

## Design Decisions

### Sandbox
- **Mode**: iframe only (shadow-dom may be added later if needed)
- **Security**: CSP meta tag in srcdoc to restrict origins (most seamless for generated code hitting backend)
- **API Allowlist**: Only allow calls to explicitly configured origins

### LLM Backend
- **Integration**: Real LLM integration (not hardcoded/deterministic)
- **Providers**: Support both Anthropic (Claude) and OpenAI (GPT-4) via config option

### Storage (Python Example)
- **Persistence**: In-memory dict (simple, data lost on restart, perfect for demo)

### API Spec Format
- **Format**: JSON only (no YAML parsing client-side)
- Backend can convert YAML to JSON if needed

### Theming
- **Approach**: Comprehensive theming via CSS variables + theme object
- Expose CSS variables (--byof-primary, --byof-bg, etc.) for simple customization
- Also support full theme object for detailed control (colors, fonts, spacing, etc.)
- Goal: Support styling as well as possible for developers

### Streaming
- **Mode**: Complete responses only (HTML appears all at once)

### postMessage Bridge
- **Scope**: Full event bridge with injected helper script
- **Events**: Errors, resize, navigation (JS errors, height changes, link clicks)
- **Implementation**: Library injects a small helper script into iframe for postMessage handling

### Save/Load UI
- **List Feature**: Include dropdown/list of saved items if list endpoint exists

### Layout
- **Default**: Stacked (chat on top, sandbox below)
- **Sizing**: Fixed layout using flexbox to fill available space given by developer

### Backend Types
- **Export**: TypeScript types for chat/save endpoint request/response schemas

### Example API
- **Type**: Todo list CRUD (classic demo)

### Host Events
- **Pattern**: Callback options (onHtmlGenerated, onError, onSaveComplete, etc.)

### UI Features
- **Reset Button**: Yes, include in UI to clear messages and start fresh
- **Message Persistence**: No auto-persistence (developer uses save/load endpoints)
- **Message Editing**: No editing (messages are immutable once sent)
- **Sandbox Views**: Fullscreen toggle + open in new tab button
- **Copy HTML**: No copy button

### Code Quality (per AGENTS.md)
- **Strict TypeScript**: `strict: true`, `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`, `useUnknownInCatchVariables`
- **Runtime Validation**: Use Zod for all external inputs (API responses)
- **Observability**: Pluggable logger interface (`ByofLogger`) with structured logging
- **Determinism**: Injectable `TimeProvider` for reproducible behavior in tests
- **Error Types**: Typed error codes via const object (`ByofErrorCode`)
- **ESLint Rules**: No floating promises, exhaustive switch, import order enforcement
- **No `any`**: Use `unknown` and proper type narrowing

---

## Implementation Plan (TODOs)

### 0) Repo + tooling
- [ ] Create repo `byof`
- [ ] Init npm package (`npm init -y`)
- [ ] Add TypeScript + build tooling
  - [ ] `tsup` to ship `esm` + `cjs` + types
  - [ ] `typescript`, `@types/*`
- [ ] Add quality tooling
  - [ ] `eslint`, `prettier`, `vitest`
- [ ] Decide output targets
  - [ ] `dist/index.js` (ESM), `dist/index.cjs` (CJS), `dist/index.d.ts`
- [ ] Add examples folder + dev runner
  - [ ] `examples/vanilla` served by simple static server
  - [ ] Root `npm run dev` to run example + python backend concurrently

---

### 1) Define the core library API (framework-agnostic)
- [ ] Create public entrypoint `src/index.ts`
- [ ] Define configuration types:
  - [ ] `ByofInitOptions`:
    - [ ] `mount: HTMLElement`
    - [ ] `chatEndpoint: string`
    - [ ] `saveEndpoint?: string`
    - [ ] `apiSpec: string` OR `apiSpecUrl: string` (JSON only)
    - [ ] `projectId?: string`
    - [ ] `userId?: string`
    - [ ] `sandbox: { allowlist?: string[] }` (iframe only, no mode option)
    - [ ] `theme?: ByofTheme` (CSS variables + full theme object)
    - [ ] Callbacks: `onHtmlGenerated?`, `onError?`, `onSaveComplete?`, `onLoadComplete?`
- [ ] Expose API:
  - [ ] `createByof(options): ByofInstance`
  - [ ] `ByofInstance.destroy()`
  - [ ] `ByofInstance.setApiSpec(spec)`
  - [ ] `ByofInstance.setChatEndpoint(url)`
  - [ ] `ByofInstance.setSaveEndpoint(url)`
  - [ ] `ByofInstance.saveCurrent(name?: string): Promise<SavedByofRef>`
  - [ ] `ByofInstance.loadSaved(id: string): Promise<void>`
  - [ ] `ByofInstance.reset(): void`
- [ ] Export TypeScript types for backend developers
- [ ] Keep zero framework dependencies

---

### 2) UI: Chat window component (pure TS/HTML/CSS)
- [ ] Implement DOM-based UI renderer:
  - [ ] `src/ui/render.ts` creates:
    - [ ] Header (title + status)
    - [ ] Message list (user/assistant) - immutable, no editing
    - [ ] Input box + send button
    - [ ] "Generate/Regenerate" controls
    - [ ] "Reset" button to clear conversation
    - [ ] "Save" controls (name field + save button)
    - [ ] "Load" controls (dropdown list of saved items)
    - [ ] Error display
    - [ ] Sandbox area with:
      - [ ] Fullscreen toggle button
      - [ ] Open in new tab button
- [ ] Layout: Stacked (chat on top, sandbox below)
- [ ] Use flexbox to fill available space
- [ ] Add CSS with theming support:
  - [ ] CSS variables (--byof-primary, --byof-bg, --byof-text, etc.)
  - [ ] Theme object mapping to CSS variables
  - [ ] Inject via `<style>` tag
- [ ] Message model:
  - [ ] `{ role: "user"|"assistant"|"system", content: string, ts: number }`
- [ ] UX:
  - [ ] Disable actions while loading/saving
  - [ ] Dirty state (generated HTML changed since last save)

---

### 3) API Spec loading + normalization
- [ ] Support inputs:
  - [ ] Direct JSON string contents
  - [ ] URL fetch (CORS considerations)
- [ ] JSON only (no YAML parsing)
- [ ] Validate minimal requirements:
  - [ ] Must be OpenAPI-like and include paths
- [ ] Create `src/spec/spec.ts`:
  - [ ] `loadSpecFromUrl(url): Promise<string>`
  - [ ] `normalizeSpec(raw): { rawText: string, json: object }`

---

### 4) Chat request contract (developer-provided backend endpoint)
- [ ] Define request/response schema (document it)
  - [ ] `POST {chatEndpoint}`
  - [ ] Request:
    - [ ] `messages: {role, content}[]`
    - [ ] `apiSpec: string`
    - [ ] `context?: { projectId?: string; userId?: string }`
    - [ ] `instructions: { outputFormat: "single_html", sandboxRules: ... }`
  - [ ] Response:
    - [ ] `{ html: string }`
    - [ ] optionally `{ warnings?: string[], title?: string }`
- [ ] Export TypeScript types for request/response
- [ ] Implement client `src/chat/client.ts`:
  - [ ] `sendChat({endpoint, messages, apiSpec, context}): Promise<{html:string}>`
  - [ ] Timeouts + abort controller
  - [ ] Clean error mapping for UI

---

### 5) Save/Retrieve contract (developer-provided endpoint)
- [ ] Define save API (document it)
  - [ ] Save:
    - [ ] `POST {saveEndpoint}/save`
    - [ ] Request:
      - [ ] `name?: string`
      - [ ] `html: string`
      - [ ] `messages?: {role, content, ts}[]`
      - [ ] `apiSpec?: string`
      - [ ] `context?: { projectId?: string; userId?: string }`
      - [ ] `meta?: { createdAt?: string; byofVersion?: string }`
    - [ ] Response:
      - [ ] `{ id: string, name?: string, updatedAt?: string }`
  - [ ] Load:
    - [ ] `GET {saveEndpoint}/load?id=...`
    - [ ] Response:
      - [ ] `{ id: string, name?: string, html: string, messages?: ..., apiSpec?: string, updatedAt?: string }`
  - [ ] List:
    - [ ] `GET {saveEndpoint}/list?projectId=...`
    - [ ] Response:
      - [ ] `{ items: { id: string, name?: string, updatedAt?: string }[] }`
  - [ ] Delete (optional):
    - [ ] `DELETE {saveEndpoint}/delete?id=...`
- [ ] Export TypeScript types for request/response
- [ ] Implement client `src/save/client.ts`:
  - [ ] `saveByof(...)`
  - [ ] `loadByof(...)`
  - [ ] `listByofs(...)`
- [ ] UI wiring:
  - [ ] Save button -> `saveCurrent`
  - [ ] Load dropdown -> populated from list endpoint
  - [ ] On load: restore HTML (+ messages/spec if provided)

---

### 6) Prompting rules (what the backend AI should generate)
- [ ] Define strict "HTML contract":
  - [ ] Complete `<html>...</html>`
  - [ ] Inline `<style>` + `<script>`
  - [ ] No external network calls except to allowlisted origins
  - [ ] Render into `document.body`
  - [ ] Must not escape iframe
- [ ] Provide canonical system prompt template in docs
- [ ] Add frontend-side checks (basic sanity)

---

### 7) Sandbox runner (execute generated UI safely)
- [ ] Implement iframe sandbox:
  - [ ] `<iframe sandbox="allow-scripts allow-forms">`
  - [ ] `iframe.srcdoc = html`
  - [ ] CSP meta tag to restrict origins to allowlist
- [ ] Inject helper script for postMessage bridge:
  - [ ] Error reporting (JS errors surfaced to parent)
  - [ ] Resize events (height changes)
  - [ ] Navigation events (link clicks)
- [ ] Capture errors inside sandbox and surface in BYOF UI
- [ ] Fullscreen toggle functionality
- [ ] Open in new tab functionality

---

### 8) App flow wiring
- [ ] `createByof`:
  - [ ] Render UI
  - [ ] Load spec (if URL)
  - [ ] Fetch saved items list if saveEndpoint configured
  - [ ] Wire up callbacks (onHtmlGenerated, onError, etc.)
- [ ] Send:
  - [ ] Append user message
  - [ ] Call `sendChat`
  - [ ] Store `currentHtml`, mark dirty, run sandbox
  - [ ] Call `onHtmlGenerated` callback
- [ ] Save:
  - [ ] POST currentHtml (+ optional messages/spec/context)
  - [ ] Store `lastSavedId`, mark clean
  - [ ] Refresh saved items list
  - [ ] Call `onSaveComplete` callback
- [ ] Load:
  - [ ] Fetch saved payload, run sandbox, restore messages
  - [ ] Call `onLoadComplete` callback
- [ ] Reset:
  - [ ] Clear messages
  - [ ] Clear current HTML
  - [ ] Reset sandbox

---

### 9) Packaging for npm
- [ ] `package.json`:
  - [ ] `name: "byof"`
  - [ ] `exports` for ESM/CJS/types
- [ ] CSS strategy: inline style string in TS
- [ ] Export all TypeScript types for backend developers
- [ ] `README.md`:
  - [ ] Minimal usage snippet
  - [ ] Endpoint contracts: chat + save/load/list
  - [ ] Security notes

---

### 10) Examples (vanilla) + Python backend with real LLM

**Folder layout**
- [ ] `examples/vanilla/index.html`
- [ ] `examples/vanilla/styles.css`
- [ ] `examples/vanilla/main.js`
- [ ] `examples/vanilla/openapi.json` (JSON only)
- [ ] `examples/backend/app.py` (python REST API with FastAPI)
- [ ] `examples/backend/requirements.txt`
- [ ] Root `npm run example` to run everything

**Example page**
- [ ] `index.html`:
  - [ ] Loads built library from local `dist/`
  - [ ] Has a mount div: `<div id="byof"></div>`
  - [ ] Shows configuration panel (optional):
    - [ ] Chat endpoint URL
    - [ ] Save endpoint URL
    - [ ] Button to load OpenAPI file
- [ ] `main.js`:
  - [ ] `createByof({ mount, chatEndpoint, saveEndpoint, apiSpecUrl, sandbox: { allowlist: [...] } })`
- [ ] `styles.css`:
  - [ ] Basic layout so BYOF component fills container

**Python backend with real LLM**
- [ ] FastAPI framework
- [ ] Environment variable for LLM provider selection (`BYOF_LLM_PROVIDER=anthropic|openai`)
- [ ] Environment variables for API keys (`ANTHROPIC_API_KEY`, `OPENAI_API_KEY`)
- [ ] Implement endpoints:
  - [ ] `GET /openapi.json` (serve example API spec)
  - [ ] Todo API (to be called by generated UI):
    - [ ] `GET /api/todos`
    - [ ] `POST /api/todos`
    - [ ] `PUT /api/todos/{id}`
    - [ ] `DELETE /api/todos/{id}`
  - [ ] `POST /chat`:
    - [ ] Accepts BYOF chat payload
    - [ ] Calls Anthropic or OpenAI based on config
    - [ ] Returns generated HTML
  - [ ] Save endpoints (in-memory dict storage):
    - [ ] `POST /byof/save`
    - [ ] `GET /byof/load`
    - [ ] `GET /byof/list`
- [ ] Add CORS middleware
- [ ] `requirements.txt`: `fastapi`, `uvicorn`, `anthropic`, `openai`, `python-dotenv`

**Dev scripts**
- [ ] `npm run build` (library)
- [ ] `npm run dev:example:web` (serve `examples/vanilla`)
- [ ] `npm run dev:example:api` (run uvicorn)
- [ ] `npm run dev` runs both concurrently

---

### 11) Security + constraints (document clearly)
- [ ] Sandbox is best-effort; `allow-same-origin` is OFF
- [ ] CSP meta tag restricts network calls to allowlist
- [ ] Recommend backend-side validation/sanitization before saving HTML
- [ ] Rate-limit chat; require auth for save/load in real deployments
- [ ] CORS guidance

---

### 12) Testing (minimum)
- [ ] Unit tests:
  - [ ] Spec normalization (JSON validation)
  - [ ] Chat client error handling
  - [ ] Save/load client behavior
- [ ] E2E-ish:
  - [ ] Mock chat returns HTML; iframe loads
  - [ ] Save/load roundtrip restores HTML/messages

---

### 13) Release checklist
- [ ] Versioning + changelog
- [ ] Verify install in clean project
- [ ] `npm publish --access public`

---

## Deliverables (coding tasks order)
1. Scaffold project + build (tsup) + types
2. Implement `createByof` + DOM UI + styles injection (incl save/load UI, theming)
3. Implement spec loading/normalization (JSON only)
4. Implement chat client + request/response types
5. Implement save/load client + types
6. Implement iframe sandbox runner + postMessage bridge + error reporting
7. Wire full flow (chat -> html -> sandbox; save/load roundtrip; reset)
8. Add `examples/vanilla` + `examples/backend` (Python FastAPI with real LLM) + dev scripts
9. Add tests + publish-ready packaging
