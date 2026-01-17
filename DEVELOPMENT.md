# Development Setup

## Prerequisites

- Node.js 20+ (use `nvm use` if you have nvm installed)
- An API key for Anthropic or OpenAI (for the example backend)

## Quick Start

1. **Install Node dependencies:**

   ```bash
   npm install
   ```

2. **Build the library:**

   ```bash
   npm run build
   ```

3. **Run everything:**

   ```bash
   npm run example
   ```

   This starts:
   - Library build in watch mode (rebuilds on changes)
   - Example frontend at http://localhost:3000
   - Example backend at http://localhost:3001

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

# Run tests with coverage
npm run test:coverage

# Type check
npm run typecheck

# Lint
npm run lint

# Lint and fix
npm run lint:fix

# Format code
npm run format
```

### Example Apps

```bash
# Run just the frontend
npm run example:web

# Run just the backend
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
│   ├── schemas.ts       # Zod validation schemas
│   ├── version.ts       # Version constant
│   ├── core/            # Main createByof implementation
│   ├── ui/              # DOM-based UI components
│   ├── chat/            # Chat client
│   ├── save/            # Save/load client
│   ├── spec/            # API spec loader
│   ├── prompt/          # System prompt builder
│   └── sandbox/         # Iframe sandbox runner + CSP + auth
├── examples/
│   ├── vanilla/         # Vanilla JS example frontend
│   └── backend/         # Node.js Express backend
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

### Test Structure

Tests are co-located with source files:

- `src/spec/loader.test.ts` - API spec loader tests
- `src/chat/client.test.ts` - Chat client tests
- `src/save/client.test.ts` - Save/load client tests
- `src/sandbox/csp.test.ts` - CSP generation tests
- `src/sandbox/runner.test.ts` - Sandbox runner tests
- `src/sandbox/auth.test.ts` - Auth injection tests
- `src/core/byof.test.ts` - Core integration tests
- `src/prompt/builder.test.ts` - Prompt builder tests

## Publishing

```bash
# This will clean, lint, typecheck, test, and build before publishing
npm run prepublishOnly

# Then publish
npm publish
```

## Architecture Notes

### Module Structure

Each module follows the pattern:

```
module/
├── index.ts      # Public exports
├── impl.ts       # Implementation
└── impl.test.ts  # Tests
```

### Error Handling

All errors use the `ByofException` class with typed error codes:

```typescript
throw new ByofException(ErrorCode.NETWORK_ERROR, 'Failed to fetch', { cause })
```

### Async Operations

All async operations support:

- `AbortSignal` for cancellation
- Configurable timeouts
- Proper error propagation

### Sandbox Security

Generated HTML runs in an iframe with:

- `sandbox="allow-scripts allow-forms"` (no same-origin)
- CSP meta tag restricting network calls
- Auth headers injected via `window.__BYOF_AUTH__`
