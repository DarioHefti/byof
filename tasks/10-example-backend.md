# Task 10: Example Backend (Python FastAPI with LLM)

## Objective
Create the Python FastAPI backend that provides the chat endpoint (with real LLM integration), todo API, and save/load endpoints.

## Requirements

### 1. Create `examples/backend/app.py`

```python
import os
import json
import uuid
from datetime import datetime
from typing import Optional, List, Dict, Any
from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# LLM Provider configuration
LLM_PROVIDER = os.getenv("BYOF_LLM_PROVIDER", "anthropic")  # "anthropic" or "openai"
ANTHROPIC_API_KEY = os.getenv("ANTHROPIC_API_KEY")
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")

# In-memory storage
todos: Dict[str, Dict[str, Any]] = {}
saved_byofs: Dict[str, Dict[str, Any]] = {}


# --- Pydantic Models ---

class ChatMessage(BaseModel):
    role: str
    content: str


class ChatInstructions(BaseModel):
    outputFormat: str = "single_html"
    allowedOrigins: List[str] = []


class ChatRequest(BaseModel):
    messages: List[ChatMessage]
    apiSpec: str
    context: Optional[Dict[str, str]] = None
    instructions: Optional[ChatInstructions] = None


class ChatResponse(BaseModel):
    html: str
    title: Optional[str] = None
    warnings: Optional[List[str]] = None


class TodoCreate(BaseModel):
    title: str


class TodoUpdate(BaseModel):
    title: Optional[str] = None
    completed: Optional[bool] = None


class Todo(BaseModel):
    id: str
    title: str
    completed: bool
    createdAt: str


class SaveRequest(BaseModel):
    name: Optional[str] = None
    html: str
    messages: Optional[List[Dict[str, Any]]] = None
    apiSpec: Optional[str] = None
    context: Optional[Dict[str, str]] = None
    meta: Optional[Dict[str, str]] = None


class SaveResponse(BaseModel):
    id: str
    name: Optional[str] = None
    updatedAt: str


class LoadResponse(BaseModel):
    id: str
    name: Optional[str] = None
    html: str
    messages: Optional[List[Dict[str, Any]]] = None
    apiSpec: Optional[str] = None
    updatedAt: str


class ListResponseItem(BaseModel):
    id: str
    name: Optional[str] = None
    updatedAt: str


class ListResponse(BaseModel):
    items: List[ListResponseItem]


# --- LLM Integration ---

SYSTEM_PROMPT = """You are an expert frontend developer. Your task is to generate a complete, single-file HTML application based on the user's request and the provided OpenAPI specification.

IMPORTANT RULES:
1. Generate a COMPLETE HTML document with <!DOCTYPE html>, <html>, <head>, and <body> tags
2. Include ALL CSS in a <style> tag in the <head>
3. Include ALL JavaScript in a <script> tag at the end of <body>
4. The UI must interact with the API endpoints defined in the OpenAPI spec
5. Use modern, clean styling with good UX
6. Handle loading states and errors gracefully
7. Make the UI responsive and accessible
8. Use fetch() for API calls to the endpoints in the spec
9. Do NOT use any external libraries or CDN links
10. Do NOT make calls to any URLs except those in the OpenAPI spec

The API base URL is: {base_url}

OpenAPI Specification:
{api_spec}

Generate the HTML now based on the user's request. Output ONLY the HTML code, nothing else."""


async def generate_html_with_anthropic(messages: List[ChatMessage], api_spec: str, base_url: str) -> str:
    """Generate HTML using Anthropic Claude API"""
    try:
        import anthropic
    except ImportError:
        raise HTTPException(500, "anthropic package not installed")
    
    if not ANTHROPIC_API_KEY:
        raise HTTPException(500, "ANTHROPIC_API_KEY not set")
    
    client = anthropic.Anthropic(api_key=ANTHROPIC_API_KEY)
    
    system = SYSTEM_PROMPT.format(api_spec=api_spec, base_url=base_url)
    
    # Convert messages to Anthropic format
    anthropic_messages = [
        {"role": m.role if m.role != "system" else "user", "content": m.content}
        for m in messages
    ]
    
    response = client.messages.create(
        model="claude-sonnet-4-20250514",
        max_tokens=8192,
        system=system,
        messages=anthropic_messages,
    )
    
    return response.content[0].text


async def generate_html_with_openai(messages: List[ChatMessage], api_spec: str, base_url: str) -> str:
    """Generate HTML using OpenAI API"""
    try:
        import openai
    except ImportError:
        raise HTTPException(500, "openai package not installed")
    
    if not OPENAI_API_KEY:
        raise HTTPException(500, "OPENAI_API_KEY not set")
    
    client = openai.OpenAI(api_key=OPENAI_API_KEY)
    
    system = SYSTEM_PROMPT.format(api_spec=api_spec, base_url=base_url)
    
    # Convert messages to OpenAI format
    openai_messages = [{"role": "system", "content": system}]
    for m in messages:
        openai_messages.append({"role": m.role, "content": m.content})
    
    response = client.chat.completions.create(
        model="gpt-4o",
        max_tokens=8192,
        messages=openai_messages,
    )
    
    return response.choices[0].message.content


async def generate_html(messages: List[ChatMessage], api_spec: str, base_url: str) -> str:
    """Generate HTML using configured LLM provider"""
    if LLM_PROVIDER == "anthropic":
        return await generate_html_with_anthropic(messages, api_spec, base_url)
    elif LLM_PROVIDER == "openai":
        return await generate_html_with_openai(messages, api_spec, base_url)
    else:
        raise HTTPException(500, f"Unknown LLM provider: {LLM_PROVIDER}")


# --- OpenAPI Spec ---

OPENAPI_SPEC = {
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
                                    "items": {"$ref": "#/components/schemas/Todo"}
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
                    "required": True,
                    "content": {
                        "application/json": {
                            "schema": {"$ref": "#/components/schemas/TodoCreate"}
                        }
                    }
                },
                "responses": {
                    "201": {
                        "description": "Created todo",
                        "content": {
                            "application/json": {
                                "schema": {"$ref": "#/components/schemas/Todo"}
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
                    {"name": "id", "in": "path", "required": True, "schema": {"type": "string"}}
                ],
                "requestBody": {
                    "required": True,
                    "content": {
                        "application/json": {
                            "schema": {"$ref": "#/components/schemas/TodoUpdate"}
                        }
                    }
                },
                "responses": {
                    "200": {
                        "description": "Updated todo",
                        "content": {
                            "application/json": {
                                "schema": {"$ref": "#/components/schemas/Todo"}
                            }
                        }
                    }
                }
            },
            "delete": {
                "summary": "Delete a todo",
                "operationId": "deleteTodo",
                "parameters": [
                    {"name": "id", "in": "path", "required": True, "schema": {"type": "string"}}
                ],
                "responses": {
                    "204": {"description": "Todo deleted"}
                }
            }
        }
    },
    "components": {
        "schemas": {
            "Todo": {
                "type": "object",
                "properties": {
                    "id": {"type": "string"},
                    "title": {"type": "string"},
                    "completed": {"type": "boolean"},
                    "createdAt": {"type": "string", "format": "date-time"}
                },
                "required": ["id", "title", "completed"]
            },
            "TodoCreate": {
                "type": "object",
                "properties": {"title": {"type": "string"}},
                "required": ["title"]
            },
            "TodoUpdate": {
                "type": "object",
                "properties": {
                    "title": {"type": "string"},
                    "completed": {"type": "boolean"}
                }
            }
        }
    }
}


# --- FastAPI App ---

app = FastAPI(title="BYOF Example Backend")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify allowed origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# --- Routes ---

@app.get("/openapi.json")
async def get_openapi_spec():
    """Serve the OpenAPI spec for the Todo API"""
    return JSONResponse(content=OPENAPI_SPEC)


# --- Todo API ---

@app.get("/api/todos", response_model=List[Todo])
async def list_todos():
    """List all todos"""
    return list(todos.values())


@app.post("/api/todos", response_model=Todo, status_code=201)
async def create_todo(todo: TodoCreate):
    """Create a new todo"""
    todo_id = str(uuid.uuid4())
    new_todo = {
        "id": todo_id,
        "title": todo.title,
        "completed": False,
        "createdAt": datetime.utcnow().isoformat() + "Z",
    }
    todos[todo_id] = new_todo
    return new_todo


@app.put("/api/todos/{id}", response_model=Todo)
async def update_todo(id: str, update: TodoUpdate):
    """Update a todo"""
    if id not in todos:
        raise HTTPException(404, "Todo not found")
    
    todo = todos[id]
    if update.title is not None:
        todo["title"] = update.title
    if update.completed is not None:
        todo["completed"] = update.completed
    
    return todo


@app.delete("/api/todos/{id}", status_code=204)
async def delete_todo(id: str):
    """Delete a todo"""
    if id not in todos:
        raise HTTPException(404, "Todo not found")
    
    del todos[id]
    return None


# --- Chat API ---

@app.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    """Generate HTML UI from chat messages"""
    try:
        # Get base URL from the spec or use default
        base_url = "http://localhost:8000"
        
        html = await generate_html(request.messages, request.apiSpec, base_url)
        
        # Extract title from HTML if possible
        title = None
        if "<title>" in html and "</title>" in html:
            start = html.index("<title>") + 7
            end = html.index("</title>")
            title = html[start:end]
        
        return ChatResponse(html=html, title=title)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(500, f"Failed to generate HTML: {str(e)}")


# --- Save/Load API ---

@app.post("/byof/save", response_model=SaveResponse)
async def save_byof(request: SaveRequest):
    """Save a generated BYOF"""
    byof_id = str(uuid.uuid4())
    now = datetime.utcnow().isoformat() + "Z"
    
    saved_byofs[byof_id] = {
        "id": byof_id,
        "name": request.name,
        "html": request.html,
        "messages": request.messages,
        "apiSpec": request.apiSpec,
        "context": request.context,
        "meta": request.meta,
        "updatedAt": now,
    }
    
    return SaveResponse(id=byof_id, name=request.name, updatedAt=now)


@app.get("/byof/load", response_model=LoadResponse)
async def load_byof(id: str):
    """Load a saved BYOF"""
    if id not in saved_byofs:
        raise HTTPException(404, "Saved BYOF not found")
    
    byof = saved_byofs[id]
    return LoadResponse(
        id=byof["id"],
        name=byof["name"],
        html=byof["html"],
        messages=byof["messages"],
        apiSpec=byof["apiSpec"],
        updatedAt=byof["updatedAt"],
    )


@app.get("/byof/list", response_model=ListResponse)
async def list_byofs(projectId: Optional[str] = None):
    """List saved BYOFs"""
    items = []
    for byof in saved_byofs.values():
        # Filter by projectId if provided
        if projectId and byof.get("context", {}).get("projectId") != projectId:
            continue
        items.append(ListResponseItem(
            id=byof["id"],
            name=byof["name"],
            updatedAt=byof["updatedAt"],
        ))
    
    # Sort by updatedAt descending
    items.sort(key=lambda x: x.updatedAt, reverse=True)
    
    return ListResponse(items=items)


@app.delete("/byof/delete")
async def delete_byof(id: str):
    """Delete a saved BYOF"""
    if id not in saved_byofs:
        raise HTTPException(404, "Saved BYOF not found")
    
    del saved_byofs[id]
    return {"status": "deleted"}


# --- Health Check ---

@app.get("/health")
async def health():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "llm_provider": LLM_PROVIDER,
        "has_api_key": bool(ANTHROPIC_API_KEY if LLM_PROVIDER == "anthropic" else OPENAI_API_KEY),
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
```

### 2. Create `examples/backend/requirements.txt`

```
fastapi>=0.100.0
uvicorn[standard]>=0.23.0
python-dotenv>=1.0.0
anthropic>=0.18.0
openai>=1.0.0
```

### 3. Create `examples/backend/.env.example`

```
# LLM Provider: "anthropic" or "openai"
BYOF_LLM_PROVIDER=anthropic

# API Keys (set the one for your chosen provider)
ANTHROPIC_API_KEY=your-anthropic-api-key-here
OPENAI_API_KEY=your-openai-api-key-here
```

### 4. Create `examples/backend/README.md`

```markdown
# BYOF Example Backend

A FastAPI backend that demonstrates the BYOF library with real LLM integration.

## Setup

1. Create a virtual environment:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

2. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

3. Create a `.env` file from the example:
   ```bash
   cp .env.example .env
   ```

4. Edit `.env` and set your API key:
   - For Anthropic: Set `BYOF_LLM_PROVIDER=anthropic` and `ANTHROPIC_API_KEY`
   - For OpenAI: Set `BYOF_LLM_PROVIDER=openai` and `OPENAI_API_KEY`

## Running

```bash
uvicorn app:app --reload
```

The server will start at http://localhost:8000

## Endpoints

- `GET /openapi.json` - OpenAPI spec for the Todo API
- `GET /api/todos` - List todos
- `POST /api/todos` - Create todo
- `PUT /api/todos/{id}` - Update todo
- `DELETE /api/todos/{id}` - Delete todo
- `POST /chat` - Generate HTML from chat (uses LLM)
- `POST /byof/save` - Save generated HTML
- `GET /byof/load?id=...` - Load saved HTML
- `GET /byof/list` - List saved items
- `GET /health` - Health check
```

## Acceptance Criteria
- [ ] FastAPI app runs without errors
- [ ] CORS is properly configured
- [ ] `/openapi.json` returns valid OpenAPI spec
- [ ] Todo CRUD endpoints work
- [ ] `/chat` generates HTML using configured LLM
- [ ] LLM provider can be switched via environment variable
- [ ] Save/load/list endpoints work with in-memory storage
- [ ] Health check shows LLM configuration status
