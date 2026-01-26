import { vi, beforeEach, afterEach } from 'vitest'

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
HTMLElement.prototype.requestFullscreen = vi.fn().mockResolvedValue(undefined)
document.exitFullscreen = vi.fn().mockResolvedValue(undefined)

// Mock URL.createObjectURL and revokeObjectURL
global.URL.createObjectURL = vi.fn(() => 'blob:mock-url')
global.URL.revokeObjectURL = vi.fn()

// Mock HTMLIFrameElement.sandbox (DOMSettableTokenList) for jsdom
// jsdom doesn't fully implement this property
const sandboxMockMap = new WeakMap<HTMLIFrameElement, DOMTokenList>()

Object.defineProperty(HTMLIFrameElement.prototype, 'sandbox', {
  get(this: HTMLIFrameElement) {
    let sandbox = sandboxMockMap.get(this)
    if (!sandbox) {
      sandbox = {
        value: '',
        length: 0,
        add: vi.fn(),
        remove: vi.fn(),
        contains: vi.fn(() => false),
        toggle: vi.fn(() => false),
        replace: vi.fn(() => false),
        supports: vi.fn(() => false),
        item: vi.fn(() => null),
        forEach: vi.fn(),
        entries: vi.fn(),
        keys: vi.fn(),
        values: vi.fn(),
        [Symbol.iterator]: vi.fn(),
      } as unknown as DOMTokenList
      sandboxMockMap.set(this, sandbox)
    }
    return sandbox
  },
  configurable: true,
})
