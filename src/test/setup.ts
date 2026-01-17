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
