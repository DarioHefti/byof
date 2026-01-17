# Task 11: Dev Scripts and Build Configuration

## Objective
Set up npm scripts to run the library build, example frontend, and example backend concurrently for development.

## Requirements

### 1. Update `package.json` scripts

Add the following scripts to `package.json`:

```json
{
  "scripts": {
    "build": "tsup",
    "dev": "tsup --watch",
    "lint": "eslint src --ext .ts",
    "lint:fix": "eslint src --ext .ts --fix",
    "format": "prettier --write \"src/**/*.ts\"",
    "format:check": "prettier --check \"src/**/*.ts\"",
    "test": "vitest",
    "test:run": "vitest run",
    "test:coverage": "vitest run --coverage",
    
    "example:web": "npx serve examples/vanilla -l 3000",
    "example:api": "cd examples/backend && uvicorn app:app --reload --port 8000",
    "example": "concurrently -n web,api,build -c blue,green,yellow \"npm run example:web\" \"npm run example:api\" \"npm run dev\"",
    
    "clean": "rm -rf dist",
    "prepublishOnly": "npm run clean && npm run build && npm run test:run"
  }
}
```

### 2. Install additional dev dependencies

```bash
npm install -D serve concurrently
```

- `serve`: Simple static file server for the example frontend
- `concurrently`: Run multiple commands in parallel

### 3. Update `tsup.config.ts` for watch mode

```typescript
import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['cjs', 'esm'],
  dts: true,
  splitting: false,
  sourcemap: true,
  clean: true,
  // Watch mode configuration
  onSuccess: 'echo "Build complete!"',
})
```

### 4. Create `.nvmrc` for Node version

```
20
```

### 5. Update `.gitignore`

Add these entries if not present:

```
# Dependencies
node_modules/

# Build output
dist/

# Environment files
.env
.env.local
.env.*.local

# Python
__pycache__/
*.py[cod]
*$py.class
venv/
.venv/
*.egg-info/

# IDE
.idea/
.vscode/
*.swp
*.swo

# OS
.DS_Store
Thumbs.db

# Logs
*.log
npm-debug.log*

# Test coverage
coverage/

# Misc
*.tgz
```

### 6. Create development setup documentation

Create `DEVELOPMENT.md`:

```markdown
# Development Setup

## Prerequisites

- Node.js 20+ (use `nvm use` if you have nvm installed)
- Python 3.9+
- An API key for Anthropic or OpenAI

## Quick Start

1. **Install Node dependencies:**
   ```bash
   npm install
   ```

2. **Set up Python backend:**
   ```bash
   cd examples/backend
   python -m venv venv
   source venv/bin/activate  # Windows: venv\Scripts\activate
   pip install -r requirements.txt
   cp .env.example .env
   # Edit .env and add your API key
   cd ../..
   ```

3. **Run everything:**
   ```bash
   npm run example
   ```

   This starts:
   - Library build in watch mode (rebuilds on changes)
   - Example frontend at http://localhost:3000
   - Example backend at http://localhost:8000

## Individual Commands

### Library Development

```bash
# Build once
npm run build

# Build in watch mode
npm run dev

# Run tests
npm run test

# Run tests once
npm run test:run

# Lint
npm run lint

# Format code
npm run format
```

### Example Apps

```bash
# Run just the frontend
npm run example:web

# Run just the backend (requires Python venv activated)
npm run example:api

# Run everything together
npm run example
```

## Project Structure

```
byof/
├── src/                  # Library source code
│   ├── index.ts         # Main entrypoint
│   ├── types.ts         # Type definitions
│   ├── version.ts       # Version constant
│   ├── core/            # Main createByof implementation
│   ├── ui/              # DOM-based UI components
│   ├── chat/            # Chat client
│   ├── save/            # Save/load client
│   ├── spec/            # API spec loader
│   └── sandbox/         # Iframe sandbox runner
├── examples/
│   ├── vanilla/         # Vanilla JS example frontend
│   └── backend/         # Python FastAPI backend
├── dist/                # Build output (generated)
├── tasks/               # Implementation task files
└── plan.md             # Project plan
```

## Testing

```bash
# Run tests in watch mode
npm run test

# Run tests once
npm run test:run

# Run with coverage
npm run test:coverage
```

## Publishing

```bash
# This will clean, build, and test before publishing
npm publish
```
```

## Acceptance Criteria
- [ ] `npm run build` produces dist files
- [ ] `npm run dev` watches for changes and rebuilds
- [ ] `npm run example:web` serves frontend at port 3000
- [ ] `npm run example:api` runs backend at port 8000 (with venv)
- [ ] `npm run example` runs all three concurrently
- [ ] `npm run test` runs vitest
- [ ] `npm run lint` checks for lint errors
- [ ] `npm run format` formats code
- [ ] `.gitignore` covers all necessary files
- [ ] `DEVELOPMENT.md` documents setup process
