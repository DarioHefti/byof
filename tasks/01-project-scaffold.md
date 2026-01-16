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
- `eslint-plugin-import`
- `eslint-import-resolver-typescript`
- `eslint-config-prettier`
- `prettier`
- `vitest`
- `concurrently` (for running multiple dev scripts)

**Runtime dependencies:**
- `zod` (for runtime validation of external inputs)

### 3. Create TypeScript config
Create `tsconfig.json` with strict settings per AGENTS.md:
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": true,
    "useUnknownInCatchVariables": true,
    "noFallthroughCasesInSwitch": true,
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
Create `.eslintrc.cjs` with TypeScript support and strict rules:

```javascript
module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  parserOptions: {
    project: './tsconfig.json',
    ecmaVersion: 2020,
    sourceType: 'module',
  },
  plugins: ['@typescript-eslint', 'import'],
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:@typescript-eslint/recommended-requiring-type-checking',
    'plugin:import/recommended',
    'plugin:import/typescript',
    'prettier',
  ],
  rules: {
    // No floating promises - must handle or explicitly void
    '@typescript-eslint/no-floating-promises': 'error',
    
    // Exhaustive switch statements
    '@typescript-eslint/switch-exhaustiveness-check': 'error',
    
    // No any - use unknown instead
    '@typescript-eslint/no-explicit-any': 'error',
    '@typescript-eslint/no-unsafe-assignment': 'error',
    '@typescript-eslint/no-unsafe-member-access': 'error',
    '@typescript-eslint/no-unsafe-call': 'error',
    '@typescript-eslint/no-unsafe-return': 'error',
    
    // Import order
    'import/order': [
      'error',
      {
        'groups': [
          'builtin',
          'external',
          'internal',
          'parent',
          'sibling',
          'index',
        ],
        'newlines-between': 'always',
        'alphabetize': { order: 'asc', caseInsensitive: true },
      },
    ],
    
    // No unused vars
    '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
  },
  settings: {
    'import/resolver': {
      typescript: true,
      node: true,
    },
  },
}
```

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
