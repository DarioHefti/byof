import type { ByofTheme } from '../types'

import { styles } from './styles'

const STYLE_ID = 'byof-styles'

export interface UIElements {
  container: HTMLElement
  header: HTMLElement
  statusIndicator: HTMLElement
  statusDot: HTMLElement
  statusText: HTMLElement
  messagesContainer: HTMLElement
  inputTextarea: HTMLTextAreaElement
  sendButton: HTMLButtonElement
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

  // Create header with title and status
  const { header, statusIndicator, statusDot, statusText } = createHeader()

  // Create chat section
  const { chatSection, messagesContainer, inputTextarea, sendButton } =
    createChatSection(callbacks)

  // Create controls (reset, save, load)
  const {
    controls,
    resetButton,
    saveNameInput,
    saveButton,
    loadSelect,
    loadButton,
  } = createControls(callbacks)

  // Create sandbox section with iframe
  const {
    sandboxSection,
    sandboxIframeContainer,
    sandboxIframe,
    sandboxPlaceholder,
    fullscreenButton,
    newTabButton,
  } = createSandboxSection(callbacks)

  // Create error display
  const errorDisplay = createErrorDisplay()

  // Assemble
  container.appendChild(header)
  container.appendChild(chatSection)
  container.appendChild(controls)
  container.appendChild(sandboxSection)
  container.appendChild(errorDisplay)

  mount.appendChild(container)

  return {
    container,
    header,
    statusIndicator,
    statusDot,
    statusText,
    messagesContainer,
    inputTextarea,
    sendButton,
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
 * Create the header section
 */
function createHeader(): {
  header: HTMLElement
  statusIndicator: HTMLElement
  statusDot: HTMLElement
  statusText: HTMLElement
} {
  const header = document.createElement('header')
  header.className = 'byof-header'

  const title = document.createElement('h1')
  title.className = 'byof-header-title'
  title.textContent = 'BYOF'

  const statusIndicator = document.createElement('div')
  statusIndicator.className = 'byof-status-indicator'

  const statusDot = document.createElement('span')
  statusDot.className = 'byof-status-dot'

  const statusText = document.createElement('span')
  statusText.className = 'byof-status-text'
  statusText.textContent = 'Ready'

  statusIndicator.appendChild(statusDot)
  statusIndicator.appendChild(statusText)

  header.appendChild(title)
  header.appendChild(statusIndicator)

  return { header, statusIndicator, statusDot, statusText }
}

/**
 * Create the chat section
 */
function createChatSection(callbacks: UICallbacks): {
  chatSection: HTMLElement
  messagesContainer: HTMLElement
  inputTextarea: HTMLTextAreaElement
  sendButton: HTMLButtonElement
} {
  const chatSection = document.createElement('section')
  chatSection.className = 'byof-chat'

  const messagesContainer = document.createElement('div')
  messagesContainer.className = 'byof-messages'

  const inputArea = document.createElement('div')
  inputArea.className = 'byof-input-area'

  const inputTextarea = document.createElement('textarea')
  inputTextarea.className = 'byof-textarea'
  inputTextarea.placeholder = 'Describe the UI you want to create...'
  inputTextarea.rows = 1

  const sendButton = document.createElement('button')
  sendButton.className = 'byof-btn byof-btn-primary'
  sendButton.textContent = 'Send'
  sendButton.type = 'button'

  // Handle send on button click
  sendButton.addEventListener('click', () => {
    const message = inputTextarea.value.trim()
    if (message) {
      callbacks.onSend(message)
      inputTextarea.value = ''
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
      }
    }
  })

  // Auto-resize textarea
  inputTextarea.addEventListener('input', () => {
    inputTextarea.style.height = 'auto'
    inputTextarea.style.height = `${Math.min(inputTextarea.scrollHeight, 120)}px`
  })

  inputArea.appendChild(inputTextarea)
  inputArea.appendChild(sendButton)

  chatSection.appendChild(messagesContainer)
  chatSection.appendChild(inputArea)

  return { chatSection, messagesContainer, inputTextarea, sendButton }
}

/**
 * Create the controls section (reset, save, load)
 */
function createControls(callbacks: UICallbacks): {
  controls: HTMLElement
  resetButton: HTMLButtonElement
  saveNameInput: HTMLInputElement
  saveButton: HTMLButtonElement
  loadSelect: HTMLSelectElement
  loadButton: HTMLButtonElement
} {
  const controls = document.createElement('div')
  controls.className = 'byof-controls'

  // Reset button
  const resetButton = document.createElement('button')
  resetButton.className = 'byof-btn byof-btn-secondary'
  resetButton.textContent = 'Reset'
  resetButton.type = 'button'
  resetButton.addEventListener('click', () => {
    callbacks.onReset()
  })

  // Save controls
  const saveControls = document.createElement('div')
  saveControls.className = 'byof-save-controls'

  const saveNameInput = document.createElement('input')
  saveNameInput.className = 'byof-input'
  saveNameInput.type = 'text'
  saveNameInput.placeholder = 'Name (optional)'

  const saveButton = document.createElement('button')
  saveButton.className = 'byof-btn byof-btn-primary'
  saveButton.textContent = 'Save'
  saveButton.type = 'button'
  saveButton.addEventListener('click', () => {
    callbacks.onSave(saveNameInput.value.trim())
  })

  saveControls.appendChild(saveNameInput)
  saveControls.appendChild(saveButton)

  // Load controls
  const loadControls = document.createElement('div')
  loadControls.className = 'byof-load-controls'

  const loadSelect = document.createElement('select')
  loadSelect.className = 'byof-select'
  // Add placeholder option
  const placeholderOption = document.createElement('option')
  placeholderOption.value = ''
  placeholderOption.textContent = 'Select saved...'
  placeholderOption.disabled = true
  placeholderOption.selected = true
  loadSelect.appendChild(placeholderOption)

  const loadButton = document.createElement('button')
  loadButton.className = 'byof-btn byof-btn-secondary'
  loadButton.textContent = 'Load'
  loadButton.type = 'button'
  loadButton.addEventListener('click', () => {
    const selectedId = loadSelect.value
    if (selectedId) {
      callbacks.onLoad(selectedId)
    }
  })

  loadControls.appendChild(loadSelect)
  loadControls.appendChild(loadButton)

  controls.appendChild(resetButton)
  controls.appendChild(saveControls)
  controls.appendChild(loadControls)

  return {
    controls,
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
function createSandboxSection(callbacks: UICallbacks): {
  sandboxSection: HTMLElement
  sandboxIframeContainer: HTMLElement
  sandboxIframe: HTMLIFrameElement
  sandboxPlaceholder: HTMLElement
  fullscreenButton: HTMLButtonElement
  newTabButton: HTMLButtonElement
} {
  const sandboxSection = document.createElement('section')
  sandboxSection.className = 'byof-sandbox'

  // Controls bar
  const sandboxControls = document.createElement('div')
  sandboxControls.className = 'byof-sandbox-controls'

  const fullscreenButton = document.createElement('button')
  fullscreenButton.className = 'byof-btn byof-btn-icon'
  fullscreenButton.textContent = 'Fullscreen'
  fullscreenButton.type = 'button'
  fullscreenButton.title = 'Toggle fullscreen'
  fullscreenButton.addEventListener('click', () => {
    callbacks.onFullscreen()
  })

  const newTabButton = document.createElement('button')
  newTabButton.className = 'byof-btn byof-btn-icon'
  newTabButton.textContent = 'Open in New Tab'
  newTabButton.type = 'button'
  newTabButton.title = 'Open in new tab'
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
  // Note: sandbox attributes are configured by loadIntoIframe() for proper security
  sandboxIframe.style.display = 'none'

  const sandboxPlaceholder = document.createElement('div')
  sandboxPlaceholder.className = 'byof-sandbox-placeholder'
  sandboxPlaceholder.innerHTML =
    '<p>Generated UI will appear here</p><p>Send a message to get started</p>'

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
 * Clean up injected styles
 */
export function cleanupStyles(): void {
  const existing = document.getElementById(STYLE_ID)
  if (existing) {
    existing.remove()
  }
}
