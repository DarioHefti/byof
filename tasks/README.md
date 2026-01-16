# BYOF Implementation Tasks

This folder contains the implementation tasks for the BYOF (Bring Your Own Frontend) library, broken down into manageable pieces for an LLM to complete.

## Task Order

Complete tasks in order, as later tasks depend on earlier ones:

| # | Task | Description | Dependencies |
|---|------|-------------|--------------|
| 01 | [Project Scaffold](./01-project-scaffold.md) | Set up repo, npm, TypeScript, build tooling | None |
| 02 | [Types and API](./02-types-and-api.md) | Define all TypeScript types and public API | 01 |
| 03 | [UI Renderer](./03-ui-renderer.md) | DOM-based chat UI and sandbox preview | 01, 02 |
| 04 | [Spec Loader](./04-spec-loader.md) | API spec loading and validation | 01, 02 |
| 05 | [Chat Client](./05-chat-client.md) | Chat endpoint client | 01, 02 |
| 06 | [Save Client](./06-save-client.md) | Save/load/list endpoint client | 01, 02 |
| 07 | [Sandbox Runner](./07-sandbox-runner.md) | Iframe sandbox with postMessage bridge | 01, 02 |
| 08 | [Main Integration](./08-main-integration.md) | Wire everything together in createByof | 01-07 |
| 09 | [Example Frontend](./09-example-frontend.md) | Vanilla JS example app | 01-08 |
| 10 | [Example Backend](./10-example-backend.md) | Python FastAPI with LLM integration | None (parallel) |
| 11 | [Dev Scripts](./11-dev-scripts.md) | npm scripts for development | 01, 09, 10 |
| 12 | [Testing](./12-testing.md) | Unit and integration tests | 01-08 |
| 13 | [Documentation](./13-documentation.md) | README, API docs, security notes | 01-12 |
| 14 | [Publish Prep](./14-publish-prep.md) | npm publish preparation | 01-13 |

## Parallel Execution

Some tasks can be done in parallel:
- Tasks 03-07 can be developed in parallel once 01-02 are complete
- Task 10 (Python backend) has no TypeScript dependencies

## Key Design Decisions

These decisions were made during planning (see `plan.md` for full details):

- **Sandbox**: iframe only (no shadow-dom)
- **LLM**: Real integration with Anthropic and OpenAI support
- **Storage**: In-memory dict for example backend
- **API Spec**: JSON only (no YAML parsing)
- **Theming**: CSS variables + theme object
- **Streaming**: Complete responses only
- **postMessage**: Full bridge (errors, resize, navigation)
- **Layout**: Stacked (chat on top, sandbox below)
- **Events**: Callback options pattern

## Testing Each Task

After completing each task, verify:

1. **Build**: `npm run build` succeeds
2. **Types**: `npm run typecheck` passes (once added)
3. **Lint**: `npm run lint` passes
4. **Tests**: `npm run test:run` passes (for tasks with tests)

## Getting Started

1. Start with Task 01 to scaffold the project
2. Complete Task 02 to define types
3. Tasks 03-07 can proceed in any order
4. Task 08 integrates everything
5. Tasks 09-11 set up the example app
6. Tasks 12-14 finalize for release
