# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Changed

- **BREAKING**: Removed dedicated header section - status indicator and menu button are now integrated into the chat header/taskbar
- **BREAKING**: Removed `header` property from `UIElements` interface
- Container now uses `flex: 1` instead of `height: 100%` for better flex-based layout support
- Controls panel now drops down from chat header instead of old header
- Simplified fullscreen mode styles

## [0.1.0] - 2026-01-17

### Added

- Initial release
- `createByof()` function to create BYOF instances
- Chat-based UI generation from OpenAPI specs
- Sandboxed iframe execution of generated HTML with CSP protection
- Save/load functionality for generated UIs
- Theming support via CSS variables and theme objects
- TypeScript types for backend integration
- Example vanilla JS frontend
- Example Node.js/Express backend with mock LLM responses
- API spec loader with URL and inline string support
- Auth header injection for secure API calls
- System prompt builder with developer overrides
- Comprehensive test suite (128 tests)
