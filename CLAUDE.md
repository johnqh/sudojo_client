# CLAUDE.md

This file provides context for AI assistants working on this codebase.

## Project Overview

`@sudobility/sudojo_client` is the TypeScript API client library for the Sudojo API. It serves as the integration layer between Sudoku apps and the backend, providing:

- **React Query hooks** for all API endpoints (30+ hooks across 10+ files)
- **Type-safe `SudojoClient` class** for direct API calls (40+ methods)
- **Solver integration** for hint generation with subscription tier enforcement
- **Solution decryption** (AES-GCM) for encrypted puzzle answers
- **Query key factories** and cache invalidation utilities
- **Custom errors** (`HintAccessDeniedError` for HTTP 402)

Published to npm under `@sudobility` scope. Consumed by `sudojo_app` (web) and `sudojo_app_rn` (mobile).

## Runtime & Package Manager

**This project uses Bun.** Do not use npm, yarn, or pnpm.

```bash
bun install           # Install dependencies
bun run build         # Build to dist/ (tsc)
bun run build:watch   # Build in watch mode
bun run clean         # Remove dist/
bun run test          # Run tests (vitest, watch mode)
bun run test:run      # Run tests once
bun run test:watch    # Run tests in watch mode
bun run test:coverage # Run tests with coverage (70% threshold)
bun run typecheck     # Type-check without emitting
bun run typecheck:watch # Watch mode type checking
bun run lint          # Run ESLint
bun run lint:fix      # ESLint with auto-fix
bun run format        # Format with Prettier
bun run format:check  # Check formatting
bun run check-all     # Run lint + typecheck + tests
bun run verify        # lint + typecheck + tests + build (full verification)
```

## Tech Stack

- **Runtime**: Bun
- **Language**: TypeScript (ES2020, ESM, extremely strict)
- **Testing**: Vitest + @testing-library/react + happy-dom
- **Data Fetching**: @tanstack/react-query v5.x
- **DI**: @sudobility/di for dependency injection
- **Types**: @sudobility/sudojo_types, @sudobility/types

## Project Structure

```
src/
├── index.ts                      # Main exports (all public APIs)
├── errors/
│   ├── hint-access-denied.ts     # HintAccessDeniedError (HTTP 402)
│   └── index.ts
├── hooks/                        # React Query hooks (30+ hooks)
│   ├── query-keys.ts             # Hierarchical query key factory
│   ├── query-config.ts           # STALE_TIMES constants
│   ├── use-sudojo-health.ts      # Server health check
│   ├── use-sudojo-levels.ts      # Level CRUD hooks
│   ├── use-sudojo-techniques.ts  # Technique hooks
│   ├── use-sudojo-learning.ts    # Educational content hooks
│   ├── use-sudojo-boards.ts      # Puzzle board CRUD + random
│   ├── use-sudojo-dailies.ts     # Daily puzzle hooks (today/date/UUID)
│   ├── use-sudojo-challenges.ts  # Challenge puzzle hooks
│   ├── use-sudojo-users.ts       # User info + subscription status
│   ├── use-sudojo-practices.ts   # Practice puzzle hooks with counts
│   ├── use-sudojo-gamification.ts # Points, badges, game sessions
│   ├── use-sudojo-invalidation.ts # Cache invalidation utilities
│   ├── index.ts
│   └── __tests__/
├── network/
│   ├── sudojo-client.ts          # SudojoClient class (40+ API methods)
│   ├── index.ts
│   └── __tests__/
├── solver/                       # Solver API integration
│   ├── hooks/
│   │   ├── use-solver.ts         # Solve/validate/generate hooks
│   │   ├── query-keys.ts         # Solver query keys
│   │   ├── query-config.ts       # Solver STALE_TIMES
│   │   └── __tests__/
│   └── index.ts
dist/                             # Built output (git-ignored)
```

## Key Patterns

### React Query Hook Pattern

Every hook follows this structure:

```typescript
export const useResource = (
  networkClient: NetworkClient,
  baseUrl: string,
  token: string,
  options?: UseQueryOptions<Response>,
): UseQueryResult<Response> => {
  const client = useMemo(() => new SudojoClient(networkClient, baseUrl), [networkClient, baseUrl]);
  const queryFn = useCallback(async () => client.method(token, params), [client, token, params]);
  const isEnabled = !!token && (options?.enabled ?? true);

  return useQuery({
    queryKey: queryKeys.sudojo.resource(id),
    queryFn,
    staleTime: STALE_TIMES.RESOURCE,
    ...options,
    enabled: isEnabled,
  });
};
```

### Mutation Hook Pattern

Create/update/delete mutations include automatic cache invalidation:

```typescript
export const useCreateResource = (networkClient, baseUrl) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ token, data }) => client.createResource(token, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.sudojo.resources() });
    },
  });
};
```

### Query Key Hierarchy

Keys follow a strict hierarchy for targeted invalidation:

```typescript
queryKeys.sudojo.all()                    // ["sudojo"]
queryKeys.sudojo.boards()                 // ["sudojo", "boards"]
queryKeys.sudojo.boards({ level: 3 })     // ["sudojo", "boards", { level: 3 }]
queryKeys.sudojo.board(uuid)              // ["sudojo", "boards", uuid]
queryKeys.sudojo.boardRandom({ level: 3 })// ["sudojo", "boards", "random", { level: 3 }]
```

### Stale Time Strategy

Three tiers of cache freshness:
- **10 min**: LEVELS, TECHNIQUES, LEARNING (admin-managed reference data)
- **5 min**: BOARDS, DAILIES, CHALLENGES (periodically changing content)
- **2 min**: USER_SUBSCRIPTION (volatile user state)
- **1 min**: HEALTH_STATUS (connectivity checks)
- **0 ms**: Random endpoints (always fetch fresh)

### Token & Auth Handling

- Token passed as parameter to every hook/method (not stored in client)
- Sent as `Authorization: Bearer {token}` header
- Queries disabled when token is empty/falsy
- Public endpoints accept but don't require token

### Solution Decryption

Puzzle solutions can be encrypted with AES-GCM:

```typescript
await configureSolutionKey("hex_encoded_key"); // Call once at app startup
// Encrypted solutions prefixed with "enc:" are automatically decrypted
```

### Solver API

- Long timeout (120 seconds) for solve/validate operations
- `HintAccessDeniedError` thrown on HTTP 402 (subscription tier enforcement)
- Custom URL encoding (commas NOT percent-encoded in pencilmarks)
- Deterministic caching (same input = same output)

## Peer Dependencies

Required in the consuming app:
- `@sudobility/di` ^1.5.56 — Dependency injection container
- `@sudobility/sudojo_types` ^1.2.55 — API type definitions
- `@sudobility/types` ^1.9.62 — Common types (NetworkClient, UserInfoResponse)
- `@tanstack/react-query` >=5.0.0 — Data fetching/caching
- `react` >=18.0.0

## Code Conventions

- Export all public APIs from `src/index.ts` (barrel export, named exports only)
- Hooks follow `use*` naming convention
- Constants use `UPPER_SNAKE_CASE`
- Comprehensive JSDoc comments on every public function
- TypeScript strict mode with `exactOptionalPropertyTypes`, `noUncheckedIndexedAccess`, `noImplicitOverride`
- Prettier: double quotes, semicolons, trailing commas (all), 80 chars, 2 spaces
- Tests co-located in `__tests__/` directories
- Coverage thresholds: 70% (branches, functions, lines, statements)

## Publishing

```bash
# Bump version in package.json
bun run prepublishOnly  # Runs clean + build
npm publish             # Publish to npm (restricted access)
```

## Common Tasks

### Add New Hook
1. Create hook file in `src/hooks/` following the hook pattern above
2. Add query key in `query-keys.ts`
3. Add stale time in `query-config.ts` if needed
4. Export from `src/hooks/index.ts` and `src/index.ts`
5. Add tests in `__tests__/`

### Add New API Method
1. Add method to `SudojoClient` class in `src/network/sudojo-client.ts`
2. Create corresponding hook if needed
3. Export from `src/index.ts`
