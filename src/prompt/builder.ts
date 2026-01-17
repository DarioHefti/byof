/**
 * System prompt builder for BYOF
 *
 * Provides a minimal, focused system prompt for LLM HTML generation.
 * Follows OpenAI/Anthropic system prompt conventions.
 */

/** Options for building the system prompt */
export interface PromptOptions {
  /** OpenAPI spec as JSON string */
  apiSpec?: string | undefined
  /** Base URL for API calls (e.g., "http://localhost:3001") */
  apiBaseUrl?: string | undefined
  /** List of allowed origins for CSP */
  allowedOrigins?: string[] | undefined
  /** Whether auth headers are available via window.__BYOF_AUTH__ */
  hasAuth?: boolean | undefined
}

/** Options for customizing prompt behavior */
export interface PromptConfig {
  /** Completely replace the default system prompt */
  systemPrompt?: string
  /** Append additional instructions to the default prompt */
  systemPromptSuffix?: string
  /** Custom prompt builder function */
  buildSystemPrompt?: (options: PromptOptions) => string
}

/**
 * Extracts the best API base URL from allowed origins.
 * Prefers localhost for development.
 */
export function getApiBaseUrl(allowedOrigins: string[]): string | undefined {
  if (allowedOrigins.length === 0) return undefined

  // Prefer localhost
  for (const origin of allowedOrigins) {
    if (origin.includes('localhost') || origin.includes('127.0.0.1')) {
      // Strip wildcard port if present
      return origin.replace(':*', ':3001')
    }
  }

  // Fall back to first origin
  return allowedOrigins[0]
}

/**
 * Default minimal system prompt.
 *
 * Focuses only on:
 * 1. Output format (single HTML file, no markdown)
 * 2. Self-contained (inline CSS/JS)
 * 3. API integration (base URL + spec)
 * 4. Auth headers (if available)
 * 5. Sandbox constraints (no localStorage)
 */
export function buildDefaultPrompt(options: PromptOptions): string {
  const { apiSpec, apiBaseUrl, hasAuth } = options

  const parts: string[] = [
    'Generate a single, self-contained HTML file.',
    '',
    'Output rules:',
    '- Return ONLY valid HTML starting with <!DOCTYPE html>',
    '- Do NOT wrap in markdown code blocks',
    '- Inline all CSS in <style> and JS in <script> tags',
    '- No external dependencies (no CDN links)',
  ]

  // API section - only if we have a base URL or spec
  if (apiBaseUrl || apiSpec) {
    parts.push('')
    parts.push('API integration:')

    if (apiBaseUrl) {
      parts.push(`- Base URL: ${apiBaseUrl}`)
    }

    parts.push('- Use fetch() for all data operations')
    parts.push('- localStorage/sessionStorage are BLOCKED - use the API')

    // Auth headers instructions
    if (hasAuth) {
      parts.push('')
      parts.push('Authentication:')
      parts.push('- Auth headers are available in window.__BYOF_AUTH__')
      parts.push('- Include these headers in ALL fetch() calls:')
      parts.push('```javascript')
      parts.push('fetch(url, {')
      parts.push(
        '  headers: { ...window.__BYOF_AUTH__, "Content-Type": "application/json" }'
      )
      parts.push('})')
      parts.push('```')
    }

    if (apiSpec) {
      parts.push('')
      parts.push('API specification:')
      parts.push(apiSpec)
    }
  }

  return parts.join('\n')
}

/**
 * Build the system prompt using config and options.
 *
 * Priority:
 * 1. Custom systemPrompt (full replacement)
 * 2. Custom buildSystemPrompt function
 * 3. Default prompt + optional suffix
 */
export function buildSystemPrompt(
  options: PromptOptions,
  config?: PromptConfig
): string {
  // Full replacement
  if (config?.systemPrompt) {
    return config.systemPrompt
  }

  // Custom builder
  if (config?.buildSystemPrompt) {
    return config.buildSystemPrompt(options)
  }

  // Default with optional suffix
  let prompt = buildDefaultPrompt(options)

  if (config?.systemPromptSuffix) {
    prompt += '\n\n' + config.systemPromptSuffix
  }

  return prompt
}
