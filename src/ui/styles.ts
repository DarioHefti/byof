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
    box-sizing: border-box;
  }

  .byof-container *,
  .byof-container *::before,
  .byof-container *::after {
    box-sizing: border-box;
  }

  /* Header */
  .byof-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: var(--byof-padding);
    border-bottom: 1px solid var(--byof-border);
    flex-shrink: 0;
  }

  .byof-header-title {
    font-size: 1.1em;
    font-weight: 600;
    margin: 0;
  }

  .byof-status-indicator {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 0.85em;
    color: var(--byof-text);
    opacity: 0.7;
  }

  .byof-status-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: var(--byof-success);
  }

  .byof-status-dot.loading {
    background: var(--byof-primary);
    animation: byof-pulse 1s infinite;
  }

  @keyframes byof-pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.4; }
  }

  /* Chat area */
  .byof-chat {
    display: flex;
    flex-direction: column;
    flex: 0 0 auto;
    max-height: 300px;
    border-bottom: 1px solid var(--byof-border);
  }

  .byof-messages {
    flex: 1;
    overflow-y: auto;
    padding: var(--byof-padding);
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .byof-message {
    padding: 10px 14px;
    border-radius: var(--byof-border-radius);
    max-width: 85%;
    word-wrap: break-word;
    line-height: 1.4;
  }

  .byof-message-user {
    align-self: flex-end;
    background: var(--byof-primary);
    color: white;
  }

  .byof-message-assistant {
    align-self: flex-start;
    background: var(--byof-border);
    color: var(--byof-text);
  }

  .byof-message-system {
    align-self: center;
    background: transparent;
    color: var(--byof-text);
    opacity: 0.6;
    font-size: 0.9em;
    font-style: italic;
  }

  .byof-input-area {
    display: flex;
    gap: 8px;
    padding: var(--byof-padding);
    border-top: 1px solid var(--byof-border);
  }

  .byof-textarea {
    flex: 1;
    resize: none;
    padding: 10px 12px;
    border: 1px solid var(--byof-border);
    border-radius: var(--byof-border-radius);
    font-family: inherit;
    font-size: inherit;
    line-height: 1.4;
    min-height: 42px;
    max-height: 120px;
  }

  .byof-textarea:focus {
    outline: none;
    border-color: var(--byof-primary);
  }

  .byof-textarea:disabled {
    background: var(--byof-border);
    opacity: 0.6;
  }

  /* Controls */
  .byof-controls {
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
    padding: var(--byof-padding);
    border-bottom: 1px solid var(--byof-border);
    align-items: center;
  }

  .byof-save-controls,
  .byof-load-controls {
    display: flex;
    gap: 8px;
    align-items: center;
  }

  .byof-input {
    padding: 8px 12px;
    border: 1px solid var(--byof-border);
    border-radius: var(--byof-border-radius);
    font-family: inherit;
    font-size: inherit;
  }

  .byof-input:focus {
    outline: none;
    border-color: var(--byof-primary);
  }

  .byof-input:disabled {
    background: var(--byof-border);
    opacity: 0.6;
  }

  .byof-select {
    padding: 8px 12px;
    border: 1px solid var(--byof-border);
    border-radius: var(--byof-border-radius);
    font-family: inherit;
    font-size: inherit;
    background: var(--byof-bg);
    min-width: 150px;
  }

  .byof-select:focus {
    outline: none;
    border-color: var(--byof-primary);
  }

  .byof-select:disabled {
    background: var(--byof-border);
    opacity: 0.6;
  }

  /* Sandbox area */
  .byof-sandbox {
    display: flex;
    flex-direction: column;
    flex: 1 1 auto;
    min-height: 200px;
  }

  .byof-sandbox-controls {
    display: flex;
    gap: 8px;
    padding: 8px var(--byof-padding);
    border-bottom: 1px solid var(--byof-border);
    align-items: center;
    justify-content: flex-end;
  }

  .byof-sandbox-iframe-container {
    flex: 1;
    position: relative;
    background: #f5f5f5;
  }

  .byof-sandbox-iframe {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    border: none;
  }

  .byof-sandbox-placeholder {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    text-align: center;
    color: var(--byof-text);
    opacity: 0.5;
  }

  /* Buttons */
  .byof-btn {
    padding: 8px 16px;
    border: none;
    border-radius: var(--byof-border-radius);
    font-family: inherit;
    font-size: inherit;
    cursor: pointer;
    transition: opacity 0.15s, background 0.15s;
  }

  .byof-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .byof-btn-primary {
    background: var(--byof-primary);
    color: white;
  }

  .byof-btn-primary:hover:not(:disabled) {
    opacity: 0.9;
  }

  .byof-btn-secondary {
    background: var(--byof-border);
    color: var(--byof-text);
  }

  .byof-btn-secondary:hover:not(:disabled) {
    background: #d0d0d0;
  }

  .byof-btn-icon {
    padding: 8px;
    background: transparent;
    border: 1px solid var(--byof-border);
  }

  .byof-btn-icon:hover:not(:disabled) {
    background: var(--byof-border);
  }

  /* Error display */
  .byof-error {
    padding: var(--byof-padding);
    background: #fff0f0;
    border: 1px solid var(--byof-error);
    border-radius: var(--byof-border-radius);
    color: var(--byof-error);
    margin: var(--byof-padding);
    display: none;
  }

  .byof-error.visible {
    display: block;
  }

  /* Loading state */
  .byof-loading {
    opacity: 0.7;
    pointer-events: none;
  }

  /* Fullscreen mode */
  .byof-fullscreen {
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    z-index: 9999;
    background: var(--byof-bg);
  }

  .byof-fullscreen .byof-chat,
  .byof-fullscreen .byof-controls,
  .byof-fullscreen .byof-header {
    display: none;
  }

  .byof-fullscreen .byof-sandbox {
    height: 100%;
  }

  .byof-fullscreen .byof-sandbox-controls {
    position: absolute;
    top: 0;
    right: 0;
    z-index: 1;
    background: rgba(255, 255, 255, 0.9);
    border-radius: 0 0 0 var(--byof-border-radius);
  }
`
