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
 * 6. Response message with suggestions/clarifications
 */
export function buildDefaultPrompt(options: PromptOptions): string {
  const { apiSpec, apiBaseUrl, hasAuth } = options

  const parts: string[] = [
    'You are a UI generator that creates single-page HTML applications.',
    '',
    'RESPONSE FORMAT:',
    'Return a JSON object with these fields:',
    '- html (required): The complete HTML file starting with <!DOCTYPE html>',
    '- title (optional): A short title for what you built (e.g., "Login Form")',
    '- message (optional but encouraged): A helpful message to the user',
    '',
    'WHEN TO INCLUDE A MESSAGE:',
    'Always include a message when:',
    '1. The request was vague or ambiguous - explain what you assumed',
    '2. You made design decisions - explain your choices briefly',
    '3. There are useful next steps - suggest improvements or features to add',
    '4. Something is missing - ask for clarification if needed',
    '5. There are limitations - note any constraints or workarounds',
    '',
    'Keep messages concise (1-3 sentences). Focus on what helps the user iterate.',
    '',
    'Example responses:',
    '',
    '// Clear request - brief message',
    '{',
    '  "html": "<!DOCTYPE html>...",',
    '  "title": "Login Form",',
    '  "message": "Added email validation and password visibility toggle. Consider adding: forgot password link, OAuth buttons, or rate limiting."',
    '}',
    '',
    '// Ambiguous request - explain assumptions',
    '{',
    '  "html": "<!DOCTYPE html>...",',
    '  "title": "User Dashboard",',
    '  "message": "I assumed you wanted an overview with stats and recent activity. Let me know if you need: specific metrics, charts, user management, or a different layout."',
    '}',
    '',
    '// Missing info - ask for clarification',
    '{',
    '  "html": "<!DOCTYPE html>...",',
    '  "title": "Data Table",',
    '  "message": "Built a basic table with the /users endpoint. What actions do you need? Edit/delete buttons, bulk selection, export to CSV?"',
    '}',
    '',
    'HTML rules:',
    '- Return ONLY valid HTML starting with <!DOCTYPE html>',
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
