# Task 12: Testing

## Objective
Add comprehensive unit tests and integration tests for all library components.

## Requirements

### 1. Configure Vitest

Create/update `vitest.config.ts`:

```typescript
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['src/**/*.ts'],
      exclude: ['src/**/*.test.ts', 'src/test/**'],
    },
  },
})
```

### 2. Create test setup file

Create `src/test/setup.ts`:

```typescript
import { vi, beforeEach, afterEach } from 'vitest'

// Mock fetch globally
global.fetch = vi.fn()

// Reset mocks between tests
beforeEach(() => {
  vi.clearAllMocks()
})

afterEach(() => {
  vi.restoreAllMocks()
})

// Mock ResizeObserver
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}))

// Mock requestFullscreen
HTMLElement.prototype.requestFullscreen = vi.fn()
document.exitFullscreen = vi.fn()
```

### 3. Add tests for each module

Tests should already be created in tasks 04-07. Ensure they all pass and add any missing tests.

#### Additional test file: `src/core/instance.test.ts`

```typescript
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { createByofInstance } from './instance'

// Mock all dependencies
vi.mock('../ui/render', () => ({
  renderUI: vi.fn(() => ({
    container: document.createElement('div'),
    header: document.createElement('div'),
    statusIndicator: document.createElement('div'),
    messagesContainer: document.createElement('div'),
    inputTextarea: document.createElement('textarea'),
    sendButton: document.createElement('button'),
    resetButton: document.createElement('button'),
    saveNameInput: document.createElement('input'),
    saveButton: document.createElement('button'),
    loadSelect: document.createElement('select'),
    loadButton: document.createElement('button'),
    sandboxContainer: document.createElement('div'),
    sandboxIframe: document.createElement('iframe'),
    fullscreenButton: document.createElement('button'),
    newTabButton: document.createElement('button'),
    errorDisplay: document.createElement('div'),
  })),
}))

vi.mock('../ui/state', () => ({
  createUIState: vi.fn(() => ({
    messages: [],
    currentHtml: null,
    isLoading: false,
    isDirty: false,
    lastSavedId: null,
    savedItems: [],
    error: null,
  })),
  updateUI: vi.fn(),
}))

vi.mock('../sandbox/runner', () => ({
  createSandbox: vi.fn(() => ({
    iframe: document.createElement('iframe'),
    load: vi.fn(),
    clear: vi.fn(),
    destroy: vi.fn(),
    getCurrentHtml: vi.fn(),
    openInNewTab: vi.fn(),
    enterFullscreen: vi.fn(),
    exitFullscreen: vi.fn(),
    isFullscreen: vi.fn(() => false),
  })),
}))

describe('createByofInstance', () => {
  let mount: HTMLElement
  
  beforeEach(() => {
    mount = document.createElement('div')
    document.body.appendChild(mount)
  })
  
  afterEach(() => {
    mount.remove()
  })

  it('should throw if mount is not provided', () => {
    expect(() => createByofInstance({
      mount: null as any,
      chatEndpoint: 'http://localhost/chat',
      apiSpec: '{"openapi":"3.0.0","paths":{}}',
    })).toThrow('mount')
  })

  it('should throw if chatEndpoint is not provided', () => {
    expect(() => createByofInstance({
      mount,
      chatEndpoint: '',
      apiSpec: '{"openapi":"3.0.0","paths":{}}',
    })).toThrow('chatEndpoint')
  })

  it('should throw if neither apiSpec nor apiSpecUrl is provided', () => {
    expect(() => createByofInstance({
      mount,
      chatEndpoint: 'http://localhost/chat',
    })).toThrow('apiSpec')
  })

  it('should create instance with valid options', () => {
    const instance = createByofInstance({
      mount,
      chatEndpoint: 'http://localhost/chat',
      apiSpec: '{"openapi":"3.0.0","paths":{}}',
    })

    expect(instance).toHaveProperty('destroy')
    expect(instance).toHaveProperty('setApiSpec')
    expect(instance).toHaveProperty('setChatEndpoint')
    expect(instance).toHaveProperty('setSaveEndpoint')
    expect(instance).toHaveProperty('saveCurrent')
    expect(instance).toHaveProperty('loadSaved')
    expect(instance).toHaveProperty('reset')
  })

  it('should call destroy on sandbox when destroyed', () => {
    const { createSandbox } = require('../sandbox/runner')
    const mockDestroy = vi.fn()
    createSandbox.mockReturnValue({
      iframe: document.createElement('iframe'),
      load: vi.fn(),
      clear: vi.fn(),
      destroy: mockDestroy,
      getCurrentHtml: vi.fn(),
      openInNewTab: vi.fn(),
      enterFullscreen: vi.fn(),
      exitFullscreen: vi.fn(),
      isFullscreen: vi.fn(() => false),
    })

    const instance = createByofInstance({
      mount,
      chatEndpoint: 'http://localhost/chat',
      apiSpec: '{"openapi":"3.0.0","paths":{}}',
    })

    instance.destroy()

    expect(mockDestroy).toHaveBeenCalled()
  })
})
```

### 4. Test coverage targets

Aim for the following coverage:
- `src/spec/loader.ts`: 90%+
- `src/chat/client.ts`: 90%+
- `src/save/client.ts`: 90%+
- `src/sandbox/csp.ts`: 100%
- `src/sandbox/runner.ts`: 80%+ (some browser APIs are hard to test)
- `src/core/instance.ts`: 70%+ (integration-heavy)

### 5. Create test utilities

Create `src/test/utils.ts`:

```typescript
import { vi } from 'vitest'
import { ByofMessage } from '../types'

export function createMockFetch(response: any, options: { ok?: boolean; status?: number } = {}) {
  return vi.fn().mockResolvedValue({
    ok: options.ok ?? true,
    status: options.status ?? 200,
    statusText: options.ok === false ? 'Error' : 'OK',
    json: () => Promise.resolve(response),
    text: () => Promise.resolve(JSON.stringify(response)),
  })
}

export function createMockMessage(overrides: Partial<ByofMessage> = {}): ByofMessage {
  return {
    role: 'user',
    content: 'Test message',
    ts: Date.now(),
    ...overrides,
  }
}

export function createMockApiSpec(): string {
  return JSON.stringify({
    openapi: '3.0.0',
    info: { title: 'Test API', version: '1.0.0' },
    paths: {
      '/test': { get: { summary: 'Test endpoint' } }
    }
  })
}
```

### 6. Add integration test

Create `src/test/integration.test.ts`:

```typescript
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// This is a higher-level integration test that tests the flow
// without mocking internal modules (only external dependencies like fetch)

describe('BYOF Integration', () => {
  let mount: HTMLElement
  
  beforeEach(() => {
    mount = document.createElement('div')
    document.body.appendChild(mount)
  })
  
  afterEach(() => {
    mount.remove()
    vi.restoreAllMocks()
  })

  it('should complete a full chat -> render flow', async () => {
    // Mock fetch for all requests
    global.fetch = vi.fn()
      // First call: load spec (if using URL)
      .mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve('{"openapi":"3.0.0","paths":{}}'),
      })
      // Second call: list saved items
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ items: [] }),
      })

    // Test would continue with creating instance and simulating chat...
    // This is a placeholder for more comprehensive integration tests
  })
})
```

## Acceptance Criteria
- [ ] All unit tests pass
- [ ] `npm run test` runs without errors
- [ ] `npm run test:coverage` shows coverage report
- [ ] Coverage meets targets (70%+ overall)
- [ ] Tests cover error cases and edge cases
- [ ] Mocks are properly set up and cleaned up
