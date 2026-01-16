# Task 09: Example Frontend

## Objective
Create the vanilla JavaScript example that demonstrates how to use the BYOF library.

## Requirements

### 1. Create `examples/vanilla/index.html`

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>BYOF Example - Todo App Generator</title>
  <link rel="stylesheet" href="styles.css">
</head>
<body>
  <div class="app">
    <header class="app-header">
      <h1>BYOF Example</h1>
      <p>Generate a Todo app UI from an OpenAPI spec</p>
    </header>
    
    <div class="config-panel">
      <h2>Configuration</h2>
      <div class="config-fields">
        <div class="field">
          <label for="chatEndpoint">Chat Endpoint</label>
          <input type="text" id="chatEndpoint" value="http://localhost:8000/chat">
        </div>
        <div class="field">
          <label for="saveEndpoint">Save Endpoint</label>
          <input type="text" id="saveEndpoint" value="http://localhost:8000/byof">
        </div>
        <div class="field">
          <label for="apiSpecUrl">API Spec URL</label>
          <input type="text" id="apiSpecUrl" value="http://localhost:8000/openapi.json">
        </div>
        <button id="initButton">Initialize BYOF</button>
        <button id="destroyButton" disabled>Destroy</button>
      </div>
    </div>
    
    <div id="byof-container" class="byof-container">
      <p class="placeholder">Click "Initialize BYOF" to start</p>
    </div>
  </div>
  
  <script type="module" src="main.js"></script>
</body>
</html>
```

### 2. Create `examples/vanilla/styles.css`

```css
* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  background: #f5f5f5;
  color: #333;
  line-height: 1.5;
}

.app {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

.app-header {
  text-align: center;
  margin-bottom: 20px;
}

.app-header h1 {
  font-size: 24px;
  margin-bottom: 8px;
}

.app-header p {
  color: #666;
}

.config-panel {
  background: white;
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 20px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.config-panel h2 {
  font-size: 16px;
  margin-bottom: 16px;
}

.config-fields {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  align-items: flex-end;
}

.field {
  flex: 1;
  min-width: 200px;
}

.field label {
  display: block;
  font-size: 12px;
  color: #666;
  margin-bottom: 4px;
}

.field input {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
}

.field input:focus {
  outline: none;
  border-color: #0066cc;
}

button {
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  font-size: 14px;
  cursor: pointer;
  transition: background 0.2s;
}

#initButton {
  background: #0066cc;
  color: white;
}

#initButton:hover {
  background: #0055aa;
}

#initButton:disabled {
  background: #ccc;
  cursor: not-allowed;
}

#destroyButton {
  background: #cc0000;
  color: white;
}

#destroyButton:hover {
  background: #aa0000;
}

#destroyButton:disabled {
  background: #ccc;
  cursor: not-allowed;
}

.byof-container {
  flex: 1;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  min-height: 600px;
  display: flex;
  flex-direction: column;
}

.placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: #999;
  font-size: 16px;
}
```

### 3. Create `examples/vanilla/main.js`

```javascript
// Import from local dist during development
// In production, this would be: import { createByof } from 'byof'
import { createByof } from '../../dist/index.js'

let byofInstance = null

// DOM elements
const chatEndpointInput = document.getElementById('chatEndpoint')
const saveEndpointInput = document.getElementById('saveEndpoint')
const apiSpecUrlInput = document.getElementById('apiSpecUrl')
const initButton = document.getElementById('initButton')
const destroyButton = document.getElementById('destroyButton')
const container = document.getElementById('byof-container')

// Initialize BYOF
initButton.addEventListener('click', async () => {
  // Clear placeholder
  container.innerHTML = ''
  
  try {
    byofInstance = createByof({
      mount: container,
      chatEndpoint: chatEndpointInput.value,
      saveEndpoint: saveEndpointInput.value || undefined,
      apiSpecUrl: apiSpecUrlInput.value,
      sandbox: {
        // Allow API calls to the backend
        allowlist: [new URL(chatEndpointInput.value).origin],
      },
      theme: {
        primaryColor: '#0066cc',
        borderRadius: '8px',
      },
      
      // Callbacks
      onHtmlGenerated: (html, title) => {
        console.log('HTML generated:', title)
      },
      onError: (error) => {
        console.error('BYOF error:', error)
      },
      onSaveComplete: (ref) => {
        console.log('Saved:', ref)
      },
      onLoadComplete: (ref) => {
        console.log('Loaded:', ref)
      },
    })
    
    // Update button states
    initButton.disabled = true
    destroyButton.disabled = false
    
    console.log('BYOF initialized successfully')
  } catch (error) {
    console.error('Failed to initialize BYOF:', error)
    container.innerHTML = `<p class="placeholder" style="color: #cc0000;">Error: ${error.message}</p>`
  }
})

// Destroy BYOF
destroyButton.addEventListener('click', () => {
  if (byofInstance) {
    byofInstance.destroy()
    byofInstance = null
  }
  
  container.innerHTML = '<p class="placeholder">Click "Initialize BYOF" to start</p>'
  
  // Update button states
  initButton.disabled = false
  destroyButton.disabled = true
  
  console.log('BYOF destroyed')
})
```

### 4. Create `examples/vanilla/openapi.json`
This is a backup copy; the backend will serve its own.

```json
{
  "openapi": "3.0.0",
  "info": {
    "title": "Todo API",
    "version": "1.0.0",
    "description": "A simple Todo list API"
  },
  "servers": [
    {
      "url": "http://localhost:8000",
      "description": "Local development server"
    }
  ],
  "paths": {
    "/api/todos": {
      "get": {
        "summary": "List all todos",
        "operationId": "listTodos",
        "responses": {
          "200": {
            "description": "A list of todos",
            "content": {
              "application/json": {
                "schema": {
                  "type": "array",
                  "items": {
                    "$ref": "#/components/schemas/Todo"
                  }
                }
              }
            }
          }
        }
      },
      "post": {
        "summary": "Create a new todo",
        "operationId": "createTodo",
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": {
                "$ref": "#/components/schemas/TodoCreate"
              }
            }
          }
        },
        "responses": {
          "201": {
            "description": "Created todo",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/Todo"
                }
              }
            }
          }
        }
      }
    },
    "/api/todos/{id}": {
      "put": {
        "summary": "Update a todo",
        "operationId": "updateTodo",
        "parameters": [
          {
            "name": "id",
            "in": "path",
            "required": true,
            "schema": {
              "type": "string"
            }
          }
        ],
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": {
                "$ref": "#/components/schemas/TodoUpdate"
              }
            }
          }
        },
        "responses": {
          "200": {
            "description": "Updated todo",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/Todo"
                }
              }
            }
          }
        }
      },
      "delete": {
        "summary": "Delete a todo",
        "operationId": "deleteTodo",
        "parameters": [
          {
            "name": "id",
            "in": "path",
            "required": true,
            "schema": {
              "type": "string"
            }
          }
        ],
        "responses": {
          "204": {
            "description": "Todo deleted"
          }
        }
      }
    }
  },
  "components": {
    "schemas": {
      "Todo": {
        "type": "object",
        "properties": {
          "id": {
            "type": "string"
          },
          "title": {
            "type": "string"
          },
          "completed": {
            "type": "boolean"
          },
          "createdAt": {
            "type": "string",
            "format": "date-time"
          }
        },
        "required": ["id", "title", "completed"]
      },
      "TodoCreate": {
        "type": "object",
        "properties": {
          "title": {
            "type": "string"
          }
        },
        "required": ["title"]
      },
      "TodoUpdate": {
        "type": "object",
        "properties": {
          "title": {
            "type": "string"
          },
          "completed": {
            "type": "boolean"
          }
        }
      }
    }
  }
}
```

## Acceptance Criteria
- [ ] `index.html` loads without errors
- [ ] Configuration panel allows setting endpoints
- [ ] "Initialize BYOF" creates and mounts the BYOF instance
- [ ] "Destroy" removes the BYOF instance
- [ ] BYOF container fills available space
- [ ] Console logs show callback invocations
- [ ] Error handling shows error messages
