# CLAUDE.md

This file provides context for AI assistants working on this codebase.

## Project Overview

`@sudobility/sudojo_client` is a TypeScript client library for the Sudojo API. It provides:
- React Query hooks for data fetching
- Type-safe API client functions
- Solver integration for hint generation
- Network layer abstraction

Published to npm under `@sudobility` scope for use in Sudojo apps.

## Runtime & Package Manager

**This project uses Bun.** Do not use npm, yarn, or pnpm.

```bash
bun install           # Install dependencies
bun run build         # Build to dist/
bun run build:watch   # Build in watch mode
bun run test          # Run tests (vitest)
bun run test:run      # Run tests once
bun run test:watch    # Run tests in watch mode
bun run test:coverage # Run tests with coverage
bun run typecheck     # Type-check without emitting
bun run lint          # Run ESLint
bun run lint:fix      # ESLint with auto-fix
bun run format        # Format with Prettier
bun run check-all     # Run lint + typecheck + tests
```

## Tech Stack

- **Runtime**: Bun
- **Language**: TypeScript (ESM)
- **Testing**: Vitest + @testing-library/react
- **Data Fetching**: @tanstack/react-query
- **DI**: @sudobility/di for dependency injection
- **Types**: @sudobility/sudojo_types

## Project Structure

```
src/
├── index.ts                    # Main exports
├── errors/                     # Custom error classes
│   └── hint-access-denied.ts   # HintAccessDeniedError
├── hooks/                      # React Query hooks (10+ files)
│   ├── query-keys.ts           # Query key factory
│   ├── query-config.ts         # Stale time configuration
│   ├── use-sudojo-levels.ts    # Level hooks
│   ├── use-sudojo-boards.ts    # Board/puzzle hooks
│   ├── use-sudojo-dailies.ts   # Daily puzzle hooks
│   └── ...
├── network/                    # API client layer
│   └── sudojo-client.ts        # SudojoClient class (40+ API methods)
└── solver/                     # Solver integration
    └── hooks/use-solver.ts     # Solver query hooks
dist/                           # Built output (git-ignored)
```

## Usage Patterns

### React Query Hooks
```typescript
import { useDailyPuzzle, useLevels } from '@sudobility/sudojo_client';

function Component() {
  const { data: daily, isLoading } = useDailyPuzzle();
  const { data: levels } = useLevels();
  // ...
}
```

### Direct API Calls
```typescript
import { SudojoClient } from '@sudobility/sudojo_client';

const client = new SudojoClient(networkClient, 'https://api.sudojo.com');
const levels = await client.getLevels(token);
const daily = await client.getDailyByDate(token, '2024-01-15');
```

## Peer Dependencies

This library requires these peer dependencies in the consuming app:
- `@sudobility/di` - Dependency injection
- `@sudobility/sudojo_types` - API types
- `@sudobility/types` - Common types
- `@tanstack/react-query` - Data fetching
- `react` - React 18+

## Code Conventions

- Export all public APIs from `src/index.ts`
- Hooks follow `use*` naming convention
- API functions are pure async functions
- Use types from `@sudobility/sudojo_types`
- All hooks should handle loading/error states

## Testing

Tests use Vitest with happy-dom:

```typescript
import { describe, it, expect } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useDailyPuzzle } from '../hooks/useDailies';

describe('useDailyPuzzle', () => {
  it('should fetch daily puzzle', async () => {
    const { result } = renderHook(() => useDailyPuzzle());
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toBeDefined();
  });
});
```

## Publishing

Package is published to npm with restricted access:

```bash
# Bump version in package.json
bun run prepublishOnly  # Runs clean + build
npm publish             # Publish to npm
```

## Common Tasks

### Add New Hook
1. Create hook file in `src/hooks/`
2. Implement using `useQuery` or `useMutation` from react-query
3. Export from `src/index.ts`
4. Add tests

### Add New API Endpoint
1. Add function in `src/network/endpoints.ts`
2. Create corresponding hook if needed
3. Export from `src/index.ts`
