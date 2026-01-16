import type { ByofMessage } from '../types'

import type { UIElements } from './render'

export interface SavedItem {
  id: string
  name?: string
  updatedAt?: string
}

export interface UIState {
  messages: ByofMessage[]
  currentHtml: string | null
  isLoading: boolean
  isDirty: boolean
  lastSavedId: string | null
  savedItems: SavedItem[]
  error: string | null
}

/**
 * Create initial UI state
 */
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

/**
 * Update the UI to reflect the current state
 */
export function updateUI(elements: UIElements, state: UIState): void {
  // Update messages list
  renderMessages(elements.messagesContainer, state.messages)

  // Update loading state (disable/enable buttons)
  setLoadingState(elements, state.isLoading)

  // Update status indicator
  updateStatusIndicator(elements, state.isLoading)

  // Update saved items dropdown
  updateSavedItemsDropdown(elements.loadSelect, state.savedItems)

  // Update error display
  updateErrorDisplay(elements.errorDisplay, state.error)

  // Update sandbox visibility
  updateSandboxVisibility(elements, state.currentHtml)
}

/**
 * Render messages into the container
 */
function renderMessages(container: HTMLElement, messages: ByofMessage[]): void {
  // Clear existing messages
  container.innerHTML = ''

  for (const message of messages) {
    const messageEl = document.createElement('div')
    messageEl.className = `byof-message byof-message-${message.role}`
    messageEl.textContent = message.content
    container.appendChild(messageEl)
  }

  // Scroll to bottom
  container.scrollTop = container.scrollHeight
}

/**
 * Set loading state on interactive elements
 */
function setLoadingState(elements: UIElements, isLoading: boolean): void {
  elements.inputTextarea.disabled = isLoading
  elements.sendButton.disabled = isLoading
  elements.resetButton.disabled = isLoading
  elements.saveButton.disabled = isLoading
  elements.saveNameInput.disabled = isLoading
  elements.loadSelect.disabled = isLoading
  elements.loadButton.disabled = isLoading
  elements.fullscreenButton.disabled = isLoading
  elements.newTabButton.disabled = isLoading
}

/**
 * Update the status indicator
 */
function updateStatusIndicator(elements: UIElements, isLoading: boolean): void {
  if (isLoading) {
    elements.statusDot.classList.add('loading')
    elements.statusText.textContent = 'Generating...'
  } else {
    elements.statusDot.classList.remove('loading')
    elements.statusText.textContent = 'Ready'
  }
}

/**
 * Update the saved items dropdown
 */
function updateSavedItemsDropdown(
  select: HTMLSelectElement,
  items: SavedItem[]
): void {
  // Remember current selection
  const currentValue = select.value

  // Clear existing options except placeholder
  while (select.options.length > 1) {
    select.remove(1)
  }

  // Add options for saved items
  for (const item of items) {
    const option = document.createElement('option')
    option.value = item.id
    option.textContent = item.name ?? `Saved ${item.id.slice(0, 8)}`
    if (item.updatedAt) {
      option.textContent += ` (${formatDate(item.updatedAt)})`
    }
    select.appendChild(option)
  }

  // Restore selection if still valid
  if (items.some((item) => item.id === currentValue)) {
    select.value = currentValue
  }
}

/**
 * Update the error display
 */
function updateErrorDisplay(element: HTMLElement, error: string | null): void {
  if (error) {
    element.textContent = error
    element.classList.add('visible')
  } else {
    element.textContent = ''
    element.classList.remove('visible')
  }
}

/**
 * Update sandbox visibility based on whether we have HTML
 */
function updateSandboxVisibility(
  elements: UIElements,
  currentHtml: string | null
): void {
  if (currentHtml) {
    elements.sandboxIframe.style.display = 'block'
    elements.sandboxPlaceholder.style.display = 'none'
  } else {
    elements.sandboxIframe.style.display = 'none'
    elements.sandboxPlaceholder.style.display = 'block'
  }
}

/**
 * Add a single message to the display (optimization for streaming)
 */
export function appendMessage(
  container: HTMLElement,
  message: ByofMessage
): void {
  const messageEl = document.createElement('div')
  messageEl.className = `byof-message byof-message-${message.role}`
  messageEl.textContent = message.content
  container.appendChild(messageEl)

  // Scroll to bottom
  container.scrollTop = container.scrollHeight
}

/**
 * Clear all messages from the display
 */
export function clearMessages(container: HTMLElement): void {
  container.innerHTML = ''
}

/**
 * Show error message
 */
export function showError(elements: UIElements, error: string): void {
  elements.errorDisplay.textContent = error
  elements.errorDisplay.classList.add('visible')
}

/**
 * Clear error message
 */
export function clearError(elements: UIElements): void {
  elements.errorDisplay.textContent = ''
  elements.errorDisplay.classList.remove('visible')
}

/**
 * Load HTML into the sandbox iframe
 */
export function loadHtmlIntoSandbox(
  iframe: HTMLIFrameElement,
  html: string
): void {
  // Use srcdoc to load HTML directly
  iframe.srcdoc = html
  iframe.style.display = 'block'
}

/**
 * Clear the sandbox iframe
 */
export function clearSandbox(elements: UIElements): void {
  elements.sandboxIframe.srcdoc = ''
  elements.sandboxIframe.style.display = 'none'
  elements.sandboxPlaceholder.style.display = 'block'
}

/**
 * Toggle fullscreen mode
 */
export function toggleFullscreen(container: HTMLElement): boolean {
  const isFullscreen = container.classList.contains('byof-fullscreen')

  if (isFullscreen) {
    container.classList.remove('byof-fullscreen')
    return false
  } else {
    container.classList.add('byof-fullscreen')
    return true
  }
}

/**
 * Format a date string for display
 */
function formatDate(dateStr: string): string {
  try {
    const date = new Date(dateStr)
    return date.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return dateStr
  }
}
