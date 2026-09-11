# @sudobility/sudojo_client

React Query hooks and API client for the Sudojo Sudoku learning platform.

## Installation

```bash
bun add @sudobility/sudojo_client
# peers
bun add @sudobility/sudojo_types @sudobility/types @sudobility/di @tanstack/react-query react
```

## Usage

Every hook takes an injected `NetworkClient` (from `@sudobility/types`), the API origin, and
usually a Firebase ID token. Pass `""` for public endpoints.

```typescript
import { useSudojoLevels, useSudojoTodayDaily } from '@sudobility/sudojo_client';

function Component({ networkClient, token }) {
  const baseUrl = 'https://api.sudojo.com'; // origin only, no /api/v1
  const { data: daily, isLoading } = useSudojoTodayDaily(networkClient, baseUrl, token);
  const { data: levels } = useSudojoLevels(networkClient, baseUrl, token);
  // data is BaseResponse<T>: levels?.data is Level[]
}
```

```typescript
import { SudojoClient, configureSolutionKey } from '@sudobility/sudojo_client';

await configureSolutionKey(solutionKeyHex); // optional: decrypts "enc:" solution fields
const client = new SudojoClient(networkClient, 'https://api.sudojo.com');
const levels = await client.getLevels(token);
```

## API

- **Hooks**: 57 `useSudojo*` hooks, including `useSudojoInvalidation`, covering levels, techniques, learning, boards, dailies, challenges, users, practices, communities, strategies, gamification, and health
- **Solver hooks**: `useSolverSolve`, `useSolverValidate`, `useSolverGenerate`
- **Client**: `SudojoClient` class with 67 typed API methods, and the `createSudojoClient` factory
- **Errors**: `HintAccessDeniedError` (HTTP 402 from the solver)
- **Query keys**: `queryKeys`, `solverQueryKeys`, `STALE_TIMES`, `SOLVER_STALE_TIMES`

Full endpoint, hook, and cache reference: [docs/API.md](docs/API.md).

## Development

```bash
bun run build        # Build to dist/
bun run test:run     # Run Vitest once (`bun run test` watches)
bun run typecheck    # TypeScript check
bun run lint         # ESLint
bun run check-all    # Lint + typecheck + tests
```

## Related Packages

- `@sudobility/sudojo_types`: type definitions (dependency + peer dependency)
- `@sudobility/types`: `NetworkClient`, `BaseResponse` (peer dependency)
- `sudojo_api`: the backend this client calls
- `@sudobility/sudojo_lib`: business-logic hooks built on this client
- `sudojo_app` / `sudojo_app_rn` / `sudojo_extension`: consumer apps

## License

BUSL-1.1
