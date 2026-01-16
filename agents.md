I want you to strictly follow this best coding practices:

Build small components based modular code.
Write easy readable code instead of very optimized complex code.

- **Public API first**: minimal surface, stable names, semver; avoid exposing internals.  
- **Strict TS**: `strict: true`, `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`, `useUnknownInCatchVariables`.  
- **Types over docs**: precise generics, discriminated unions, branded types; avoid `any` (use `unknown`).  
- **Functional core**: pure functions + small side-effect adapters; make I/O boundaries explicit.  
- **Errors**: typed error codes (`enum`/union), don’t throw strings; document when exceptions happen.  
- **Async hygiene**: never “fire-and-forget”; `AbortSignal` support; timeouts; avoid unhandled rejections.  
- **Determinism**: no hidden globals; inject time/random/IO; make agent behavior reproducible.  
- **Validation**: runtime schema (e.g., zod) for external inputs; never trust model/tool outputs.  
- **Security**: prompt/tool injection hardening, allowlists, least-privilege, redact secrets, log safely.  
- **Testing**: unit + property tests; snapshot with stable formatting; mock LLM/tool calls; test concurrency.  
- **Lint/format**: eslint + prettier; enforce import order, no floating promises, exhaustive `switch`.  
- **Build & packaging**: ESM+CJS (if needed), `.d.ts`, exports map, tree-shakeable, sideEffects=false.  
- **Docs**: small README with examples; TSDoc on public APIs; changelog.  
- **Observability**: structured logs, tracing spans, metrics hooks; make logging pluggable.  
- **Performance**: avoid deep clones, stream results, batch requests, cache with explicit invalidation.  
