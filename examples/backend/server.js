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
 * In production, you would:
 * - Use a real database instead of in-memory storage
 * - Integrate with an LLM (OpenAI, Anthropic, etc.) for HTML generation
 * - Add authentication and authorization
 * - Add rate limiting and input validation
 */

import cors from 'cors'
import express from 'express'

const app = express()
const PORT = process.env.PORT || 3001

// Middleware
app.use(cors())
app.use(express.json({ limit: '10mb' }))

// In-memory storage for saved UIs
const savedUIs = new Map()

// ============================================================================
// Chat Endpoint
// ============================================================================

/**
 * POST /api/chat
 *
 * Expected request body (ChatRequest):
 * {
 *   messages: Array<{ role: string; content: string }>
 *   apiSpec: string
 *   context?: { projectId?: string; userId?: string }
 *   instructions: { outputFormat: 'single_html'; allowedOrigins: string[] }
 * }
 *
 * Response (ChatResponse):
 * {
 *   html: string
 *   title?: string
 *   warnings?: string[]
 * }
 */
app.post('/api/chat', (req, res) => {
  const { messages, apiSpec, context, instructions } = req.body

  console.log('[Chat] Received request:', {
    messageCount: messages?.length,
    hasApiSpec: !!apiSpec,
    context,
    instructions,
  })

  // Validate request
  if (!messages || !Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({
      error: 'messages array is required and must not be empty',
    })
  }

  // Get the last user message
  const lastUserMessage = [...messages].reverse().find((m) => m.role === 'user')
  const userRequest = lastUserMessage?.content || 'a simple UI'

  // In production, you would send this to an LLM like OpenAI or Anthropic
  // For this example, we generate a mock HTML response
  const { html, title } = generateMockHtml(userRequest, apiSpec, context)

  const warnings = []

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
  console.log(`
╔════════════════════════════════════════════════════════════════╗
║                                                                ║
║   BYOF Example Backend                                         ║
║                                                                ║
║   Server running at: http://localhost:${PORT}                    ║
║                                                                ║
║   Endpoints:                                                   ║
║   - POST /api/chat       - Generate HTML from messages         ║
║   - POST /api/save       - Save a generated UI                 ║
║   - POST /api/save/load  - Load a saved UI                     ║
║   - POST /api/save/list  - List saved UIs                      ║
║   - GET  /health         - Health check                        ║
║                                                                ║
╚════════════════════════════════════════════════════════════════╝
  `)
})
