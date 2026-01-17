# Task 03: UI Renderer

## Objective
Implement the DOM-based UI renderer that creates the chat interface and sandbox preview area.

## Requirements

### 1. Create `src/ui/styles.ts`
Define CSS as a template string with CSS variables for theming:

```typescript
export const styles = `
  .byof-container {
    --byof-primary: #0066cc;
    --byof-bg: #ffffff;
    --byof-text: #333333;
    --byof-border: #e0e0e0;
    --byof-error: #cc0000;
    --byof-success: #00aa00;
    --byof-font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    --byof-font-size: 14px;
    --byof-border-radius: 8px;
    --byof-padding: 16px;
    
    display: flex;
    flex-direction: column;
    height: 100%;
    font-family: var(--byof-font-family);
    font-size: var(--byof-font-size);
    background: var(--byof-bg);
    color: var(--byof-text);
  }
  
  /* Header */
  .byof-header { ... }
  
  /* Chat area */
  .byof-chat { ... }
  .byof-messages { ... }
  .byof-message { ... }
  .byof-message-user { ... }
  .byof-message-assistant { ... }
  .byof-input-area { ... }
  
  /* Controls */
  .byof-controls { ... }
  .byof-save-controls { ... }
  .byof-load-controls { ... }
  
  /* Sandbox area */
  .byof-sandbox { ... }
  .byof-sandbox-controls { ... }
  .byof-sandbox-iframe { ... }
  
  /* Buttons */
  .byof-btn { ... }
  .byof-btn-primary { ... }
  .byof-btn-secondary { ... }
  
  /* Error display */
  .byof-error { ... }
  
  /* Loading state */
  .byof-loading { ... }
`
```

### 2. Create `src/ui/render.ts`
Main UI renderer function:

```typescript
import { ByofTheme, ByofMessage } from '../types'
import { styles } from './styles'

export interface UIElements {
  container: HTMLElement
  header: HTMLElement
  statusIndicator: HTMLElement
  messagesContainer: HTMLElement
  inputTextarea: HTMLTextAreaElement
  sendButton: HTMLButtonElement
  resetButton: HTMLButtonElement
  saveNameInput: HTMLInputElement
  saveButton: HTMLButtonElement
  loadSelect: HTMLSelectElement
  loadButton: HTMLButtonElement
  sandboxContainer: HTMLElement
  sandboxIframe: HTMLIFrameElement
  fullscreenButton: HTMLButtonElement
  newTabButton: HTMLButtonElement
  errorDisplay: HTMLElement
}

export interface UICallbacks {
  onSend: (message: string) => void
  onReset: () => void
  onSave: (name: string) => void
  onLoad: (id: string) => void
  onFullscreen: () => void
  onNewTab: () => void
}

export function renderUI(
  mount: HTMLElement,
  theme: ByofTheme | undefined,
  callbacks: UICallbacks
): UIElements {
  // Inject styles
  injectStyles(theme)
  
  // Create container
  const container = document.createElement('div')
  container.className = 'byof-container'
  
  // Create header with title and status
  const header = createHeader()
  
  // Create chat section
  const chatSection = createChatSection(callbacks)
  
  // Create controls (reset, save, load)
  const controls = createControls(callbacks)
  
  // Create sandbox section with iframe
  const sandboxSection = createSandboxSection(callbacks)
  
  // Create error display
  const errorDisplay = createErrorDisplay()
  
  // Assemble
  container.appendChild(header)
  container.appendChild(chatSection)
  container.appendChild(controls)
  container.appendChild(sandboxSection)
  container.appendChild(errorDisplay)
  
  mount.appendChild(container)
  
  return { /* all elements */ }
}

function injectStyles(theme?: ByofTheme): void {
  // Create style element
  // Apply theme overrides as CSS variable values
}

function createHeader(): HTMLElement { ... }
function createChatSection(callbacks: UICallbacks): HTMLElement { ... }
function createControls(callbacks: UICallbacks): HTMLElement { ... }
function createSandboxSection(callbacks: UICallbacks): HTMLElement { ... }
function createErrorDisplay(): HTMLElement { ... }
```

### 3. Create `src/ui/state.ts`
UI state management:

```typescript
import { UIElements } from './render'
import { ByofMessage, SavedByofRef } from '../types'

export interface UIState {
  messages: ByofMessage[]
  currentHtml: string | null
  isLoading: boolean
  isDirty: boolean
  lastSavedId: string | null
  savedItems: Array<{ id: string; name?: string; updatedAt?: string }>
  error: string | null
}

export function createUIState(): UIState {
  return {
    messages: [],
    currentHtml: null,
    isLoading: false,
    isDirty: false,
    lastSavedId: null,
    savedItems: [],
    error: null,
  }
}

export function updateUI(elements: UIElements, state: UIState): void {
  // Update messages list
  renderMessages(elements.messagesContainer, state.messages)
  
  // Update loading state (disable/enable buttons)
  setLoadingState(elements, state.isLoading)
  
  // Update saved items dropdown
  updateSavedItemsDropdown(elements.loadSelect, state.savedItems)
  
  // Update error display
  updateErrorDisplay(elements.errorDisplay, state.error)
  
  // Update dirty indicator (optional visual cue)
}

function renderMessages(container: HTMLElement, messages: ByofMessage[]): void { ... }
function setLoadingState(elements: UIElements, isLoading: boolean): void { ... }
function updateSavedItemsDropdown(select: HTMLSelectElement, items: UIState['savedItems']): void { ... }
function updateErrorDisplay(element: HTMLElement, error: string | null): void { ... }
```

### 4. Create `src/ui/index.ts`
Export all UI components:

```typescript
export * from './render'
export * from './state'
export * from './styles'
```

## Layout Specification
- **Stacked layout**: Chat section on top, sandbox section below
- **Flexbox**: Container uses `display: flex; flex-direction: column`
- **Chat section**: `flex: 0 0 auto` with max-height and scrollable messages
- **Sandbox section**: `flex: 1 1 auto` to fill remaining space
- **Responsive**: Works in any container size the developer provides

## Theming
The theme object maps to CSS variables:
- `theme.primaryColor` -> `--byof-primary`
- `theme.backgroundColor` -> `--byof-bg`
- `theme.textColor` -> `--byof-text`
- etc.

Custom variables from `theme.customVariables` are also injected.

## Acceptance Criteria
- [ ] UI renders correctly in a container
- [ ] All interactive elements are created (buttons, inputs, textarea, select)
- [ ] CSS variables are applied from theme
- [ ] Messages can be displayed and scroll
- [ ] Loading state disables appropriate buttons
- [ ] Error display shows/hides correctly
- [ ] Sandbox iframe is created
- [ ] Fullscreen and new tab buttons exist
