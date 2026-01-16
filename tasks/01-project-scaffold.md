# Task 01: Project Scaffold

## Objective
Set up the foundational project structure with TypeScript, build tooling, and quality tools.

## Requirements

### 1. Initialize npm package
- Run `npm init -y`
- Update `package.json` with:
  - `name: "byof"`
  - `version: "0.1.0"`
  - `description: "Bring Your Own Frontend - Chat-based UI generator from OpenAPI specs"`
  - `main: "dist/index.cjs"`
  - `module: "dist/index.js"`
  - `types: "dist/index.d.ts"`
  - `exports` field for ESM/CJS/types
  - `files: ["dist"]`
  - `license: "MIT"`

### 2. Install dependencies

**Dev dependencies:**
- `typescript`
- `tsup` (for bundling ESM + CJS + types)
- `@types/node`
- `eslint`
- `@typescript-eslint/eslint-plugin`
- `@typescript-eslint/parser`
- `prettier`
- `vitest`
- `concurrently` (for running multiple dev scripts)

### 3. Create TypeScript config
Create `tsconfig.json`:
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "declaration": true,
    "declarationMap": true,
    "outDir": "dist",
    "rootDir": "src"
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "examples"]
}
```

### 4. Create tsup config
Create `tsup.config.ts`:
```typescript
import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['cjs', 'esm'],
  dts: true,
  splitting: false,
  sourcemap: true,
  clean: true,
})
```

### 5. Create ESLint config
Create `.eslintrc.cjs` with TypeScript support.

### 6. Create Prettier config
Create `.prettierrc` with reasonable defaults.

### 7. Create folder structure
```
src/
  index.ts          # Main entrypoint (empty for now, just exports)
  types.ts          # Type definitions
  ui/               # UI components (empty)
  chat/             # Chat client (empty)
  save/             # Save/load client (empty)
  spec/             # API spec handling (empty)
  sandbox/          # Iframe sandbox (empty)
examples/
  vanilla/          # Example frontend (empty)
  backend/          # Example Python backend (empty)
```

### 8. Add npm scripts to package.json
```json
{
  "scripts": {
    "build": "tsup",
    "dev": "tsup --watch",
    "lint": "eslint src --ext .ts",
    "format": "prettier --write \"src/**/*.ts\"",
    "test": "vitest",
    "test:run": "vitest run"
  }
}
```

### 9. Create .gitignore
```
node_modules/
dist/
.env
*.log
.DS_Store
```

### 10. Create initial src/index.ts
Just a placeholder export:
```typescript
export const VERSION = '0.1.0'
```

## Acceptance Criteria
- [ ] `npm install` runs without errors
- [ ] `npm run build` produces `dist/index.js`, `dist/index.cjs`, `dist/index.d.ts`
- [ ] `npm run lint` runs without errors
- [ ] `npm run test:run` runs (even if no tests yet)
- [ ] Folder structure is in place
