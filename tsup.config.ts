import { readFileSync } from 'node:fs'

import { defineConfig } from 'tsup'

// Read version from package.json at build time
const pkg = JSON.parse(readFileSync('./package.json', 'utf-8')) as {
  version: string
}

export default defineConfig([
  // Main build for npm (external dependencies)
  {
    entry: ['src/index.ts'],
    format: ['cjs', 'esm'],
    dts: true,
    splitting: false,
    sourcemap: true,
    clean: true,
    treeshake: true,
    target: 'es2020',
    outDir: 'dist',
    onSuccess: 'echo "Build complete!"',
    define: {
      __BYOF_VERSION__: JSON.stringify(pkg.version),
    },
  },
  // Browser bundle (all dependencies included)
  {
    entry: ['src/index.ts'],
    format: ['iife'],
    globalName: 'BYOF',
    outDir: 'dist',
    outExtension: () => ({ js: '.browser.js' }),
    splitting: false,
    sourcemap: true,
    minify: true,
    treeshake: true,
    target: 'es2020',
    // Bundle all dependencies for browser use
    noExternal: [/.*/],
    define: {
      __BYOF_VERSION__: JSON.stringify(pkg.version),
    },
  },
])
