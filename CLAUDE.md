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
├── index.ts           # Main exports
├── hooks/             # React Query hooks
│   ├── useDailies.ts  # Daily puzzle hooks
│   ├── useLevels.ts   # Level hooks
│   ├── useBoards.ts   # Board/puzzle hooks
│   └── ...
├── network/           # API client layer
│   ├── client.ts      # Base HTTP client
│   └── endpoints.ts   # API endpoint functions
└── solver/            # Solver integration
    └── client.ts      # Solver API client
dist/                  # Built output (git-ignored)
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
import { fetchDailyPuzzle, fetchLevels } from '@sudobility/sudojo_client';

const daily = await fetchDailyPuzzle();
const levels = await fetchLevels({ difficulty: 'medium' });
```

### Dependency Injection
The client uses @sudobility/di for configuration:
```typescript
import { Container } from '@sudobility/di';
import { SudojoClientModule } from '@sudobility/sudojo_client';

const container = new Container();
container.register(SudojoClientModule, { apiUrl: 'https://api.sudojo.com' });
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
