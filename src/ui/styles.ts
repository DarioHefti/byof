export const styles = `
  /* ========================================
     BYOF - Modern UI Styles
     Clean, minimal, and beautiful
     ======================================== */

  .byof-container {
    /* Color System - Neutral & Sophisticated */
    --byof-primary: #2563eb;
    --byof-primary-hover: #1d4ed8;
    --byof-primary-light: #eff6ff;
    --byof-bg: #ffffff;
    --byof-bg-secondary: #f8fafc;
    --byof-bg-tertiary: #f1f5f9;
    --byof-text: #0f172a;
    --byof-text-secondary: #475569;
    --byof-text-muted: #94a3b8;
    --byof-border: #e2e8f0;
    --byof-border-light: #f1f5f9;
    --byof-error: #dc2626;
    --byof-error-bg: #fef2f2;
    --byof-success: #16a34a;
    --byof-success-light: #dcfce7;
    
    /* Typography */
    --byof-font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Inter', Roboto, sans-serif;
    --byof-font-size: 14px;
    --byof-font-size-sm: 13px;
    --byof-font-size-xs: 12px;
    --byof-line-height: 1.5;
    
    /* Spacing & Sizing */
    --byof-border-radius: 12px;
    --byof-border-radius-sm: 8px;
    --byof-border-radius-lg: 16px;
    --byof-padding: 16px;
    --byof-padding-sm: 12px;
    --byof-padding-xs: 8px;
    
    /* Shadows */
    --byof-shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.05);
    --byof-shadow: 0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1);
    --byof-shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
    --byof-shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1);
    
    /* Transitions */
    --byof-transition-fast: 150ms ease;
    --byof-transition: 200ms ease;
    --byof-transition-slow: 300ms ease;

    display: flex;
    flex-direction: column;
    flex: 1;
    min-height: 0;
    font-family: var(--byof-font-family);
    font-size: var(--byof-font-size);
    line-height: var(--byof-line-height);
    background: var(--byof-bg);
    color: var(--byof-text);
    box-sizing: border-box;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }

  .byof-container *,
  .byof-container *::before,
  .byof-container *::after {
    box-sizing: border-box;
  }

  /* ========================================
     Status Indicator - Shared styles
     ======================================== */
  .byof-status-indicator {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: var(--byof-font-size-xs);
    color: var(--byof-text-muted);
    transition: color var(--byof-transition);
  }

  .byof-status-dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: var(--byof-success);
    transition: background var(--byof-transition), transform var(--byof-transition);
  }

  .byof-status-dot.loading {
    background: var(--byof-primary);
    animation: byof-pulse 1.2s ease-in-out infinite;
  }

  @keyframes byof-pulse {
    0%, 100% { 
      opacity: 1;
      transform: scale(1);
    }
    50% { 
      opacity: 0.5;
      transform: scale(0.85);
    }
  }

  .byof-menu-btn {
    border: none;
    background: transparent;
    box-shadow: none;
  }

  .byof-menu-btn:hover:not(:disabled) {
    background: var(--byof-bg-tertiary);
  }

  /* ========================================
     Chat Area - Main Taskbar & Content
     ======================================== */
  .byof-chat {
    display: flex;
    flex-direction: column;
    flex: 0 0 auto;
    background: var(--byof-bg);
    border-bottom: 1px solid var(--byof-border-light);
    position: relative;
  }

  /* Chat Header - Now serves as the main taskbar */
  .byof-chat-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 8px var(--byof-padding);
    background: var(--byof-bg-secondary);
    user-select: none;
    border-bottom: 1px solid var(--byof-border-light);
    transition: background var(--byof-transition-fast);
    position: relative;
  }

  .byof-chat-header-left {
    display: flex;
    align-items: center;
    gap: 8px;
    cursor: pointer;
  }

  .byof-chat-header-left:hover {
    opacity: 0.8;
  }

  .byof-chat-header-right {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .byof-chat-icon {
    display: flex;
    align-items: center;
    color: var(--byof-text-muted);
  }

  .byof-chat-icon svg {
    width: 16px;
    height: 16px;
  }

  .byof-chat-title {
    font-size: var(--byof-font-size-sm);
    font-weight: 500;
    color: var(--byof-text-secondary);
  }

  .byof-chat-toggle {
    padding: 4px;
    border: none;
    background: transparent;
    box-shadow: none;
  }

  .byof-chat-toggle:hover:not(:disabled) {
    background: var(--byof-bg);
  }

  .byof-chat-toggle svg {
    width: 14px;
    height: 14px;
    pointer-events: none;
  }

  /* Chat Content - Collapsible */
  .byof-chat-content {
    display: flex;
    flex-direction: column;
    max-height: 280px;
    overflow: hidden;
    transition: max-height var(--byof-transition-slow) ease-in-out,
                opacity var(--byof-transition) ease-in-out;
  }

  .byof-chat.collapsed .byof-chat-content {
    max-height: 0;
    opacity: 0;
  }

  .byof-chat.collapsed .byof-chat-header {
    border-bottom: none;
  }

  .byof-messages {
    flex: 1;
    overflow-y: auto;
    padding: var(--byof-padding);
    display: flex;
    flex-direction: column;
    gap: 10px;
    scrollbar-width: thin;
    scrollbar-color: var(--byof-border) transparent;
  }

  .byof-messages::-webkit-scrollbar {
    width: 6px;
  }

  .byof-messages::-webkit-scrollbar-track {
    background: transparent;
  }

  .byof-messages::-webkit-scrollbar-thumb {
    background: var(--byof-border);
    border-radius: 3px;
  }

  .byof-message {
    padding: 10px 14px;
    border-radius: var(--byof-border-radius);
    max-width: 80%;
    word-wrap: break-word;
    line-height: 1.45;
    font-size: var(--byof-font-size);
    animation: byof-message-in 0.2s ease-out;
  }

  @keyframes byof-message-in {
    from {
      opacity: 0;
      transform: translateY(8px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  .byof-message-user {
    align-self: flex-end;
    background: var(--byof-primary);
    color: white;
    border-radius: var(--byof-border-radius) var(--byof-border-radius) 4px var(--byof-border-radius);
  }

  .byof-message-assistant {
    align-self: flex-start;
    background: var(--byof-bg-tertiary);
    color: var(--byof-text);
    border-radius: var(--byof-border-radius) var(--byof-border-radius) var(--byof-border-radius) 4px;
  }

  .byof-message-system {
    align-self: center;
    background: transparent;
    color: var(--byof-text-muted);
    font-size: var(--byof-font-size-xs);
    padding: 6px 12px;
  }

  /* Input Area */
  .byof-input-area {
    display: flex;
    gap: 10px;
    padding: var(--byof-padding-sm) var(--byof-padding);
    background: var(--byof-bg);
    border-top: 1px solid var(--byof-border-light);
  }

  .byof-textarea {
    flex: 1;
    resize: none;
    padding: 10px 14px;
    border: 1px solid var(--byof-border);
    border-radius: var(--byof-border-radius);
    font-family: inherit;
    font-size: inherit;
    line-height: 1.45;
    min-height: 44px;
    max-height: 120px;
    background: var(--byof-bg);
    color: var(--byof-text);
    transition: border-color var(--byof-transition), box-shadow var(--byof-transition);
  }

  .byof-textarea::placeholder {
    color: var(--byof-text-muted);
  }

  .byof-textarea:focus {
    outline: none;
    border-color: var(--byof-primary);
    box-shadow: 0 0 0 3px var(--byof-primary-light);
  }

  .byof-textarea:disabled {
    background: var(--byof-bg-secondary);
    color: var(--byof-text-muted);
    cursor: not-allowed;
  }

  /* ========================================
     Controls Panel - Collapsible Dropdown
     ======================================== */
  .byof-controls-panel {
    position: absolute;
    top: 100%;
    right: var(--byof-padding);
    width: 280px;
    max-height: 0;
    overflow: hidden;
    background: var(--byof-bg);
    border: 1px solid var(--byof-border);
    border-radius: var(--byof-border-radius);
    box-shadow: var(--byof-shadow-lg);
    z-index: 100;
    opacity: 0;
    transform: translateY(-8px);
    pointer-events: none;
    transition: max-height var(--byof-transition-slow), 
                opacity var(--byof-transition), 
                transform var(--byof-transition);
    margin-top: 4px;
  }

  .byof-controls-panel.open {
    max-height: 400px;
    opacity: 1;
    transform: translateY(0);
    pointer-events: auto;
  }

  .byof-controls-content {
    padding: var(--byof-padding);
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  .byof-controls-section {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .byof-controls-label {
    font-size: var(--byof-font-size-xs);
    font-weight: 600;
    color: var(--byof-text-muted);
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .byof-save-controls,
  .byof-load-controls {
    display: flex;
    gap: 8px;
    align-items: center;
  }

  .byof-btn-full {
    width: 100%;
    justify-content: center;
  }

  .byof-input {
    padding: 7px 12px;
    border: 1px solid var(--byof-border);
    border-radius: var(--byof-border-radius-sm);
    font-family: inherit;
    font-size: var(--byof-font-size-sm);
    background: var(--byof-bg);
    color: var(--byof-text);
    transition: border-color var(--byof-transition), box-shadow var(--byof-transition);
    min-width: 120px;
  }

  .byof-input::placeholder {
    color: var(--byof-text-muted);
  }

  .byof-input:focus {
    outline: none;
    border-color: var(--byof-primary);
    box-shadow: 0 0 0 3px var(--byof-primary-light);
  }

  .byof-input:disabled {
    background: var(--byof-bg-tertiary);
    color: var(--byof-text-muted);
    cursor: not-allowed;
  }

  .byof-select {
    padding: 7px 28px 7px 12px;
    border: 1px solid var(--byof-border);
    border-radius: var(--byof-border-radius-sm);
    font-family: inherit;
    font-size: var(--byof-font-size-sm);
    background: var(--byof-bg) url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%2394a3b8' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E") no-repeat right 10px center;
    color: var(--byof-text);
    min-width: 140px;
    cursor: pointer;
    appearance: none;
    transition: border-color var(--byof-transition), box-shadow var(--byof-transition);
  }

  .byof-select:focus {
    outline: none;
    border-color: var(--byof-primary);
    box-shadow: 0 0 0 3px var(--byof-primary-light);
  }

  .byof-select:disabled {
    background-color: var(--byof-bg-tertiary);
    color: var(--byof-text-muted);
    cursor: not-allowed;
  }

  /* ========================================
     Sandbox Area - Focus on Content
     ======================================== */
  .byof-sandbox {
    display: flex;
    flex-direction: column;
    flex: 1 1 auto;
    min-height: 200px;
    position: relative;
  }

  .byof-sandbox-controls {
    position: absolute;
    top: 12px;
    right: 12px;
    z-index: 10;
    display: flex;
    gap: 6px;
    opacity: 1;
    transition: opacity var(--byof-transition);
  }

  /* Hide controls when sandbox has content and not hovered */
  .byof-sandbox.has-content .byof-sandbox-controls {
    opacity: 0;
  }

  .byof-sandbox.has-content:hover .byof-sandbox-controls,
  .byof-sandbox-controls:focus-within {
    opacity: 1;
  }

  .byof-sandbox-iframe-container {
    flex: 1;
    position: relative;
    background: var(--byof-bg-secondary);
    border-radius: 0;
  }

  .byof-sandbox-iframe {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    border: none;
    background: white;
  }

  .byof-sandbox-placeholder {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    text-align: center;
    color: var(--byof-text-muted);
    padding: 24px;
  }

  .byof-sandbox-placeholder-icon {
    width: 48px;
    height: 48px;
    margin: 0 auto 16px;
    opacity: 0.4;
  }

  .byof-sandbox-placeholder p {
    margin: 0 0 4px 0;
    font-size: var(--byof-font-size);
  }

  .byof-sandbox-placeholder p:last-child {
    font-size: var(--byof-font-size-xs);
    opacity: 0.7;
  }

  /* ========================================
     Buttons - Clean & Purposeful
     ======================================== */
  .byof-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    padding: 8px 14px;
    border: none;
    border-radius: var(--byof-border-radius-sm);
    font-family: inherit;
    font-size: var(--byof-font-size-sm);
    font-weight: 500;
    cursor: pointer;
    transition: all var(--byof-transition-fast);
    white-space: nowrap;
  }

  .byof-btn:focus-visible {
    outline: none;
    box-shadow: 0 0 0 3px var(--byof-primary-light);
  }

  .byof-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    pointer-events: none;
  }

  .byof-btn-primary {
    background: var(--byof-primary);
    color: white;
  }

  .byof-btn-primary:hover:not(:disabled) {
    background: var(--byof-primary-hover);
  }

  .byof-btn-primary:active:not(:disabled) {
    transform: scale(0.98);
  }

  .byof-btn-secondary {
    background: var(--byof-bg);
    color: var(--byof-text-secondary);
    border: 1px solid var(--byof-border);
  }

  .byof-btn-secondary:hover:not(:disabled) {
    background: var(--byof-bg-secondary);
    border-color: var(--byof-text-muted);
  }

  .byof-btn-secondary:active:not(:disabled) {
    transform: scale(0.98);
  }

  .byof-btn-ghost {
    background: transparent;
    color: var(--byof-text-secondary);
    padding: 6px 10px;
  }

  .byof-btn-ghost:hover:not(:disabled) {
    background: var(--byof-bg-tertiary);
    color: var(--byof-text);
  }

  /* Icon Buttons */
  .byof-btn-icon {
    padding: 8px;
    background: var(--byof-bg);
    border: 1px solid var(--byof-border);
    border-radius: var(--byof-border-radius-sm);
    color: var(--byof-text-secondary);
    box-shadow: var(--byof-shadow-sm);
  }

  .byof-btn-icon:hover:not(:disabled) {
    background: var(--byof-bg-secondary);
    color: var(--byof-text);
    border-color: var(--byof-text-muted);
  }

  .byof-btn-icon:active:not(:disabled) {
    transform: scale(0.95);
  }

  .byof-btn-icon svg {
    width: 16px;
    height: 16px;
    display: block;
    pointer-events: none;
  }

  /* Send Button - Special styling */
  .byof-btn-send {
    background: var(--byof-primary);
    color: white;
    padding: 10px;
    border-radius: var(--byof-border-radius);
  }

  .byof-btn-send:hover:not(:disabled) {
    background: var(--byof-primary-hover);
  }

  .byof-btn-send svg {
    width: 18px;
    height: 18px;
  }

  /* ========================================
     Error Display - Subtle but Visible
     ======================================== */
  .byof-error {
    padding: var(--byof-padding-sm) var(--byof-padding);
    background: var(--byof-error-bg);
    border-left: 3px solid var(--byof-error);
    color: var(--byof-error);
    margin: var(--byof-padding);
    border-radius: var(--byof-border-radius-sm);
    font-size: var(--byof-font-size-sm);
    display: none;
    animation: byof-error-in 0.2s ease-out;
  }

  @keyframes byof-error-in {
    from {
      opacity: 0;
      transform: translateY(-4px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  .byof-error.visible {
    display: block;
  }

  /* ========================================
     Loading State
     ======================================== */
  .byof-loading {
    opacity: 0.7;
    pointer-events: none;
  }

  /* ========================================
     Fullscreen Mode
     ======================================== */
  .byof-fullscreen {
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    z-index: 9999;
    background: var(--byof-bg);
  }

  .byof-fullscreen .byof-chat {
    display: none;
  }

  .byof-fullscreen .byof-sandbox {
    height: 100%;
    z-index: 1;
  }

  .byof-fullscreen .byof-sandbox-controls {
    position: fixed;
    top: 16px;
    right: 16px;
    left: auto;
    width: auto;
    opacity: 1;
    background: var(--byof-bg);
    padding: 8px;
    border-radius: var(--byof-border-radius);
    box-shadow: var(--byof-shadow-lg);
    z-index: 10001;
  }

  /* ========================================
     Empty State
     ======================================== */
  .byof-empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 40px 24px;
    text-align: center;
  }

  .byof-empty-state-icon {
    width: 64px;
    height: 64px;
    margin-bottom: 16px;
    color: var(--byof-text-muted);
    opacity: 0.5;
  }

  .byof-empty-state-title {
    font-size: 15px;
    font-weight: 500;
    color: var(--byof-text-secondary);
    margin: 0 0 4px 0;
  }

  .byof-empty-state-description {
    font-size: var(--byof-font-size-sm);
    color: var(--byof-text-muted);
    margin: 0;
  }

  /* ========================================
     Tooltips (optional enhancement)
     ======================================== */
  .byof-tooltip {
    position: relative;
  }

  .byof-tooltip::after {
    content: attr(data-tooltip);
    position: absolute;
    bottom: 100%;
    left: 50%;
    transform: translateX(-50%) translateY(-4px);
    padding: 6px 10px;
    background: var(--byof-text);
    color: var(--byof-bg);
    font-size: var(--byof-font-size-xs);
    border-radius: 6px;
    white-space: nowrap;
    opacity: 0;
    pointer-events: none;
    transition: opacity var(--byof-transition), transform var(--byof-transition);
  }

  .byof-tooltip:hover::after {
    opacity: 1;
    transform: translateX(-50%) translateY(-8px);
  }

  /* ========================================
     Responsive Adjustments
     ======================================== */
  @media (max-width: 640px) {
    .byof-container {
      --byof-padding: 12px;
      --byof-font-size: 14px;
    }

    .byof-controls-panel {
      width: 100%;
      left: 0;
      right: 0;
      border-radius: 0;
    }

    .byof-input,
    .byof-select {
      flex: 1;
      min-width: 0;
    }
  }
`
