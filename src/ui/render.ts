import type { ByofTheme } from '../types'

import { styles } from './styles'

const STYLE_ID = 'byof-styles'

// SVG Icons - Clean, minimal, 24x24 viewBox
const ICONS = {
  send: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 2L11 13"/><path d="M22 2L15 22L11 13L2 9L22 2Z"/></svg>`,
  expand: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 3h6v6"/><path d="M9 21H3v-6"/><path d="M21 3l-7 7"/><path d="M3 21l7-7"/></svg>`,
  collapse: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 14h6v6"/><path d="M20 10h-6V4"/><path d="M14 10l7-7"/><path d="M3 21l7-7"/></svg>`,
  externalLink: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>`,
  refresh: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/><path d="M3 21v-5h5"/></svg>`,
  save: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>`,
  folder: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>`,
  placeholder: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18"/><path d="M9 21V9"/></svg>`,
  menu: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="4" y1="6" x2="20" y2="6"/><line x1="4" y1="12" x2="20" y2="12"/><line x1="4" y1="18" x2="20" y2="18"/></svg>`,
  close: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`,
  chevronDown: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg>`,
  chevronUp: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m18 15-6-6-6 6"/></svg>`,
  message: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>`,
}

export interface UIElements {
  container: HTMLElement
  header: HTMLElement
  statusIndicator: HTMLElement
  statusDot: HTMLElement
  statusText: HTMLElement
  menuButton: HTMLButtonElement
  chatSection: HTMLElement
  chatToggleButton: HTMLButtonElement
  messagesContainer: HTMLElement
  inputTextarea: HTMLTextAreaElement
  sendButton: HTMLButtonElement
  controlsPanel: HTMLElement
  resetButton: HTMLButtonElement
  saveNameInput: HTMLInputElement
  saveButton: HTMLButtonElement
  loadSelect: HTMLSelectElement
  loadButton: HTMLButtonElement
  sandboxContainer: HTMLElement
  sandboxIframeContainer: HTMLElement
  sandboxIframe: HTMLIFrameElement
  sandboxPlaceholder: HTMLElement
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

// Track fullscreen state for icon updates
let isFullscreen = false

/**
 * Render the BYOF UI into the mount element
 */
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

  // Create header with title, status, and menu button
  const { header, statusIndicator, statusDot, statusText, menuButton } =
    createHeader()

  // Create chat section
  const { chatSection, chatToggleButton, messagesContainer, inputTextarea, sendButton } =
    createChatSection(callbacks)

  // Create controls (reset, save, load) - collapsible panel
  const {
    controlsPanel,
    resetButton,
    saveNameInput,
    saveButton,
    loadSelect,
    loadButton,
  } = createControls(callbacks, menuButton)

  // Create sandbox section with iframe
  const {
    sandboxSection,
    sandboxIframeContainer,
    sandboxIframe,
    sandboxPlaceholder,
    fullscreenButton,
    newTabButton,
  } = createSandboxSection(callbacks, container)

  // Create error display
  const errorDisplay = createErrorDisplay()

  // Assemble - controls panel goes inside header for proper absolute positioning
  header.appendChild(controlsPanel)
  container.appendChild(header)
  container.appendChild(chatSection)
  container.appendChild(sandboxSection)
  container.appendChild(errorDisplay)

  mount.appendChild(container)

  return {
    container,
    header,
    statusIndicator,
    statusDot,
    statusText,
    menuButton,
    chatSection,
    chatToggleButton,
    messagesContainer,
    inputTextarea,
    sendButton,
    controlsPanel,
    resetButton,
    saveNameInput,
    saveButton,
    loadSelect,
    loadButton,
    sandboxContainer: sandboxSection,
    sandboxIframeContainer,
    sandboxIframe,
    sandboxPlaceholder,
    fullscreenButton,
    newTabButton,
    errorDisplay,
  }
}

/**
 * Inject styles into the document head
 */
function injectStyles(theme?: ByofTheme): void {
  // Remove existing style element if present
  const existing = document.getElementById(STYLE_ID)
  if (existing) {
    existing.remove()
  }

  // Create style element
  const styleEl = document.createElement('style')
  styleEl.id = STYLE_ID

  // Build CSS variable overrides from theme
  let themeOverrides = ''
  if (theme) {
    const varMap: Array<[keyof ByofTheme, string]> = [
      ['primaryColor', '--byof-primary'],
      ['backgroundColor', '--byof-bg'],
      ['textColor', '--byof-text'],
      ['borderColor', '--byof-border'],
      ['errorColor', '--byof-error'],
      ['successColor', '--byof-success'],
      ['fontFamily', '--byof-font-family'],
      ['fontSize', '--byof-font-size'],
      ['borderRadius', '--byof-border-radius'],
      ['padding', '--byof-padding'],
    ]

    const overrides: string[] = []
    for (const [key, cssVar] of varMap) {
      const value = theme[key]
      if (typeof value === 'string') {
        overrides.push(`${cssVar}: ${value};`)
      }
    }

    // Add custom variables
    if (theme.customVariables) {
      for (const [key, value] of Object.entries(theme.customVariables)) {
        overrides.push(`--${key}: ${value};`)
      }
    }

    if (overrides.length > 0) {
      themeOverrides = `.byof-container { ${overrides.join(' ')} }`
    }
  }

  styleEl.textContent = styles + themeOverrides
  document.head.appendChild(styleEl)
}

/**
 * Create the header section with menu button
 */
function createHeader(): {
  header: HTMLElement
  statusIndicator: HTMLElement
  statusDot: HTMLElement
  statusText: HTMLElement
  menuButton: HTMLButtonElement
} {
  const header = document.createElement('header')
  header.className = 'byof-header'

  // Left side: title
  const title = document.createElement('h1')
  title.className = 'byof-header-title'
  title.textContent = 'BYOF'

  // Right side: status + menu button
  const headerRight = document.createElement('div')
  headerRight.className = 'byof-header-right'

  const statusIndicator = document.createElement('div')
  statusIndicator.className = 'byof-status-indicator'

  const statusDot = document.createElement('span')
  statusDot.className = 'byof-status-dot'

  const statusText = document.createElement('span')
  statusText.className = 'byof-status-text'
  statusText.textContent = 'Ready'

  statusIndicator.appendChild(statusDot)
  statusIndicator.appendChild(statusText)

  // Menu button (hamburger)
  const menuButton = document.createElement('button')
  menuButton.className = 'byof-btn byof-btn-icon byof-menu-btn'
  menuButton.innerHTML = ICONS.menu
  menuButton.type = 'button'
  menuButton.title = 'Toggle menu'
  menuButton.setAttribute('aria-label', 'Toggle controls menu')
  menuButton.setAttribute('aria-expanded', 'false')

  headerRight.appendChild(statusIndicator)
  headerRight.appendChild(menuButton)

  header.appendChild(title)
  header.appendChild(headerRight)

  return { header, statusIndicator, statusDot, statusText, menuButton }
}

/**
 * Create the chat section with collapsible header
 */
function createChatSection(callbacks: UICallbacks): {
  chatSection: HTMLElement
  chatToggleButton: HTMLButtonElement
  messagesContainer: HTMLElement
  inputTextarea: HTMLTextAreaElement
  sendButton: HTMLButtonElement
} {
  const chatSection = document.createElement('section')
  chatSection.className = 'byof-chat'

  // Chat header with toggle button
  const chatHeader = document.createElement('div')
  chatHeader.className = 'byof-chat-header'

  const chatHeaderLeft = document.createElement('div')
  chatHeaderLeft.className = 'byof-chat-header-left'

  const chatIcon = document.createElement('span')
  chatIcon.className = 'byof-chat-icon'
  chatIcon.innerHTML = ICONS.message

  const chatTitle = document.createElement('span')
  chatTitle.className = 'byof-chat-title'
  chatTitle.textContent = 'Chat'

  chatHeaderLeft.appendChild(chatIcon)
  chatHeaderLeft.appendChild(chatTitle)

  const chatToggleButton = document.createElement('button')
  chatToggleButton.className = 'byof-btn byof-btn-icon byof-chat-toggle'
  chatToggleButton.innerHTML = ICONS.chevronUp
  chatToggleButton.type = 'button'
  chatToggleButton.title = 'Collapse chat'
  chatToggleButton.setAttribute('aria-label', 'Toggle chat panel')
  chatToggleButton.setAttribute('aria-expanded', 'true')

  chatHeader.appendChild(chatHeaderLeft)
  chatHeader.appendChild(chatToggleButton)

  // Chat content (messages + input) - collapsible part
  const chatContent = document.createElement('div')
  chatContent.className = 'byof-chat-content'

  const messagesContainer = document.createElement('div')
  messagesContainer.className = 'byof-messages'
  messagesContainer.setAttribute('role', 'log')
  messagesContainer.setAttribute('aria-live', 'polite')
  messagesContainer.setAttribute('aria-label', 'Chat messages')

  const inputArea = document.createElement('div')
  inputArea.className = 'byof-input-area'

  const inputTextarea = document.createElement('textarea')
  inputTextarea.className = 'byof-textarea'
  inputTextarea.placeholder = 'Describe the UI you want to create...'
  inputTextarea.rows = 1
  inputTextarea.setAttribute('aria-label', 'Enter your UI description')

  const sendButton = document.createElement('button')
  sendButton.className = 'byof-btn byof-btn-send'
  sendButton.innerHTML = ICONS.send
  sendButton.type = 'button'
  sendButton.title = 'Send message'
  sendButton.setAttribute('aria-label', 'Send message')

  // Handle send on button click
  sendButton.addEventListener('click', () => {
    const message = inputTextarea.value.trim()
    if (message) {
      callbacks.onSend(message)
      inputTextarea.value = ''
      inputTextarea.style.height = 'auto'
    }
  })

  // Handle send on Enter (without Shift)
  inputTextarea.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      const message = inputTextarea.value.trim()
      if (message) {
        callbacks.onSend(message)
        inputTextarea.value = ''
        inputTextarea.style.height = 'auto'
      }
    }
  })

  // Auto-resize textarea
  inputTextarea.addEventListener('input', () => {
    inputTextarea.style.height = 'auto'
    inputTextarea.style.height = `${Math.min(inputTextarea.scrollHeight, 120)}px`
  })

  // Toggle chat collapse/expand
  let isChatCollapsed = false
  chatToggleButton.addEventListener('click', () => {
    isChatCollapsed = !isChatCollapsed
    chatSection.classList.toggle('collapsed', isChatCollapsed)
    chatToggleButton.innerHTML = isChatCollapsed
      ? ICONS.chevronDown
      : ICONS.chevronUp
    chatToggleButton.title = isChatCollapsed ? 'Expand chat' : 'Collapse chat'
    chatToggleButton.setAttribute('aria-expanded', String(!isChatCollapsed))
  })

  // Also allow clicking the header (not just button) to toggle
  chatHeader.addEventListener('click', (e) => {
    if (e.target !== chatToggleButton && !chatToggleButton.contains(e.target as Node)) {
      chatToggleButton.click()
    }
  })

  inputArea.appendChild(inputTextarea)
  inputArea.appendChild(sendButton)

  chatContent.appendChild(messagesContainer)
  chatContent.appendChild(inputArea)

  chatSection.appendChild(chatHeader)
  chatSection.appendChild(chatContent)

  return { chatSection, chatToggleButton, messagesContainer, inputTextarea, sendButton }
}

/**
 * Create the collapsible controls panel (reset, save, load)
 */
function createControls(
  callbacks: UICallbacks,
  menuButton: HTMLButtonElement
): {
  controlsPanel: HTMLElement
  resetButton: HTMLButtonElement
  saveNameInput: HTMLInputElement
  saveButton: HTMLButtonElement
  loadSelect: HTMLSelectElement
  loadButton: HTMLButtonElement
} {
  // Collapsible panel wrapper
  const controlsPanel = document.createElement('div')
  controlsPanel.className = 'byof-controls-panel'
  controlsPanel.setAttribute('aria-hidden', 'true')

  // Controls content
  const controlsContent = document.createElement('div')
  controlsContent.className = 'byof-controls-content'

  // Reset section
  const resetSection = document.createElement('div')
  resetSection.className = 'byof-controls-section'

  const resetLabel = document.createElement('span')
  resetLabel.className = 'byof-controls-label'
  resetLabel.textContent = 'Conversation'

  const resetButton = document.createElement('button')
  resetButton.className = 'byof-btn byof-btn-secondary byof-btn-full'
  resetButton.innerHTML = ICONS.refresh
  resetButton.insertAdjacentHTML('beforeend', '<span>Reset</span>')
  resetButton.type = 'button'
  resetButton.title = 'Reset conversation'
  resetButton.addEventListener('click', () => {
    callbacks.onReset()
  })

  resetSection.appendChild(resetLabel)
  resetSection.appendChild(resetButton)

  // Save section
  const saveSection = document.createElement('div')
  saveSection.className = 'byof-controls-section'

  const saveLabel = document.createElement('span')
  saveLabel.className = 'byof-controls-label'
  saveLabel.textContent = 'Save UI'

  const saveControls = document.createElement('div')
  saveControls.className = 'byof-save-controls'

  const saveNameInput = document.createElement('input')
  saveNameInput.className = 'byof-input'
  saveNameInput.type = 'text'
  saveNameInput.placeholder = 'Name (optional)'
  saveNameInput.setAttribute('aria-label', 'Name for saved UI (optional)')

  const saveButton = document.createElement('button')
  saveButton.className = 'byof-btn byof-btn-primary'
  saveButton.innerHTML = ICONS.save
  saveButton.insertAdjacentHTML('beforeend', '<span>Save</span>')
  saveButton.type = 'button'
  saveButton.title = 'Save current UI'
  saveButton.addEventListener('click', () => {
    callbacks.onSave(saveNameInput.value.trim())
  })

  saveControls.appendChild(saveNameInput)
  saveControls.appendChild(saveButton)

  saveSection.appendChild(saveLabel)
  saveSection.appendChild(saveControls)

  // Load section
  const loadSection = document.createElement('div')
  loadSection.className = 'byof-controls-section'

  const loadLabel = document.createElement('span')
  loadLabel.className = 'byof-controls-label'
  loadLabel.textContent = 'Load Saved'

  const loadControls = document.createElement('div')
  loadControls.className = 'byof-load-controls'

  const loadSelect = document.createElement('select')
  loadSelect.className = 'byof-select'
  loadSelect.setAttribute('aria-label', 'Select a previously saved UI to load')
  const placeholderOption = document.createElement('option')
  placeholderOption.value = ''
  placeholderOption.textContent = 'Select saved UI...'
  placeholderOption.disabled = true
  placeholderOption.selected = true
  loadSelect.appendChild(placeholderOption)

  const loadButton = document.createElement('button')
  loadButton.className = 'byof-btn byof-btn-secondary'
  loadButton.innerHTML = ICONS.folder
  loadButton.insertAdjacentHTML('beforeend', '<span>Load</span>')
  loadButton.type = 'button'
  loadButton.title = 'Load saved UI'
  loadButton.addEventListener('click', () => {
    const selectedId = loadSelect.value
    if (selectedId) {
      callbacks.onLoad(selectedId)
    }
  })

  loadControls.appendChild(loadSelect)
  loadControls.appendChild(loadButton)

  loadSection.appendChild(loadLabel)
  loadSection.appendChild(loadControls)

  // Assemble controls content
  controlsContent.appendChild(resetSection)
  controlsContent.appendChild(saveSection)
  controlsContent.appendChild(loadSection)

  controlsPanel.appendChild(controlsContent)

  // Toggle menu on button click
  let isMenuOpen = false
  menuButton.addEventListener('click', () => {
    isMenuOpen = !isMenuOpen
    controlsPanel.classList.toggle('open', isMenuOpen)
    menuButton.innerHTML = isMenuOpen ? ICONS.close : ICONS.menu
    menuButton.setAttribute('aria-expanded', String(isMenuOpen))
    controlsPanel.setAttribute('aria-hidden', String(!isMenuOpen))
  })

  // Close menu when clicking outside
  document.addEventListener('click', (e) => {
    if (
      isMenuOpen &&
      !controlsPanel.contains(e.target as Node) &&
      !menuButton.contains(e.target as Node)
    ) {
      isMenuOpen = false
      controlsPanel.classList.remove('open')
      menuButton.innerHTML = ICONS.menu
      menuButton.setAttribute('aria-expanded', 'false')
      controlsPanel.setAttribute('aria-hidden', 'true')
    }
  })

  return {
    controlsPanel,
    resetButton,
    saveNameInput,
    saveButton,
    loadSelect,
    loadButton,
  }
}

/**
 * Create the sandbox section with iframe
 */
function createSandboxSection(
  callbacks: UICallbacks,
  _container: HTMLElement
): {
  sandboxSection: HTMLElement
  sandboxIframeContainer: HTMLElement
  sandboxIframe: HTMLIFrameElement
  sandboxPlaceholder: HTMLElement
  fullscreenButton: HTMLButtonElement
  newTabButton: HTMLButtonElement
} {
  const sandboxSection = document.createElement('section')
  sandboxSection.className = 'byof-sandbox'

  // Controls bar (overlay on sandbox)
  const sandboxControls = document.createElement('div')
  sandboxControls.className = 'byof-sandbox-controls'

  const fullscreenButton = document.createElement('button')
  fullscreenButton.className = 'byof-btn byof-btn-icon'
  fullscreenButton.innerHTML = ICONS.expand
  fullscreenButton.type = 'button'
  fullscreenButton.title = 'Toggle fullscreen'
  fullscreenButton.setAttribute(
    'aria-label',
    'Toggle fullscreen mode for the generated UI'
  )
  fullscreenButton.addEventListener('click', () => {
    callbacks.onFullscreen()
    // Update icon based on fullscreen state
    isFullscreen = !isFullscreen
    fullscreenButton.innerHTML = isFullscreen ? ICONS.collapse : ICONS.expand
    fullscreenButton.title = isFullscreen
      ? 'Exit fullscreen'
      : 'Toggle fullscreen'
  })

  const newTabButton = document.createElement('button')
  newTabButton.className = 'byof-btn byof-btn-icon'
  newTabButton.innerHTML = ICONS.externalLink
  newTabButton.type = 'button'
  newTabButton.title = 'Open in new tab'
  newTabButton.setAttribute(
    'aria-label',
    'Open the generated UI in a new browser tab'
  )
  newTabButton.addEventListener('click', () => {
    callbacks.onNewTab()
  })

  sandboxControls.appendChild(fullscreenButton)
  sandboxControls.appendChild(newTabButton)

  // Iframe container
  const sandboxIframeContainer = document.createElement('div')
  sandboxIframeContainer.className = 'byof-sandbox-iframe-container'

  const sandboxIframe = document.createElement('iframe')
  sandboxIframe.className = 'byof-sandbox-iframe'
  sandboxIframe.title = 'Generated UI preview'
  // Note: sandbox attributes are configured by loadIntoIframe() for proper security
  sandboxIframe.style.display = 'none'

  const sandboxPlaceholder = document.createElement('div')
  sandboxPlaceholder.className = 'byof-sandbox-placeholder'
  sandboxPlaceholder.innerHTML = `
    <div class="byof-sandbox-placeholder-icon">${ICONS.placeholder}</div>
    <p>Your UI will appear here</p>
    <p>Send a message to get started</p>
  `

  sandboxIframeContainer.appendChild(sandboxIframe)
  sandboxIframeContainer.appendChild(sandboxPlaceholder)

  sandboxSection.appendChild(sandboxControls)
  sandboxSection.appendChild(sandboxIframeContainer)

  return {
    sandboxSection,
    sandboxIframeContainer,
    sandboxIframe,
    sandboxPlaceholder,
    fullscreenButton,
    newTabButton,
  }
}

/**
 * Create the error display element
 */
function createErrorDisplay(): HTMLElement {
  const errorDisplay = document.createElement('div')
  errorDisplay.className = 'byof-error'
  errorDisplay.setAttribute('role', 'alert')
  return errorDisplay
}

/**
 * Update fullscreen button icon (called from state.ts)
 */
export function updateFullscreenIcon(
  button: HTMLButtonElement,
  isFullscreenMode: boolean
): void {
  isFullscreen = isFullscreenMode
  button.innerHTML = isFullscreenMode ? ICONS.collapse : ICONS.expand
  button.title = isFullscreenMode ? 'Exit fullscreen' : 'Toggle fullscreen'
}

/**
 * Clean up injected styles
 */
export function cleanupStyles(): void {
  const existing = document.getElementById(STYLE_ID)
  if (existing) {
    existing.remove()
  }
}
