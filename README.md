# @sudobility/sudojo_client

React Query hooks and API client for the Sudojo Sudoku learning platform.

## Installation

```bash
bun add @sudobility/sudojo_client
```

## Usage

```typescript
import { useDailyPuzzle, useLevels } from '@sudobility/sudojo_client';

function Component() {
  const { data: daily, isLoading } = useDailyPuzzle();
  const { data: levels } = useLevels();
}
```

```typescript
import { SudojoClient } from '@sudobility/sudojo_client';

const client = new SudojoClient(networkClient, 'https://api.sudojo.com');
const levels = await client.getLevels(token);
```

## API

- **Hooks**: `useDailyPuzzle`, `useLevels`, `useBoards`, `useTechniques`, `useChallenges`, `useProgress`, and more
- **Client**: `SudojoClient` class with 40+ typed API methods
- **Solver**: `useSolver` hooks for hint generation integration
- **Query keys**: Centralized query key factory for cache management

## Development

```bash
bun run build        # Build to dist/
bun run test         # Run Vitest
bun run typecheck    # TypeScript check
bun run lint         # ESLint
bun run check-all    # Lint + typecheck + tests
```

## Related Packages

- `@sudobility/sudojo_types` -- Type definitions (peer dependency)
- `@sudobility/sudojo_lib` -- Business logic hooks
- `sudojo_app` / `sudojo_app_rn` -- Consumer apps

## License

BUSL-1.1
