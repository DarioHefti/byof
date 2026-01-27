import type { ByofMessage } from '../types'

import type { UIElements } from './render'
import { updateFullscreenIcon } from './render'

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
 * Tracks which parts of the UI need updating.
 * Used internally to optimize re-renders.
 */
interface UIRenderState {
  lastMessageCount: number
  lastIsLoading: boolean
  lastSavedItemsCount: number
  lastError: string | null
  lastHasHtml: boolean
}

/** Map of elements to their render state for tracking changes */
const renderStateMap = new WeakMap<HTMLElement, UIRenderState>()

/**
 * Get or create render state for tracking UI changes
 */
function getRenderState(container: HTMLElement): UIRenderState {
  let state = renderStateMap.get(container)
  if (!state) {
    state = {
      lastMessageCount: 0,
      lastIsLoading: false,
      lastSavedItemsCount: 0,
      lastError: null,
      lastHasHtml: false,
    }
    renderStateMap.set(container, state)
  }
  return state
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
 * Update the UI to reflect the current state.
 * Uses dirty tracking to only update changed parts.
 */
export function updateUI(elements: UIElements, state: UIState): void {
  const renderState = getRenderState(elements.container)

  // Only update messages if count changed (optimization: append-only for new messages)
  if (state.messages.length !== renderState.lastMessageCount) {
    renderMessages(
      elements.messagesContainer,
      state.messages,
      renderState.lastMessageCount
    )
    renderState.lastMessageCount = state.messages.length
  }

  // Only update loading state if it changed
  if (state.isLoading !== renderState.lastIsLoading) {
    setLoadingState(elements, state.isLoading)
    updateStatusIndicator(elements, state.isLoading)
    renderState.lastIsLoading = state.isLoading
  }

  // Only update saved items if count changed
  if (state.savedItems.length !== renderState.lastSavedItemsCount) {
    updateSavedItemsDropdown(elements.loadSelect, state.savedItems)
    renderState.lastSavedItemsCount = state.savedItems.length
  }

  // Only update error display if error changed
  if (state.error !== renderState.lastError) {
    updateErrorDisplay(elements.errorDisplay, state.error)
    renderState.lastError = state.error
  }

  // Only update sandbox visibility if html presence changed
  const hasHtml = state.currentHtml !== null
  if (hasHtml !== renderState.lastHasHtml) {
    updateSandboxVisibility(elements, state.currentHtml)
    renderState.lastHasHtml = hasHtml
  }
}

/**
 * Render messages into the container.
 * Optimized to only append new messages since lastRenderedCount.
 *
 * @param container - The messages container element
 * @param messages - All messages to display
 * @param lastRenderedCount - Number of messages already rendered (for incremental updates)
 */
function renderMessages(
  container: HTMLElement,
  messages: ByofMessage[],
  lastRenderedCount: number = 0
): void {
  // If we have fewer messages than before (e.g., reset), clear and re-render all
  if (messages.length < lastRenderedCount) {
    container.innerHTML = ''
    lastRenderedCount = 0
  }

  // Only append new messages
  const newMessages = messages.slice(lastRenderedCount)
  for (const message of newMessages) {
    const messageEl = document.createElement('div')
    messageEl.className = `byof-message byof-message-${message.role}`
    messageEl.textContent = message.content
    container.appendChild(messageEl)
  }

  // Scroll to bottom if we added new messages
  if (newMessages.length > 0) {
    container.scrollTop = container.scrollHeight
  }
}

/**
 * Set loading state on interactive elements
 * Note: View controls (fullscreen, new tab, menu, chat toggle) remain enabled
 * so users can still interact with the UI while waiting for AI response
 */
function setLoadingState(elements: UIElements, isLoading: boolean): void {
  // Disable input/action elements during loading
  elements.inputTextarea.disabled = isLoading
  elements.sendButton.disabled = isLoading
  elements.resetButton.disabled = isLoading
  elements.saveButton.disabled = isLoading
  elements.saveNameInput.disabled = isLoading
  elements.loadSelect.disabled = isLoading
  elements.loadButton.disabled = isLoading
  // Note: fullscreenButton, newTabButton, menuButton, and chatToggleButton
  // intentionally NOT disabled - users should be able to use view controls while loading
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
    elements.sandboxContainer.classList.add('has-content')
  } else {
    elements.sandboxIframe.style.display = 'none'
    elements.sandboxPlaceholder.style.display = 'block'
    elements.sandboxContainer.classList.remove('has-content')
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
 * Toggle fullscreen mode and update button icon
 */
export function toggleFullscreen(
  container: HTMLElement,
  fullscreenButton?: HTMLButtonElement
): boolean {
  const isFullscreen = container.classList.contains('byof-fullscreen')

  if (isFullscreen) {
    container.classList.remove('byof-fullscreen')
    if (fullscreenButton) {
      updateFullscreenIcon(fullscreenButton, false)
    }
    return false
  } else {
    container.classList.add('byof-fullscreen')
    if (fullscreenButton) {
      updateFullscreenIcon(fullscreenButton, true)
    }
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
