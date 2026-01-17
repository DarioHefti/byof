# Task 14: Publish Preparation

## Objective
Prepare the package for npm publication with proper configuration, versioning, and final checks.

## Requirements

### 1. Finalize `package.json`

```json
{
  "name": "byof",
  "version": "0.1.0",
  "description": "Bring Your Own Frontend - Chat-based UI generator from OpenAPI specs",
  "author": "Your Name",
  "license": "MIT",
  "repository": {
    "type": "git",
    "url": "https://github.com/yourusername/byof.git"
  },
  "bugs": {
    "url": "https://github.com/yourusername/byof/issues"
  },
  "homepage": "https://github.com/yourusername/byof#readme",
  "keywords": [
    "frontend",
    "ui",
    "generator",
    "openapi",
    "chat",
    "ai",
    "html",
    "sandbox",
    "typescript"
  ],
  "type": "module",
  "main": "./dist/index.cjs",
  "module": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "import": {
        "types": "./dist/index.d.ts",
        "default": "./dist/index.js"
      },
      "require": {
        "types": "./dist/index.d.cts",
        "default": "./dist/index.cjs"
      }
    }
  },
  "files": [
    "dist",
    "README.md",
    "LICENSE",
    "SECURITY.md"
  ],
  "engines": {
    "node": ">=18.0.0"
  },
  "sideEffects": false,
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
    "typecheck": "tsc --noEmit",
    "example:web": "npx serve examples/vanilla -l 3000",
    "example:api": "cd examples/backend && uvicorn app:app --reload --port 8000",
    "example": "concurrently -n web,api,build -c blue,green,yellow \"npm run example:web\" \"npm run example:api\" \"npm run dev\"",
    "clean": "rm -rf dist",
    "prepublishOnly": "npm run clean && npm run lint && npm run typecheck && npm run test:run && npm run build",
    "release": "npm run prepublishOnly && npm publish"
  },
  "devDependencies": {
    "@types/node": "^20.0.0",
    "@typescript-eslint/eslint-plugin": "^7.0.0",
    "@typescript-eslint/parser": "^7.0.0",
    "concurrently": "^8.0.0",
    "eslint": "^8.0.0",
    "jsdom": "^24.0.0",
    "prettier": "^3.0.0",
    "serve": "^14.0.0",
    "tsup": "^8.0.0",
    "typescript": "^5.0.0",
    "vitest": "^1.0.0",
    "@vitest/coverage-v8": "^1.0.0"
  }
}
```

### 2. Create `LICENSE`

```
MIT License

Copyright (c) 2024 Your Name

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

### 3. Create `CHANGELOG.md`

```markdown
# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.1.0] - YYYY-MM-DD

### Added
- Initial release
- `createByof()` function to create BYOF instances
- Chat-based UI generation from OpenAPI specs
- Sandboxed iframe execution of generated HTML
- Save/load functionality for generated UIs
- Theming support via CSS variables
- TypeScript types for backend integration
- Example vanilla JS frontend
- Example Python FastAPI backend with LLM integration
```

### 4. Update `tsup.config.ts` for production

```typescript
import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['cjs', 'esm'],
  dts: true,
  splitting: false,
  sourcemap: true,
  clean: true,
  minify: false,  // Keep readable for debugging
  treeshake: true,
  target: 'es2020',
  outDir: 'dist',
})
```

### 5. Create `.npmignore`

```
# Source
src/
tsconfig.json
tsup.config.ts
vitest.config.ts
.eslintrc.*
.prettierrc

# Development
examples/
tasks/
plan.md
DEVELOPMENT.md
.nvmrc

# Git
.git/
.gitignore

# IDE
.idea/
.vscode/

# Tests
coverage/
*.test.ts

# Misc
node_modules/
*.log
.env*
```

### 6. Pre-publish checklist script

Create `scripts/prepublish-check.sh`:

```bash
#!/bin/bash
set -e

echo "Running pre-publish checks..."

# Check if dist exists and has expected files
echo "Checking dist..."
if [ ! -f "dist/index.js" ]; then
  echo "ERROR: dist/index.js not found. Run npm run build first."
  exit 1
fi

if [ ! -f "dist/index.cjs" ]; then
  echo "ERROR: dist/index.cjs not found."
  exit 1
fi

if [ ! -f "dist/index.d.ts" ]; then
  echo "ERROR: dist/index.d.ts not found."
  exit 1
fi

# Check package.json
echo "Checking package.json..."
if ! grep -q '"name": "byof"' package.json; then
  echo "ERROR: Package name is not 'byof'"
  exit 1
fi

# Check required files
echo "Checking required files..."
for file in README.md LICENSE SECURITY.md CHANGELOG.md; do
  if [ ! -f "$file" ]; then
    echo "ERROR: $file not found."
    exit 1
  fi
done

# Dry run npm pack to see what will be published
echo ""
echo "Files that will be published:"
npm pack --dry-run

echo ""
echo "All checks passed!"
```

### 7. Verify clean install

Create `scripts/verify-install.sh`:

```bash
#!/bin/bash
set -e

echo "Verifying clean install..."

# Create temp directory
TEMP_DIR=$(mktemp -d)
echo "Using temp directory: $TEMP_DIR"

# Pack the current package
npm pack

# Move to temp directory
cd "$TEMP_DIR"

# Create a test project
npm init -y
npm install "$OLDPWD"/byof-*.tgz

# Create a simple test file
cat > test.mjs << 'EOF'
import { createByof, VERSION } from 'byof'

console.log('VERSION:', VERSION)
console.log('createByof:', typeof createByof)

if (typeof createByof !== 'function') {
  console.error('ERROR: createByof is not a function')
  process.exit(1)
}

console.log('SUCCESS: Package works correctly')
EOF

# Run the test
node test.mjs

# Cleanup
cd "$OLDPWD"
rm -rf "$TEMP_DIR"
rm byof-*.tgz

echo ""
echo "Clean install verification passed!"
```

### 8. Final verification steps

Before publishing:

1. **Run all checks:**
   ```bash
   npm run prepublishOnly
   ```

2. **Verify package contents:**
   ```bash
   npm pack --dry-run
   ```

3. **Test in isolation:**
   ```bash
   bash scripts/verify-install.sh
   ```

4. **Publish:**
   ```bash
   npm publish --access public
   ```

## Acceptance Criteria
- [ ] `package.json` has all required fields
- [ ] `LICENSE` file exists
- [ ] `CHANGELOG.md` exists
- [ ] `.npmignore` excludes development files
- [ ] `npm pack --dry-run` shows only dist, README, LICENSE, SECURITY, CHANGELOG
- [ ] `npm run prepublishOnly` passes
- [ ] Clean install test passes
- [ ] Package can be imported in both ESM and CJS
