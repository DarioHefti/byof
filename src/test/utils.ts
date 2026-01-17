import { vi } from 'vitest'

import type { ByofMessage } from '../types'

/**
 * Creates a mock fetch function that returns the given response
 */
export function createMockFetch(
  response: unknown,
  options: { ok?: boolean; status?: number } = {}
): ReturnType<typeof vi.fn> {
  return vi.fn().mockResolvedValue({
    ok: options.ok ?? true,
    status: options.status ?? 200,
    statusText: options.ok === false ? 'Error' : 'OK',
    json: () => Promise.resolve(response),
    text: () => Promise.resolve(JSON.stringify(response)),
  })
}

/**
 * Creates a mock message object for testing
 */
export function createMockMessage(
  overrides: Partial<ByofMessage> = {}
): ByofMessage {
  return {
    role: 'user',
    content: 'Test message',
    ts: Date.now(),
    ...overrides,
  }
}

/**
 * Creates a mock OpenAPI spec for testing
 */
export function createMockApiSpec(): string {
  return JSON.stringify({
    openapi: '3.0.0',
    info: { title: 'Test API', version: '1.0.0' },
    paths: {
      '/test': { get: { summary: 'Test endpoint' } },
    },
  })
}

/**
 * Creates a mock HTML response for testing
 */
export function createMockHtml(title = 'Test App'): string {
  return `<!DOCTYPE html>
<html>
<head><title>${title}</title></head>
<body><h1>${title}</h1></body>
</html>`
}

/**
 * Waits for a specified number of milliseconds
 */
export function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/**
 * Creates a mock AbortController that can be triggered manually
 */
export function createMockAbortController(): {
  controller: AbortController
  abort: () => void
} {
  const controller = new AbortController()
  return {
    controller,
    abort: () => controller.abort(),
  }
}
