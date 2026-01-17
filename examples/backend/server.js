/**
 * BYOF Example Backend
 *
 * This is a minimal example backend that demonstrates the API contract
 * expected by the BYOF SDK. It includes:
 * - POST /api/chat - Generate HTML from chat messages
 * - POST /api/save - Save a generated UI
 * - POST /api/save/load - Load a saved UI
 * - POST /api/save/list - List saved UIs
 *
 * Configuration:
 *   1. Copy .env.example to .env
 *   2. Fill in your AI API credentials
 *   3. Run: npm start
 *
 * Environment variables (set in .env or command line):
 * - AI_API_URL: The AI API endpoint URL (required for real AI)
 *   - OpenAI: https://api.openai.com/v1/chat/completions
 *   - Azure OpenAI: https://{resource}.openai.azure.com/openai/deployments/{deployment}/chat/completions?api-version=2024-02-15-preview
 *   - Anthropic: https://api.anthropic.com/v1/messages
 *   - Any OpenAI-compatible endpoint
 * - AI_API_KEY: Your API key
 * - AI_MODEL: Model name (optional, default: gpt-4o)
 * - AI_PROVIDER: Provider type: 'openai' | 'azure' | 'anthropic' (default: auto-detect from URL)
 * - PORT: Server port (default: 3001)
 *
 * If no AI_API_URL is set, the server uses mock HTML generation.
 */

import cors from 'cors'
import express from 'express'

const app = express()
const PORT = process.env.PORT || 3001
const AI_API_URL = process.env.AI_API_URL
const AI_API_KEY = process.env.AI_API_KEY
const AI_MODEL = process.env.AI_MODEL || 'gpt-4o'

/**
 * Detect AI provider from URL
 */
function detectProvider(url) {
  if (!url) return 'mock'
  if (url.includes('anthropic.com')) return 'anthropic'
  if (
    url.includes('.cognitiveservices.azure.com') ||
    url.includes('.openai.azure.com')
  ) {
    // Check if it's the new Responses API or old Chat Completions
    if (url.includes('/responses')) return 'azure-responses'
    return 'azure'
  }
  if (url.includes('/responses')) return 'openai-responses'
  return 'openai' // Default to OpenAI-compatible
}

// Detect provider after function is defined
const AI_PROVIDER = process.env.AI_PROVIDER || detectProvider(AI_API_URL)

// Middleware
app.use(cors())
app.use(express.json({ limit: '10mb' }))

// In-memory storage for saved UIs
const savedUIs = new Map()

// ============================================================================
// Demo REST API - In-memory data store
// ============================================================================

// Seed data for users
const users = [
  {
    id: 1,
    name: 'Alice Johnson',
    email: 'alice@example.com',
    role: 'admin',
    createdAt: '2024-01-15T10:00:00Z',
  },
  {
    id: 2,
    name: 'Bob Smith',
    email: 'bob@example.com',
    role: 'user',
    createdAt: '2024-02-20T14:30:00Z',
  },
  {
    id: 3,
    name: 'Carol Williams',
    email: 'carol@example.com',
    role: 'user',
    createdAt: '2024-03-10T09:15:00Z',
  },
  {
    id: 4,
    name: 'David Brown',
    email: 'david@example.com',
    role: 'moderator',
    createdAt: '2024-04-05T16:45:00Z',
  },
  {
    id: 5,
    name: 'Eve Davis',
    email: 'eve@example.com',
    role: 'user',
    createdAt: '2024-05-12T11:20:00Z',
  },
]
let nextUserId = 6

// ============================================================================
// Demo REST API - User Endpoints
// ============================================================================

/**
 * Helper to log auth headers (for demo purposes)
 */
function logAuthHeaders(req, endpoint) {
  const auth = req.headers['authorization']
  const userId = req.headers['x-user-id']
  const tenantId = req.headers['x-tenant-id']

  if (auth || userId || tenantId) {
    console.log(`[Auth] ${endpoint}:`, {
      authorization: auth ? `${auth.substring(0, 30)}...` : 'none',
      userId: userId || 'none',
      tenantId: tenantId || 'none',
    })
  }
}

/**
 * GET /users
 * List all users
 */
app.get('/users', (req, res) => {
  console.log('[Users] GET /users')
  logAuthHeaders(req, 'GET /users')
  res.json(users)
})

/**
 * GET /users/:id
 * Get a single user by ID
 */
app.get('/users/:id', (req, res) => {
  const id = parseInt(req.params.id, 10)
  console.log('[Users] GET /users/:id', { id })
  logAuthHeaders(req, `GET /users/${id}`)

  const user = users.find((u) => u.id === id)
  if (!user) {
    return res.status(404).json({ error: 'User not found' })
  }

  res.json(user)
})

/**
 * POST /users
 * Create a new user
 */
app.post('/users', (req, res) => {
  const { name, email, role } = req.body
  console.log('[Users] POST /users', { name, email, role })
  logAuthHeaders(req, 'POST /users')

  // Validate required fields
  if (!name || !email) {
    return res.status(400).json({ error: 'name and email are required' })
  }

  // Check for duplicate email
  if (users.some((u) => u.email === email)) {
    return res.status(409).json({ error: 'Email already exists' })
  }

  const newUser = {
    id: nextUserId++,
    name,
    email,
    role: role || 'user',
    createdAt: new Date().toISOString(),
  }

  users.push(newUser)
  console.log('[Users] Created user:', newUser)

  res.status(201).json(newUser)
})

/**
 * PUT /users/:id
 * Update an existing user
 */
app.put('/users/:id', (req, res) => {
  const id = parseInt(req.params.id, 10)
  const { name, email, role } = req.body
  console.log('[Users] PUT /users/:id', { id, name, email, role })

  const userIndex = users.findIndex((u) => u.id === id)
  if (userIndex === -1) {
    return res.status(404).json({ error: 'User not found' })
  }

  // Check for duplicate email (excluding current user)
  if (email && users.some((u) => u.email === email && u.id !== id)) {
    return res.status(409).json({ error: 'Email already exists' })
  }

  // Update user fields
  const user = users[userIndex]
  if (name !== undefined) user.name = name
  if (email !== undefined) user.email = email
  if (role !== undefined) user.role = role

  console.log('[Users] Updated user:', user)

  res.json(user)
})

/**
 * DELETE /users/:id
 * Delete a user
 */
app.delete('/users/:id', (req, res) => {
  const id = parseInt(req.params.id, 10)
  console.log('[Users] DELETE /users/:id', { id })

  const userIndex = users.findIndex((u) => u.id === id)
  if (userIndex === -1) {
    return res.status(404).json({ error: 'User not found' })
  }

  const deletedUser = users.splice(userIndex, 1)[0]
  console.log('[Users] Deleted user:', deletedUser)

  res.status(204).send()
})

// ============================================================================
// Chat Endpoint
// ============================================================================

/**
 * POST /api/chat
 *
 * Expected request body (ChatRequest):
 * {
 *   messages: Array<{ role: string; content: string }>
 *   systemPrompt: string  // Built by the BYOF library
 *   apiSpec?: string      // For reference
 *   context?: { projectId?: string; userId?: string }
 * }
 *
 * Response (ChatResponse):
 * {
 *   html: string
 *   title?: string
 *   warnings?: string[]
 * }
 */
app.post('/api/chat', async (req, res) => {
  const { messages, systemPrompt, apiSpec, context } = req.body

  console.log('[Chat] Received request:', {
    messageCount: messages?.length,
    systemPromptLength: systemPrompt?.length,
    hasApiSpec: !!apiSpec,
    context,
  })

  // Validate request
  if (!messages || !Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({
      error: 'messages array is required and must not be empty',
    })
  }

  if (!systemPrompt) {
    return res.status(400).json({
      error: 'systemPrompt is required',
    })
  }

  // Get the last user message
  const lastUserMessage = [...messages].reverse().find((m) => m.role === 'user')
  const userRequest = lastUserMessage?.content || 'a simple UI'

  let html, title
  const warnings = []

  // Use AI if configured, otherwise use mock
  if (AI_API_URL && AI_API_KEY) {
    try {
      const result = await generateWithAI(messages, systemPrompt)
      html = result.html
      title = result.title
      console.log(`[Chat] Generated with ${AI_PROVIDER}`)
    } catch (error) {
      console.error('[Chat] AI error:', error)
      console.error('[Chat] AI error message:', error.message)
      console.error('[Chat] AI error stack:', error.stack)
      return res
        .status(500)
        .json({ error: 'AI generation failed: ' + error.message })
    }
  } else {
    // Use mock generation
    const result = generateMockHtml(userRequest, apiSpec, context)
    html = result.html
    title = result.title
    warnings.push(
      'Using mock generation. Set AI_API_URL and AI_API_KEY for real AI.'
    )
  }

  // Check if API spec was provided
  if (!apiSpec) {
    warnings.push('No API specification provided. Generated UI is generic.')
  }

  console.log('[Chat] Generated response:', { title, htmlLength: html.length })

  res.json({
    html,
    title,
    warnings: warnings.length > 0 ? warnings : undefined,
  })
})

// ============================================================================
// Save Endpoint
// ============================================================================

/**
 * POST /api/save
 *
 * Expected request body (SaveRequest):
 * {
 *   name?: string
 *   html: string
 *   messages?: ByofMessage[]
 *   apiSpec?: string
 *   context?: { projectId?: string; userId?: string }
 *   meta?: { createdAt?: string; byofVersion?: string }
 * }
 *
 * Response (SaveResponse):
 * {
 *   id: string
 *   name?: string
 *   updatedAt?: string
 * }
 */
app.post('/api/save', (req, res) => {
  const { name, html, messages, apiSpec, context, meta } = req.body

  console.log('[Save] Received request:', {
    name,
    htmlLength: html?.length,
    messageCount: messages?.length,
    context,
  })

  // Validate request
  if (!html) {
    return res.status(400).json({
      error: 'html is required',
    })
  }

  // Generate ID
  const id = generateId()
  const updatedAt = new Date().toISOString()

  // Store the UI
  savedUIs.set(id, {
    id,
    name,
    html,
    messages,
    apiSpec,
    context,
    meta,
    updatedAt,
  })

  console.log('[Save] Saved UI:', { id, name })

  const response = { id, updatedAt }
  if (name) {
    response.name = name
  }

  res.json(response)
})

// ============================================================================
// Load Endpoint
// ============================================================================

/**
 * POST /api/save/load
 *
 * Expected request body (LoadRequest):
 * {
 *   id: string
 * }
 *
 * Response (LoadResponse):
 * {
 *   id: string
 *   name?: string
 *   html: string
 *   messages?: ByofMessage[]
 *   apiSpec?: string
 *   updatedAt?: string
 * }
 */
app.post('/api/save/load', (req, res) => {
  const { id } = req.body

  console.log('[Load] Received request:', { id })

  // Validate request
  if (!id) {
    return res.status(400).json({
      error: 'id is required',
    })
  }

  // Find the saved UI
  const savedUI = savedUIs.get(id)
  if (!savedUI) {
    return res.status(404).json({
      error: 'UI not found',
    })
  }

  console.log('[Load] Found UI:', { id, name: savedUI.name })

  // Build response with only defined fields
  const response = {
    id: savedUI.id,
    html: savedUI.html,
  }

  if (savedUI.name !== undefined) {
    response.name = savedUI.name
  }
  if (savedUI.messages !== undefined) {
    response.messages = savedUI.messages
  }
  if (savedUI.apiSpec !== undefined) {
    response.apiSpec = savedUI.apiSpec
  }
  if (savedUI.updatedAt !== undefined) {
    response.updatedAt = savedUI.updatedAt
  }

  res.json(response)
})

// ============================================================================
// List Endpoint
// ============================================================================

/**
 * POST /api/save/list
 *
 * Expected request body (ListRequest):
 * {
 *   projectId?: string
 * }
 *
 * Response (ListResponse):
 * {
 *   items: Array<{ id: string; name?: string; updatedAt?: string }>
 * }
 */
app.post('/api/save/list', (req, res) => {
  const { projectId } = req.body

  console.log('[List] Received request:', { projectId })

  // Get all saved UIs, optionally filtered by projectId
  let items = Array.from(savedUIs.values())

  if (projectId) {
    items = items.filter((ui) => ui.context?.projectId === projectId)
  }

  // Map to response format
  const responseItems = items.map((ui) => {
    const item = { id: ui.id }
    if (ui.name !== undefined) {
      item.name = ui.name
    }
    if (ui.updatedAt !== undefined) {
      item.updatedAt = ui.updatedAt
    }
    return item
  })

  // Sort by updatedAt descending
  responseItems.sort((a, b) => {
    if (!a.updatedAt) return 1
    if (!b.updatedAt) return -1
    return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  })

  console.log('[List] Returning items:', { count: responseItems.length })

  res.json({ items: responseItems })
})

// ============================================================================
// Health Check
// ============================================================================

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// Debug endpoint to check AI configuration
app.get('/api/config', (req, res) => {
  res.json({
    aiConfigured: !!(AI_API_URL && AI_API_KEY),
    provider: AI_PROVIDER,
    model: AI_MODEL,
    apiUrl: AI_API_URL
      ? AI_API_URL.replace(/api-key=[^&]+/, 'api-key=***').substring(0, 80) +
        '...'
      : null,
  })
})

// ============================================================================
// AI Generation
// ============================================================================

/**
 * Generate HTML using the configured AI provider
 *
 * The system prompt is now provided by the BYOF library, not built here.
 */
async function generateWithAI(messages, systemPrompt) {
  if (AI_PROVIDER === 'anthropic') {
    return await callAnthropic(systemPrompt, messages)
  } else if (
    AI_PROVIDER === 'azure-responses' ||
    AI_PROVIDER === 'openai-responses'
  ) {
    return await callResponsesAPI(systemPrompt, messages)
  } else {
    // OpenAI Chat Completions, Azure Chat Completions, or OpenAI-compatible
    return await callOpenAI(systemPrompt, messages)
  }
}

/**
 * Call OpenAI or Azure OpenAI API
 */
async function callOpenAI(systemPrompt, messages) {
  const headers = {
    'Content-Type': 'application/json',
  }

  // Azure uses api-key header, OpenAI uses Authorization
  if (AI_PROVIDER === 'azure') {
    headers['api-key'] = AI_API_KEY
  } else {
    headers['Authorization'] = `Bearer ${AI_API_KEY}`
  }

  const body = {
    messages: [
      { role: 'system', content: systemPrompt },
      ...messages.map((m) => ({ role: m.role, content: m.content })),
    ],
    temperature: 0.7,
    max_tokens: 4096,
  }

  // Only add model for non-Azure (Azure uses deployment in URL)
  if (AI_PROVIDER !== 'azure') {
    body.model = AI_MODEL
  }

  console.log('[AI] Calling OpenAI-compatible API:', AI_API_URL)

  const response = await fetch(AI_API_URL, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  })

  if (!response.ok) {
    const errorText = await response.text()
    console.error('[AI] API error:', response.status, errorText)
    throw new Error(`API returned ${response.status}: ${errorText}`)
  }

  const data = await response.json()
  const content = data.choices?.[0]?.message?.content

  if (!content) {
    throw new Error('No content in AI response')
  }

  // Extract HTML and title
  const html = extractHtml(content)
  const title = extractTitle(html)

  return { html, title }
}

/**
 * Call OpenAI/Azure Responses API (new format)
 */
async function callResponsesAPI(systemPrompt, messages) {
  const headers = {
    'Content-Type': 'application/json',
  }

  // Azure uses api-key header
  if (AI_PROVIDER === 'azure-responses') {
    headers['api-key'] = AI_API_KEY
  } else {
    headers['Authorization'] = `Bearer ${AI_API_KEY}`
  }

  // Build input array for Responses API
  const input = [
    { role: 'system', content: systemPrompt },
    ...messages.map((m) => ({ role: m.role, content: m.content })),
  ]

  const body = {
    model: AI_MODEL,
    input: input,
  }

  console.log('[AI] Calling Responses API:', AI_API_URL)
  console.log('[AI] Provider:', AI_PROVIDER)
  console.log('[AI] Model:', AI_MODEL)

  const response = await fetch(AI_API_URL, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  })

  if (!response.ok) {
    const errorText = await response.text()
    console.error('[AI] API error:', response.status, errorText)
    throw new Error(`API returned ${response.status}: ${errorText}`)
  }

  const data = await response.json()

  // Responses API returns output_text or output array
  let content = data.output_text
  if (!content && data.output) {
    // Find the message output
    const messageOutput = data.output.find((o) => o.type === 'message')
    if (messageOutput && messageOutput.content) {
      // Handle both 'text' and 'output_text' content types
      const textContent = messageOutput.content.find(
        (c) => c.type === 'text' || c.type === 'output_text'
      )
      content = textContent?.text
    }
  }

  if (!content) {
    // Log full response for debugging
    console.error(
      '[AI] Unexpected response format:',
      JSON.stringify(data, null, 2)
    )
    // Try to extract from any nested structure we might have missed
    if (data.output && Array.isArray(data.output)) {
      for (const item of data.output) {
        if (item.content && Array.isArray(item.content)) {
          for (const c of item.content) {
            if (c.text) {
              content = c.text
              console.log('[AI] Found content via fallback extraction')
              break
            }
          }
        }
        if (content) break
      }
    }
  }

  if (!content) {
    throw new Error('No content in AI response')
  }

  // Extract HTML and title
  const html = extractHtml(content)
  const title = extractTitle(html)

  return { html, title }
}

/**
 * Call Anthropic Claude API
 */
async function callAnthropic(systemPrompt, messages) {
  const headers = {
    'Content-Type': 'application/json',
    'x-api-key': AI_API_KEY,
    'anthropic-version': '2023-06-01',
  }

  const body = {
    model: AI_MODEL || 'claude-sonnet-4-20250514',
    max_tokens: 4096,
    system: systemPrompt,
    messages: messages.map((m) => ({ role: m.role, content: m.content })),
  }

  console.log('[AI] Calling Anthropic API:', AI_API_URL)

  const response = await fetch(AI_API_URL, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  })

  if (!response.ok) {
    const errorText = await response.text()
    console.error('[AI] API error:', response.status, errorText)
    throw new Error(`API returned ${response.status}: ${errorText}`)
  }

  const data = await response.json()
  const content = data.content?.[0]?.text

  if (!content) {
    throw new Error('No content in AI response')
  }

  // Extract HTML and title
  const html = extractHtml(content)
  const title = extractTitle(html)

  return { html, title }
}

/**
 * Extract HTML from AI response (handles code blocks if present)
 */
function extractHtml(content) {
  // Remove markdown code blocks if present
  let html = content.trim()

  // Handle ```html ... ``` blocks
  const codeBlockMatch = html.match(/```(?:html)?\s*([\s\S]*?)```/)
  if (codeBlockMatch) {
    html = codeBlockMatch[1].trim()
  }

  // Ensure it starts with DOCTYPE or html tag
  if (
    !html.toLowerCase().startsWith('<!doctype') &&
    !html.toLowerCase().startsWith('<html')
  ) {
    // Try to find the HTML start
    const htmlStart = html.indexOf('<!DOCTYPE')
    if (htmlStart === -1) {
      const htmlTagStart = html.indexOf('<html')
      if (htmlTagStart !== -1) {
        html = html.substring(htmlTagStart)
      }
    } else {
      html = html.substring(htmlStart)
    }
  }

  return html
}

/**
 * Extract title from HTML
 */
function extractTitle(html) {
  const titleMatch = html.match(/<title>([^<]+)<\/title>/i)
  return titleMatch ? titleMatch[1] : 'Generated UI'
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Generate a simple unique ID
 */
function generateId() {
  return `ui_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
}

/**
 * Generate mock HTML based on user request
 *
 * In production, this would call an LLM to generate the HTML.
 * This mock version creates simple example UIs based on keywords.
 */
function generateMockHtml(userRequest, apiSpec, context) {
  const request = userRequest.toLowerCase()

  // Determine what kind of UI to generate based on keywords
  let title = 'Generated UI'
  let content = ''

  if (request.includes('dashboard') || request.includes('stats')) {
    title = 'Dashboard'
    content = generateDashboard(context)
  } else if (request.includes('form') || request.includes('input')) {
    title = 'Form'
    content = generateForm(context)
  } else if (
    request.includes('table') ||
    request.includes('list') ||
    request.includes('data')
  ) {
    title = 'Data Table'
    content = generateTable(context)
  } else if (request.includes('card') || request.includes('profile')) {
    title = 'Profile Card'
    content = generateCard(context)
  } else if (request.includes('chart') || request.includes('graph')) {
    title = 'Chart View'
    content = generateChart(context)
  } else {
    // Default: generate based on first few words
    title = userRequest.split(' ').slice(0, 3).join(' ')
    content = generateGeneric(userRequest, context)
  }

  const html = wrapInHtml(title, content)
  return { html, title }
}

/**
 * Wrap content in a complete HTML document
 */
function wrapInHtml(title, content) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(title)}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      min-height: 100vh;
      padding: 20px;
      color: #333;
    }
    .container {
      max-width: 800px;
      margin: 0 auto;
      background: white;
      border-radius: 16px;
      box-shadow: 0 20px 60px rgba(0,0,0,0.3);
      padding: 30px;
    }
    h1 {
      color: #333;
      margin-bottom: 20px;
      font-size: 24px;
    }
    h2 {
      color: #555;
      margin: 20px 0 10px;
      font-size: 18px;
    }
    .card {
      background: #f8f9fa;
      border-radius: 12px;
      padding: 20px;
      margin: 15px 0;
    }
    .grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
      gap: 15px;
      margin: 20px 0;
    }
    .stat {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 20px;
      border-radius: 12px;
      text-align: center;
    }
    .stat-value {
      font-size: 32px;
      font-weight: bold;
    }
    .stat-label {
      font-size: 12px;
      opacity: 0.9;
      margin-top: 5px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 20px 0;
    }
    th, td {
      padding: 12px;
      text-align: left;
      border-bottom: 1px solid #eee;
    }
    th {
      background: #f8f9fa;
      font-weight: 600;
    }
    tr:hover {
      background: #f8f9fa;
    }
    input, select, textarea {
      width: 100%;
      padding: 12px;
      border: 2px solid #e0e0e0;
      border-radius: 8px;
      font-size: 14px;
      margin: 8px 0 16px;
      transition: border-color 0.2s;
    }
    input:focus, select:focus, textarea:focus {
      outline: none;
      border-color: #667eea;
    }
    label {
      font-weight: 500;
      color: #555;
    }
    button {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      border: none;
      padding: 12px 24px;
      border-radius: 8px;
      font-size: 14px;
      cursor: pointer;
      transition: transform 0.2s, box-shadow 0.2s;
    }
    button:hover {
      transform: translateY(-2px);
      box-shadow: 0 5px 20px rgba(102, 126, 234, 0.4);
    }
    .avatar {
      width: 80px;
      height: 80px;
      border-radius: 50%;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-size: 32px;
      font-weight: bold;
      margin: 0 auto 15px;
    }
    .text-center { text-align: center; }
    .text-muted { color: #888; font-size: 14px; }
    .chart-placeholder {
      height: 200px;
      background: linear-gradient(135deg, #f5f7fa 0%, #e4e8ec 100%);
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #888;
    }
    .bar-chart {
      display: flex;
      align-items: flex-end;
      gap: 10px;
      height: 150px;
      padding: 20px;
    }
    .bar {
      flex: 1;
      background: linear-gradient(180deg, #667eea 0%, #764ba2 100%);
      border-radius: 4px 4px 0 0;
      min-width: 30px;
    }
    .badge {
      display: inline-block;
      padding: 4px 12px;
      background: #e8f4f8;
      color: #0066cc;
      border-radius: 20px;
      font-size: 12px;
      margin: 2px;
    }
    .badge-success { background: #e8f8e8; color: #00aa00; }
    .badge-warning { background: #fff8e8; color: #cc8800; }
  </style>
</head>
<body>
  <div class="container">
    ${content}
  </div>
</body>
</html>`
}

/**
 * Generate a dashboard UI
 */
function generateDashboard(context) {
  const projectId = context?.projectId || 'Demo'
  return `
    <h1>Dashboard - ${escapeHtml(projectId)}</h1>
    <div class="grid">
      <div class="stat">
        <div class="stat-value">1,234</div>
        <div class="stat-label">Total Users</div>
      </div>
      <div class="stat">
        <div class="stat-value">$45.2K</div>
        <div class="stat-label">Revenue</div>
      </div>
      <div class="stat">
        <div class="stat-value">89%</div>
        <div class="stat-label">Uptime</div>
      </div>
      <div class="stat">
        <div class="stat-value">142</div>
        <div class="stat-label">Active Now</div>
      </div>
    </div>
    <h2>Weekly Activity</h2>
    <div class="bar-chart">
      <div class="bar" style="height: 60%"></div>
      <div class="bar" style="height: 80%"></div>
      <div class="bar" style="height: 45%"></div>
      <div class="bar" style="height: 90%"></div>
      <div class="bar" style="height: 70%"></div>
      <div class="bar" style="height: 85%"></div>
      <div class="bar" style="height: 95%"></div>
    </div>
    <h2>Recent Activity</h2>
    <div class="card">
      <p><strong>User signup</strong> - john@example.com joined 5 min ago</p>
    </div>
    <div class="card">
      <p><strong>Payment received</strong> - $99.00 from customer #1234</p>
    </div>
    <div class="card">
      <p><strong>System update</strong> - Version 2.1.0 deployed successfully</p>
    </div>
  `
}

/**
 * Generate a form UI
 */
function generateForm(context) {
  return `
    <h1>Contact Form</h1>
    <form onsubmit="event.preventDefault(); alert('Form submitted!');">
      <label for="name">Full Name</label>
      <input type="text" id="name" placeholder="Enter your name" required>

      <label for="email">Email Address</label>
      <input type="email" id="email" placeholder="you@example.com" required>

      <label for="subject">Subject</label>
      <select id="subject">
        <option value="">Select a subject...</option>
        <option value="general">General Inquiry</option>
        <option value="support">Technical Support</option>
        <option value="billing">Billing Question</option>
        <option value="feedback">Feedback</option>
      </select>

      <label for="message">Message</label>
      <textarea id="message" rows="4" placeholder="How can we help you?"></textarea>

      <button type="submit">Send Message</button>
    </form>
  `
}

/**
 * Generate a table UI
 */
function generateTable(context) {
  return `
    <h1>User Directory</h1>
    <table>
      <thead>
        <tr>
          <th>Name</th>
          <th>Email</th>
          <th>Role</th>
          <th>Status</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>Alice Johnson</td>
          <td>alice@example.com</td>
          <td><span class="badge">Admin</span></td>
          <td><span class="badge badge-success">Active</span></td>
        </tr>
        <tr>
          <td>Bob Smith</td>
          <td>bob@example.com</td>
          <td><span class="badge">Editor</span></td>
          <td><span class="badge badge-success">Active</span></td>
        </tr>
        <tr>
          <td>Carol Williams</td>
          <td>carol@example.com</td>
          <td><span class="badge">Viewer</span></td>
          <td><span class="badge badge-warning">Pending</span></td>
        </tr>
        <tr>
          <td>David Brown</td>
          <td>david@example.com</td>
          <td><span class="badge">Editor</span></td>
          <td><span class="badge badge-success">Active</span></td>
        </tr>
        <tr>
          <td>Eve Davis</td>
          <td>eve@example.com</td>
          <td><span class="badge">Viewer</span></td>
          <td><span class="badge badge-success">Active</span></td>
        </tr>
      </tbody>
    </table>
    <button onclick="alert('Export functionality would go here')">Export to CSV</button>
  `
}

/**
 * Generate a profile card UI
 */
function generateCard(context) {
  const userId = context?.userId || 'User'
  return `
    <div class="text-center">
      <div class="avatar">${userId.charAt(0).toUpperCase()}</div>
      <h1>${escapeHtml(userId)}</h1>
      <p class="text-muted">Software Developer</p>
      <div style="margin: 20px 0;">
        <span class="badge">JavaScript</span>
        <span class="badge">TypeScript</span>
        <span class="badge">React</span>
        <span class="badge">Node.js</span>
      </div>
    </div>
    <div class="grid">
      <div class="card text-center">
        <div style="font-size: 24px; font-weight: bold;">142</div>
        <div class="text-muted">Projects</div>
      </div>
      <div class="card text-center">
        <div style="font-size: 24px; font-weight: bold;">2.3K</div>
        <div class="text-muted">Followers</div>
      </div>
      <div class="card text-center">
        <div style="font-size: 24px; font-weight: bold;">891</div>
        <div class="text-muted">Following</div>
      </div>
    </div>
    <div class="card">
      <h2>About</h2>
      <p>Passionate developer with 5+ years of experience building web applications. Love working with modern JavaScript frameworks and exploring new technologies.</p>
    </div>
    <button style="width: 100%;">Edit Profile</button>
  `
}

/**
 * Generate a chart UI
 */
function generateChart(context) {
  return `
    <h1>Analytics Overview</h1>
    <div class="card">
      <h2>Revenue Trend</h2>
      <div class="bar-chart">
        <div class="bar" style="height: 40%"></div>
        <div class="bar" style="height: 55%"></div>
        <div class="bar" style="height: 65%"></div>
        <div class="bar" style="height: 50%"></div>
        <div class="bar" style="height: 75%"></div>
        <div class="bar" style="height: 85%"></div>
        <div class="bar" style="height: 100%"></div>
      </div>
      <p class="text-center text-muted">Jan - Jul 2024</p>
    </div>
    <div class="grid">
      <div class="stat">
        <div class="stat-value">+24%</div>
        <div class="stat-label">Growth</div>
      </div>
      <div class="stat">
        <div class="stat-value">$128K</div>
        <div class="stat-label">Total Revenue</div>
      </div>
    </div>
    <div class="card">
      <h2>Top Products</h2>
      <table>
        <tr>
          <td>Product A</td>
          <td><strong>$45,200</strong></td>
        </tr>
        <tr>
          <td>Product B</td>
          <td><strong>$38,100</strong></td>
        </tr>
        <tr>
          <td>Product C</td>
          <td><strong>$28,500</strong></td>
        </tr>
      </table>
    </div>
  `
}

/**
 * Generate a generic UI based on the request
 */
function generateGeneric(userRequest, context) {
  return `
    <h1>Generated UI</h1>
    <div class="card">
      <h2>Your Request</h2>
      <p>"${escapeHtml(userRequest)}"</p>
    </div>
    <div class="card">
      <p>This is a demo UI generated by the BYOF example backend.</p>
      <p class="text-muted" style="margin-top: 10px;">
        In production, this would be generated by an LLM based on your request
        and the provided API specification.
      </p>
    </div>
    <div class="grid">
      <div class="stat">
        <div class="stat-value">1</div>
        <div class="stat-label">Request</div>
      </div>
      <div class="stat">
        <div class="stat-value">1</div>
        <div class="stat-label">Response</div>
      </div>
    </div>
    <button onclick="alert('Action triggered!')">Take Action</button>
  `
}

/**
 * Escape HTML special characters
 */
function escapeHtml(str) {
  if (!str) return ''
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

// ============================================================================
// Start Server
// ============================================================================

app.listen(PORT, () => {
  const aiStatus =
    AI_API_URL && AI_API_KEY
      ? `${AI_PROVIDER.toUpperCase()} (${AI_MODEL})`
      : 'Mock (set AI_API_URL & AI_API_KEY for real AI)'

  console.log(`
╔════════════════════════════════════════════════════════════════╗
║                                                                ║
║   BYOF Example Backend                                         ║
║                                                                ║
║   Server running at: http://localhost:${PORT}                    ║
║   AI Provider: ${aiStatus.padEnd(46)}║
║                                                                ║
║   Demo REST API (for generated UIs to call):                   ║
║   - GET    /users        - List all users                      ║
║   - POST   /users        - Create a user                       ║
║   - GET    /users/:id    - Get user by ID                      ║
║   - PUT    /users/:id    - Update user                         ║
║   - DELETE /users/:id    - Delete user                         ║
║                                                                ║
║   BYOF SDK Endpoints:                                          ║
║   - POST /api/chat       - Generate HTML from messages         ║
║   - POST /api/save       - Save a generated UI                 ║
║   - POST /api/save/load  - Load a saved UI                     ║
║   - POST /api/save/list  - List saved UIs                      ║
║   - GET  /health         - Health check                        ║
║                                                                ║
║   Environment Variables:                                       ║
║   - AI_API_URL    : Your AI endpoint URL                       ║
║   - AI_API_KEY    : Your API key                               ║
║   - AI_MODEL      : Model name (default: gpt-4o)               ║
║   - AI_PROVIDER   : openai | azure | anthropic                 ║
║                                                                ║
╚════════════════════════════════════════════════════════════════╝
  `)
})
