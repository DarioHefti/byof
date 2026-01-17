# Task 07: Sandbox Runner

## Objective
Implement the iframe sandbox that safely executes generated HTML with postMessage bridge for communication.

## Requirements

### 1. Create `src/sandbox/bridge.ts`
Helper script to inject into the iframe:

```typescript
/**
 * Generate the helper script that will be injected into the iframe
 * This script sets up postMessage communication with the parent
 */
export function generateBridgeScript(): string {
  // This script runs inside the iframe
  return `
(function() {
  const BYOF_BRIDGE = {
    // Report errors to parent
    reportError: function(error) {
      window.parent.postMessage({
        type: 'byof:error',
        payload: {
          message: error.message || String(error),
          stack: error.stack,
          filename: error.filename,
          lineno: error.lineno,
          colno: error.colno,
        }
      }, '*');
    },
    
    // Report height changes for resize
    reportHeight: function() {
      const height = document.documentElement.scrollHeight;
      window.parent.postMessage({
        type: 'byof:resize',
        payload: { height }
      }, '*');
    },
    
    // Report navigation attempts
    reportNavigation: function(url) {
      window.parent.postMessage({
        type: 'byof:navigate',
        payload: { url }
      }, '*');
    },
  };
  
  // Global error handler
  window.onerror = function(message, filename, lineno, colno, error) {
    BYOF_BRIDGE.reportError({
      message: message,
      filename: filename,
      lineno: lineno,
      colno: colno,
      stack: error ? error.stack : null,
    });
    return false; // Let the error propagate
  };
  
  // Unhandled promise rejection handler
  window.onunhandledrejection = function(event) {
    BYOF_BRIDGE.reportError({
      message: 'Unhandled Promise Rejection: ' + (event.reason || 'Unknown'),
      stack: event.reason && event.reason.stack,
    });
  };
  
  // Observe DOM changes and report height
  const resizeObserver = new ResizeObserver(function() {
    BYOF_BRIDGE.reportHeight();
  });
  
  // Start observing once DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
      resizeObserver.observe(document.body);
      BYOF_BRIDGE.reportHeight();
    });
  } else {
    resizeObserver.observe(document.body);
    BYOF_BRIDGE.reportHeight();
  }
  
  // Intercept link clicks for navigation reporting
  document.addEventListener('click', function(event) {
    const link = event.target.closest('a');
    if (link && link.href && link.target !== '_self') {
      event.preventDefault();
      BYOF_BRIDGE.reportNavigation(link.href);
    }
  });
  
  // Expose bridge for manual use if needed
  window.BYOF_BRIDGE = BYOF_BRIDGE;
})();
`
}
```

### 2. Create `src/sandbox/csp.ts`
CSP meta tag generation:

```typescript
/**
 * Generate CSP meta tag content for the sandbox
 * @param allowlist - Array of allowed origins for API calls
 */
export function generateCSP(allowlist: string[]): string {
  const connectSrc = allowlist.length > 0 
    ? `connect-src 'self' ${allowlist.join(' ')};`
    : "connect-src 'self';";
  
  return [
    "default-src 'self'",
    "script-src 'unsafe-inline'",  // Needed for inline scripts
    "style-src 'unsafe-inline'",   // Needed for inline styles
    "img-src 'self' data: blob:",
    "font-src 'self' data:",
    connectSrc,
    "frame-src 'none'",            // No nested iframes
    "object-src 'none'",           // No plugins
  ].join('; ')
}

/**
 * Generate the CSP meta tag HTML
 */
export function generateCSPMetaTag(allowlist: string[]): string {
  const csp = generateCSP(allowlist)
  return `<meta http-equiv="Content-Security-Policy" content="${csp}">`
}
```

### 3. Create `src/sandbox/runner.ts`
Main sandbox runner:

```typescript
import { ByofLogger, defaultLogger } from '../types'
import { generateBridgeScript } from './bridge'
import { generateCSPMetaTag } from './csp'

export interface SandboxMessage {
  type: 'byof:error' | 'byof:resize' | 'byof:navigate'
  payload: unknown
}

export interface SandboxErrorPayload {
  message: string
  stack?: string
  filename?: string
  lineno?: number
  colno?: number
}

export interface SandboxResizePayload {
  height: number
}

export interface SandboxNavigatePayload {
  url: string
}

export interface SandboxCallbacks {
  onError?: (error: SandboxErrorPayload) => void
  onResize?: (payload: SandboxResizePayload) => void
  onNavigate?: (payload: SandboxNavigatePayload) => void
}

export interface SandboxOptions {
  logger?: ByofLogger
}

export interface SandboxRunner {
  iframe: HTMLIFrameElement
  load(html: string): void
  clear(): void
  destroy(): void
  getCurrentHtml(): string | null
  openInNewTab(): void
  enterFullscreen(): void
  exitFullscreen(): void
  isFullscreen(): boolean
}

/**
 * Create a sandbox runner
 * @param container - Element to append the iframe to
 * @param allowlist - Allowed origins for API calls
 * @param callbacks - Callbacks for sandbox events
 * @param options - Optional configuration including logger
 */
export function createSandbox(
  container: HTMLElement,
  allowlist: string[],
  callbacks: SandboxCallbacks,
  options: SandboxOptions = {}
): SandboxRunner {
  const logger = options.logger ?? defaultLogger
  let currentHtml: string | null = null
  
  logger.debug('Creating sandbox', { allowlist })
  
  // Create iframe
  const iframe = document.createElement('iframe')
  iframe.className = 'byof-sandbox-iframe'
  iframe.sandbox.add('allow-scripts', 'allow-forms')
  // Note: NOT adding 'allow-same-origin' for security
  
  container.appendChild(iframe)
  
  // Listen for messages from iframe
  const messageHandler = (event: MessageEvent<unknown>) => {
    // Only accept messages from our iframe
    if (event.source !== iframe.contentWindow) return
    
    const data = event.data as SandboxMessage | null
    if (!data || typeof data.type !== 'string') return
    
    // Exhaustive switch for message types
    switch (data.type) {
      case 'byof:error':
        logger.debug('Sandbox error received', { payload: data.payload })
        callbacks.onError?.(data.payload as SandboxErrorPayload)
        break
      case 'byof:resize':
        callbacks.onResize?.(data.payload as SandboxResizePayload)
        break
      case 'byof:navigate':
        logger.debug('Sandbox navigation received', { payload: data.payload })
        callbacks.onNavigate?.(data.payload as SandboxNavigatePayload)
        break
      default: {
        // Exhaustive check - if we get here, we have an unhandled message type
        const _exhaustive: never = data.type
        logger.warn('Unknown sandbox message type', { type: _exhaustive })
      }
    }
  }
  
  window.addEventListener('message', messageHandler)
  
  return {
    iframe,
    
    load(html: string): void {
      logger.debug('Loading HTML into sandbox', { htmlLength: html.length })
      currentHtml = html
      
      // Inject CSP and bridge script into HTML
      const processedHtml = injectIntoHtml(html, allowlist)
      iframe.srcdoc = processedHtml
      logger.info('HTML loaded into sandbox')
    },
    
    clear(): void {
      logger.debug('Clearing sandbox')
      currentHtml = null
      iframe.srcdoc = ''
    },
    
    destroy(): void {
      logger.debug('Destroying sandbox')
      window.removeEventListener('message', messageHandler)
      iframe.remove()
      logger.info('Sandbox destroyed')
    },
    
    getCurrentHtml(): string | null {
      return currentHtml
    },
    
    openInNewTab(): void {
      if (!currentHtml) {
        logger.warn('Cannot open in new tab: no HTML loaded')
        return
      }
      
      logger.debug('Opening sandbox content in new tab')
      const blob = new Blob([currentHtml], { type: 'text/html' })
      const url = URL.createObjectURL(blob)
      window.open(url, '_blank')
      // Clean up the URL after a short delay
      setTimeout(() => URL.revokeObjectURL(url), 1000)
    },
    
    enterFullscreen(): void {
      logger.debug('Entering fullscreen')
      void iframe.requestFullscreen?.()
    },
    
    exitFullscreen(): void {
      if (document.fullscreenElement === iframe) {
        logger.debug('Exiting fullscreen')
        void document.exitFullscreen?.()
      }
    },
    
    isFullscreen(): boolean {
      return document.fullscreenElement === iframe
    },
  }
}

/**
 * Inject CSP meta tag and bridge script into HTML
 */
function injectIntoHtml(html: string, allowlist: string[]): string {
  const cspTag = generateCSPMetaTag(allowlist)
  const bridgeScript = `<script>${generateBridgeScript()}</script>`
  
  // Try to inject after <head> or at the start of <html>
  if (html.includes('<head>')) {
    return html.replace('<head>', `<head>${cspTag}${bridgeScript}`)
  } else if (html.includes('<html>')) {
    return html.replace('<html>', `<html><head>${cspTag}${bridgeScript}</head>`)
  } else {
    // Wrap in basic HTML structure
    return `<!DOCTYPE html><html><head>${cspTag}${bridgeScript}</head><body>${html}</body></html>`
  }
}
```

### 4. Create `src/sandbox/index.ts`

```typescript
export * from './runner'
export * from './bridge'
export * from './csp'
```

### 5. Add unit tests in `src/sandbox/csp.test.ts`

```typescript
import { describe, it, expect } from 'vitest'
import { generateCSP, generateCSPMetaTag } from './csp'

describe('generateCSP', () => {
  it('should generate CSP with allowlist', () => {
    const csp = generateCSP(['https://api.example.com', 'https://cdn.example.com'])
    
    expect(csp).toContain("connect-src 'self' https://api.example.com https://cdn.example.com")
    expect(csp).toContain("script-src 'unsafe-inline'")
    expect(csp).toContain("frame-src 'none'")
  })
  
  it('should generate CSP with empty allowlist', () => {
    const csp = generateCSP([])
    
    expect(csp).toContain("connect-src 'self'")
  })
})

describe('generateCSPMetaTag', () => {
  it('should generate valid meta tag', () => {
    const tag = generateCSPMetaTag(['https://api.example.com'])
    
    expect(tag).toMatch(/^<meta http-equiv="Content-Security-Policy"/)
    expect(tag).toContain('https://api.example.com')
  })
})
```

### 6. Add unit tests in `src/sandbox/runner.test.ts`

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createSandbox } from './runner'

// Note: Full sandbox testing requires JSDOM or similar
// These tests cover the basic structure

describe('createSandbox', () => {
  let container: HTMLElement
  
  beforeEach(() => {
    container = document.createElement('div')
    document.body.appendChild(container)
  })
  
  it('should create iframe with sandbox attributes', () => {
    const sandbox = createSandbox(container, [], {})
    
    expect(sandbox.iframe).toBeInstanceOf(HTMLIFrameElement)
    expect(sandbox.iframe.sandbox.contains('allow-scripts')).toBe(true)
    expect(sandbox.iframe.sandbox.contains('allow-forms')).toBe(true)
    expect(sandbox.iframe.sandbox.contains('allow-same-origin')).toBe(false)
  })
  
  it('should load HTML into iframe', () => {
    const sandbox = createSandbox(container, [], {})
    
    sandbox.load('<html><body>Test</body></html>')
    
    expect(sandbox.iframe.srcdoc).toContain('Test')
    expect(sandbox.iframe.srcdoc).toContain('Content-Security-Policy')
    expect(sandbox.getCurrentHtml()).toBe('<html><body>Test</body></html>')
  })
  
  it('should clear iframe', () => {
    const sandbox = createSandbox(container, [], {})
    
    sandbox.load('<html><body>Test</body></html>')
    sandbox.clear()
    
    expect(sandbox.iframe.srcdoc).toBe('')
    expect(sandbox.getCurrentHtml()).toBeNull()
  })
  
  it('should destroy and remove iframe', () => {
    const sandbox = createSandbox(container, [], {})
    
    sandbox.destroy()
    
    expect(container.querySelector('iframe')).toBeNull()
  })
})
```

## Acceptance Criteria
- [ ] Iframe is created with `sandbox="allow-scripts allow-forms"` (no `allow-same-origin`)
- [ ] CSP meta tag is injected to restrict origins to allowlist
- [ ] Bridge script is injected for postMessage communication
- [ ] Error events from iframe are captured and reported via callback
- [ ] Resize events are captured and reported via callback
- [ ] Navigation events (link clicks) are captured and reported via callback
- [ ] `load(html)` renders HTML in iframe
- [ ] `clear()` clears the iframe
- [ ] `destroy()` removes iframe and cleans up event listeners
- [ ] `openInNewTab()` opens current HTML in new browser tab
- [ ] `enterFullscreen()` and `exitFullscreen()` work
- [ ] All unit tests pass
