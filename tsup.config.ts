import { defineConfig } from 'tsup'

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
  },
])
