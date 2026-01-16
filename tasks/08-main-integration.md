# Task 08: Main Integration (createByof)

## Objective
Wire together all components (UI, spec loader, chat client, save client, sandbox) into the main `createByof` function.

## Requirements

### 1. Create `src/core/instance.ts`
Main BYOF instance implementation:

```typescript
import {
  ByofInitOptions,
  ByofInstance,
  ByofMessage,
  ByofError,
  SavedByofRef,
} from '../types'
import { VERSION } from '../version'
import { renderUI, UIElements, UICallbacks } from '../ui/render'
import { createUIState, updateUI, UIState } from '../ui/state'
import { loadSpecFromUrl, normalizeSpec } from '../spec/loader'
import { sendChat } from '../chat/client'
import { saveByof, loadByof, listByofs } from '../save/client'
import { createSandbox, SandboxRunner } from '../sandbox/runner'

interface ByofCore {
  options: ByofInitOptions
  state: UIState
  ui: UIElements
  sandbox: SandboxRunner
  apiSpec: string | null
  abortController: AbortController | null
}

export function createByofInstance(options: ByofInitOptions): ByofInstance {
  // Validate required options
  validateOptions(options)
  
  // Initialize state
  const state = createUIState()
  
  // Set up UI callbacks
  const uiCallbacks: UICallbacks = {
    onSend: (message) => handleSend(core, message),
    onReset: () => handleReset(core),
    onSave: (name) => handleSave(core, name),
    onLoad: (id) => handleLoad(core, id),
    onFullscreen: () => handleFullscreen(core),
    onNewTab: () => handleNewTab(core),
  }
  
  // Render UI
  const ui = renderUI(options.mount, options.theme, uiCallbacks)
  
  // Create sandbox
  const sandbox = createSandbox(
    ui.sandboxContainer,
    options.sandbox?.allowlist || [],
    {
      onError: (error) => handleSandboxError(core, error),
      onResize: (payload) => handleSandboxResize(core, payload),
      onNavigate: (payload) => handleSandboxNavigate(core, payload),
    }
  )
  
  // Core instance
  const core: ByofCore = {
    options,
    state,
    ui,
    sandbox,
    apiSpec: null,
    abortController: null,
  }
  
  // Initialize
  initialize(core)
  
  // Return public API
  return {
    destroy: () => destroy(core),
    setApiSpec: (spec) => setApiSpec(core, spec),
    setChatEndpoint: (url) => setChatEndpoint(core, url),
    setSaveEndpoint: (url) => setSaveEndpoint(core, url),
    saveCurrent: (name) => saveCurrent(core, name),
    loadSaved: (id) => loadSaved(core, id),
    reset: () => handleReset(core),
  }
}

function validateOptions(options: ByofInitOptions): void {
  if (!options.mount) {
    throw new Error('mount element is required')
  }
  if (!options.chatEndpoint) {
    throw new Error('chatEndpoint is required')
  }
  if (!options.apiSpec && !options.apiSpecUrl) {
    throw new Error('apiSpec or apiSpecUrl is required')
  }
}

async function initialize(core: ByofCore): Promise<void> {
  try {
    // Load API spec
    if (core.options.apiSpecUrl) {
      const specText = await loadSpecFromUrl(core.options.apiSpecUrl)
      const normalized = normalizeSpec(specText)
      core.apiSpec = normalized.rawText
    } else if (core.options.apiSpec) {
      const normalized = normalizeSpec(core.options.apiSpec)
      core.apiSpec = normalized.rawText
    }
    
    // Load saved items list if saveEndpoint configured
    if (core.options.saveEndpoint) {
      await refreshSavedList(core)
    }
  } catch (error) {
    handleError(core, error as ByofError)
  }
}

async function handleSend(core: ByofCore, messageContent: string): Promise<void> {
  if (!core.apiSpec) {
    handleError(core, { code: 'SPEC_ERROR', message: 'API spec not loaded' })
    return
  }
  
  // Add user message
  const userMessage: ByofMessage = {
    role: 'user',
    content: messageContent,
    ts: Date.now(),
  }
  core.state.messages.push(userMessage)
  core.state.isLoading = true
  core.state.error = null
  updateUI(core.ui, core.state)
  
  // Create abort controller
  core.abortController = new AbortController()
  
  try {
    const response = await sendChat({
      endpoint: core.options.chatEndpoint,
      messages: core.state.messages,
      apiSpec: core.apiSpec,
      context: {
        projectId: core.options.projectId,
        userId: core.options.userId,
      },
      allowedOrigins: core.options.sandbox?.allowlist || [],
      signal: core.abortController.signal,
    })
    
    // Add assistant message
    const assistantMessage: ByofMessage = {
      role: 'assistant',
      content: response.title || 'Generated UI',
      ts: Date.now(),
    }
    core.state.messages.push(assistantMessage)
    
    // Store HTML and mark dirty
    core.state.currentHtml = response.html
    core.state.isDirty = true
    
    // Load into sandbox
    core.sandbox.load(response.html)
    
    // Call callback
    core.options.onHtmlGenerated?.(response.html, response.title)
    
    // Show warnings if any
    if (response.warnings?.length) {
      console.warn('BYOF warnings:', response.warnings)
    }
  } catch (error) {
    handleError(core, error as ByofError)
  } finally {
    core.state.isLoading = false
    core.abortController = null
    updateUI(core.ui, core.state)
  }
}

function handleReset(core: ByofCore): void {
  // Abort any pending request
  core.abortController?.abort()
  core.abortController = null
  
  // Clear state
  core.state.messages = []
  core.state.currentHtml = null
  core.state.isDirty = false
  core.state.error = null
  core.state.isLoading = false
  
  // Clear sandbox
  core.sandbox.clear()
  
  // Update UI
  updateUI(core.ui, core.state)
}

async function handleSave(core: ByofCore, name: string): Promise<void> {
  if (!core.options.saveEndpoint) {
    handleError(core, { code: 'SAVE_ERROR', message: 'Save endpoint not configured' })
    return
  }
  
  if (!core.state.currentHtml) {
    handleError(core, { code: 'SAVE_ERROR', message: 'Nothing to save' })
    return
  }
  
  core.state.isLoading = true
  updateUI(core.ui, core.state)
  
  try {
    const result = await saveByof({
      endpoint: core.options.saveEndpoint,
      name: name || undefined,
      html: core.state.currentHtml,
      messages: core.state.messages,
      apiSpec: core.apiSpec || undefined,
      context: {
        projectId: core.options.projectId,
        userId: core.options.userId,
      },
    })
    
    core.state.lastSavedId = result.id
    core.state.isDirty = false
    
    // Refresh saved list
    await refreshSavedList(core)
    
    // Call callback
    core.options.onSaveComplete?.(result)
  } catch (error) {
    handleError(core, error as ByofError)
  } finally {
    core.state.isLoading = false
    updateUI(core.ui, core.state)
  }
}

async function handleLoad(core: ByofCore, id: string): Promise<void> {
  if (!core.options.saveEndpoint) {
    handleError(core, { code: 'LOAD_ERROR', message: 'Save endpoint not configured' })
    return
  }
  
  core.state.isLoading = true
  updateUI(core.ui, core.state)
  
  try {
    const result = await loadByof({
      endpoint: core.options.saveEndpoint,
      id,
    })
    
    // Restore state
    core.state.currentHtml = result.html
    core.state.messages = result.messages || []
    core.state.lastSavedId = result.id
    core.state.isDirty = false
    
    // Restore API spec if provided
    if (result.apiSpec) {
      core.apiSpec = result.apiSpec
    }
    
    // Load into sandbox
    core.sandbox.load(result.html)
    
    // Call callback
    core.options.onLoadComplete?.(result)
  } catch (error) {
    handleError(core, error as ByofError)
  } finally {
    core.state.isLoading = false
    updateUI(core.ui, core.state)
  }
}

async function refreshSavedList(core: ByofCore): Promise<void> {
  if (!core.options.saveEndpoint) return
  
  try {
    const result = await listByofs({
      endpoint: core.options.saveEndpoint,
      projectId: core.options.projectId,
    })
    core.state.savedItems = result.items
    updateUI(core.ui, core.state)
  } catch (error) {
    // Non-fatal - just log
    console.warn('Failed to load saved items list:', error)
  }
}

function handleFullscreen(core: ByofCore): void {
  if (core.sandbox.isFullscreen()) {
    core.sandbox.exitFullscreen()
  } else {
    core.sandbox.enterFullscreen()
  }
}

function handleNewTab(core: ByofCore): void {
  core.sandbox.openInNewTab()
}

function handleSandboxError(core: ByofCore, error: any): void {
  const byofError: ByofError = {
    code: 'SANDBOX_ERROR',
    message: error.message || 'Sandbox error',
    details: error,
  }
  handleError(core, byofError)
}

function handleSandboxResize(core: ByofCore, payload: { height: number }): void {
  // Could adjust iframe height if needed
  // For now, let CSS handle it
}

function handleSandboxNavigate(core: ByofCore, payload: { url: string }): void {
  // Log navigation attempts from sandbox
  console.log('Sandbox navigation intercepted:', payload.url)
}

function handleError(core: ByofCore, error: ByofError): void {
  core.state.error = error.message
  updateUI(core.ui, core.state)
  core.options.onError?.(error)
}

function destroy(core: ByofCore): void {
  core.abortController?.abort()
  core.sandbox.destroy()
  core.ui.container.remove()
}

function setApiSpec(core: ByofCore, spec: string): void {
  const normalized = normalizeSpec(spec)
  core.apiSpec = normalized.rawText
}

function setChatEndpoint(core: ByofCore, url: string): void {
  core.options.chatEndpoint = url
}

function setSaveEndpoint(core: ByofCore, url: string): void {
  core.options.saveEndpoint = url
  refreshSavedList(core)
}

async function saveCurrent(core: ByofCore, name?: string): Promise<SavedByofRef> {
  // This is the programmatic API version
  if (!core.options.saveEndpoint) {
    throw { code: 'SAVE_ERROR', message: 'Save endpoint not configured' } as ByofError
  }
  
  if (!core.state.currentHtml) {
    throw { code: 'SAVE_ERROR', message: 'Nothing to save' } as ByofError
  }
  
  const result = await saveByof({
    endpoint: core.options.saveEndpoint,
    name,
    html: core.state.currentHtml,
    messages: core.state.messages,
    apiSpec: core.apiSpec || undefined,
    context: {
      projectId: core.options.projectId,
      userId: core.options.userId,
    },
  })
  
  core.state.lastSavedId = result.id
  core.state.isDirty = false
  await refreshSavedList(core)
  
  return result
}

async function loadSaved(core: ByofCore, id: string): Promise<void> {
  await handleLoad(core, id)
}
```

### 2. Update `src/index.ts`
Export the main function:

```typescript
export * from './types'
export { VERSION } from './version'
export { createByofInstance as createByof } from './core/instance'

// Re-export useful types for backend developers
export type {
  ChatRequest,
  ChatResponse,
  SaveRequest,
  SaveResponse,
  LoadRequest,
  LoadResponse,
  ListRequest,
  ListResponse,
} from './types'
```

### 3. Create `src/core/index.ts`

```typescript
export * from './instance'
```

## Flow Summary

### Initialization
1. Validate options
2. Create UI state
3. Render UI with callbacks
4. Create sandbox with event handlers
5. Load API spec (from URL or string)
6. Fetch saved items list (if saveEndpoint configured)

### Send Message Flow
1. Add user message to state
2. Set loading state
3. Call `sendChat` with messages, spec, context
4. On success: add assistant message, store HTML, mark dirty, load sandbox
5. Call `onHtmlGenerated` callback
6. Clear loading state

### Save Flow
1. Validate saveEndpoint and currentHtml exist
2. Set loading state
3. Call `saveByof` with HTML, messages, spec, context
4. Store lastSavedId, mark clean
5. Refresh saved items list
6. Call `onSaveComplete` callback

### Load Flow
1. Validate saveEndpoint exists
2. Set loading state
3. Call `loadByof` with id
4. Restore HTML, messages, spec
5. Load sandbox
6. Call `onLoadComplete` callback

### Reset Flow
1. Abort pending requests
2. Clear messages, currentHtml, dirty state
3. Clear sandbox
4. Update UI

## Acceptance Criteria
- [ ] `createByof` returns a valid `ByofInstance`
- [ ] Options are validated on creation
- [ ] API spec is loaded from URL or string
- [ ] Saved items list is fetched on init (if saveEndpoint configured)
- [ ] Send message flow works end-to-end
- [ ] Save flow works end-to-end
- [ ] Load flow works end-to-end
- [ ] Reset clears all state
- [ ] All callbacks are invoked at appropriate times
- [ ] Errors are handled and surfaced via callback and UI
- [ ] `destroy()` cleans up all resources
- [ ] Programmatic API methods work (`setApiSpec`, `setChatEndpoint`, etc.)
