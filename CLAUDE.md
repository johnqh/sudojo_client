# CLAUDE.md

> **Git policy — never auto-commit or auto-push.** Leave your work in the working tree.
> Run `git commit`, `git push`, `gh pr create`, or `scripts/push_all.sh` **only when the user
> explicitly asks in that turn**. Approval for an earlier change does not carry forward, and
> finishing a task is not permission to commit it.

This file provides context for AI assistants working on this codebase.

## Project Overview

`@sudobility/sudojo_client` is the TypeScript API client library for the Sudojo API (`sudojo_api`). It is the integration layer between Sudoku apps and the backend, providing:

- **`SudojoClient` class**: 67 typed methods covering every `/api/v1/...` resource the apps use
- **React Query hooks**: 58 `useSudojo*` hooks in 14 files, plus 3 `useSolver*` hooks
- **Solver integration** (`/api/v1/solver/*` proxy), with `HintAccessDeniedError` for HTTP 402
- **Solution decryption** (AES-256-GCM) for `enc:`-prefixed `solution` fields
- **Query key factories**, `STALE_TIMES`, and cache invalidation utilities

It is a single package (not a monorepo) with no runtime code outside `src/`. Full endpoint → method → hook map: [docs/API.md](docs/API.md).

```
 sudojo_app / sudojo_app_rn / sudojo_extension / sudojo_lib
                     │  hooks or SudojoClient
                     ▼
 @sudobility/sudojo_client ── NetworkClient (injected, from @sudobility/types)
                     │  HTTP  Authorization: Bearer <Firebase ID token>
                     ▼
 sudojo_api  (Hono, /api/v1/...)  ── /api/v1/solver/* proxies ──▶ sudojo_solver
```

## Commands

**This project uses Bun** (lockfile `bun.lock`). Do not use npm, yarn, or pnpm.

```bash
bun install             # Install dependencies
bun run build           # tsc -p tsconfig.build.json → dist/ (tests excluded)   [verified]
bun run build:watch     # tsc --watch (uses tsconfig.json)
bun run clean           # rm -rf dist
bun run test            # vitest (watch mode locally; single run under CI)
bun run test:run        # vitest run: 4 files, 139 tests                        [verified]
bun run test:watch      # vitest --watch
bun run test:coverage   # vitest run --coverage → coverage/
bun run typecheck       # tsc --noEmit                                          [verified]
bun run typecheck:watch
bun run lint            # eslint src (flat config; includes prettier/prettier)  [verified]
bun run lint:fix
bun run format          # prettier --write src/**/*.ts   (see Gotchas: glob)
bun run format:check    # prettier --check src/**/*.ts                          [verified]
bun run check-all       # lint + typecheck + test:run
bun run verify          # lint + typecheck + test:run + build
```

`[verified]` means the command was run and passed. `dist/` is gitignored and may be stale locally.

## Tech Stack

| Area | Choice |
|---|---|
| Runtime / PM | Bun 1.x |
| Language | TypeScript ^5.9 (ES2020 target, ESM `"type": "module"`, `moduleResolution: bundler`, very strict) |
| Data fetching | `@tanstack/react-query` v5 (peer `>=5.0.0`; dev ^5.90) |
| Tests | Vitest ^3.2 + happy-dom, `globals: true`. `@sudobility/di/mocks` `MockNetworkClient` for client tests |
| Lint / format | ESLint 9 flat config (`eslint.config.js`) + Prettier 3 via `eslint-plugin-prettier` |
| CI | `.github/workflows/ci-cd.yml` → `johnqh/workflows/.github/workflows/unified-cicd.yml@main` |

## Project Structure

```
src/
├── index.ts                       # Package entry: the ONLY public surface (named exports)
├── errors/
│   ├── hint-access-denied.ts      # HintAccessDeniedError (HTTP 402, code HINT_ACCESS_DENIED)
│   ├── index.ts
│   └── __tests__/
├── network/
│   ├── sudojo-client.ts           # SudojoClient (67 methods), createApiConfig ENDPOINTS,
│   │                              #   createURLSearchParams, configureSolutionKey/decryption
│   ├── index.ts
│   └── __tests__/sudojo-client.test.ts
├── hooks/                         # 58 React Query hooks
│   ├── query-keys.ts              # queryKeys.sudojo.*, createQueryKey, getServiceKeys, QueryKey
│   ├── query-config.ts            # STALE_TIMES
│   ├── use-sudojo-{health,levels,techniques,learning,boards,dailies,challenges,
│   │   users,practices,communities,strategies,gamification,invalidation}.ts
│   ├── index.ts
│   └── __tests__/query-keys.test.ts
└── solver/
    ├── index.ts                   # re-exports hooks + solver types (types NOT re-exported by src/index.ts)
    └── hooks/
        ├── use-solver.ts          # useSolverSolve / useSolverValidate / useSolverGenerate
        ├── query-keys.ts          # solverQueryKeys, getSolverServiceKeys
        ├── query-config.ts        # SOLVER_STALE_TIMES
        └── __tests__/
docs/API.md                        # Endpoint / method / hook / cache reference
plans/IMPROVEMENTS.md              # Historical improvement plan (counts in it are dated)
.github/workflows/ci-cd.yml        # Calls shared unified-cicd workflow
tsconfig.json / tsconfig.build.json / vitest.config.ts / eslint.config.js / .prettierrc
```

## Public API Surface (`src/index.ts`)

| Category | Exports |
|---|---|
| Client | `SudojoClient`, `createSudojoClient(networkClient, baseUrl)`, `configureSolutionKey(hex)`, `isValidUUID`, `validateUUID` (re-exported from sudojo_types) |
| Types | `SolveOptions`, `ValidateOptions`, `GenerateOptions`, `QueryKey` |
| Errors | `HintAccessDeniedError` (+ static `isHintAccessDeniedError`) |
| Query utils | `queryKeys`, `createQueryKey`, `getServiceKeys`, `STALE_TIMES`, `solverQueryKeys`, `getSolverServiceKeys`, `SOLVER_STALE_TIMES` |
| Levels / Techniques / Learning | `useSudojoLevels`, `useSudojoLevel`, `useSudojo{Create,Update,Delete}Level`; same five-hook pattern for `Technique(s)`; `useSudojoLearning`, `useSudojoLearningItem`, `useSudojo{Create,Update,Delete}Learning` |
| Boards / Dailies / Challenges | `useSudojoBoards`, `useSudojoBoard`, `useSudojoRandomBoard`, `useSudojo{Create,Update,Delete}Board`; `useSudojoDailies`, `useSudojoDaily`, `useSudojoTodayDaily`, `useSudojoDailyByDate`, `useSudojo{Create,Update,Delete}Daily`; `useSudojoChallenges`, `useSudojoChallenge`, `useSudojoRandomChallenge`, `useSudojo{Create,Update,Delete}Challenge` |
| Users | `useSudojoUser`, `useSudojoUserSubscription` |
| Practices | `useSudojoPracticeCounts`, `useSudojoRandomPractice`, `useSudojoCreatePractice`, `useSudojoDeleteAllPractices`, `useSudojoRegeneratePracticeHints` |
| Communities / Strategies | `useSudojoCommunities`, `useSudojo{Create,Update,Delete}Community`; `useSudojoStrategies`, `useSudojoStrategyByStub`, `useSudojo{Create,Update,Delete}Strategy` |
| Gamification | `useSudojoGamificationStats`, `useSudojoBadgeDefinitions`, `useSudojoPointHistory`, `useSudojoPlayStart`, `useSudojoPlayFinish` |
| Other | `useSudojoHealth`, `useSudojoInvalidation`, `useSudojoOcrExtract`, `useSolverSolve`, `useSolverValidate`, `useSolverGenerate` |

The `exports` map has two entries: `.` (`dist/index.js` - hooks included, so React and
`@tanstack/react-query` must be present) and `./network` (`dist/network/index.js` - `SudojoClient`
only, no React). Node consumers such as `sudojo_bot` import the `./network` entry. Anything not in
`src/index.ts` or `src/network/index.ts` is effectively private.

### OCR

`SudojoClient.extractOcr(token, image, { timeout })` posts an image to `/api/v1/ocr/extract`; the
hook is `useSudojoOcrExtract`. It strips a `data:` URL prefix, rejects an empty image, and defaults
to a 60s timeout because the API may try the sudojo_ocr_ml model service and then its own Tesseract
fallback. This is the single OCR path for every frontend - the web app, the RN app, the extension
and the bot no longer bundle an OCR engine.

## Key Patterns

### Query Hook Pattern

```typescript
export const useSudojoThing = (
  networkClient: NetworkClient,
  baseUrl: string,
  token: string,
  id: string,
  options?: Omit<UseQueryOptions<BaseResponse<Thing>>, "queryKey" | "queryFn">,
): UseQueryResult<BaseResponse<Thing>> => {
  const client = useMemo(() => new SudojoClient(networkClient, baseUrl), [networkClient, baseUrl]);
  const queryFn = useCallback(async () => client.getThing(token, id), [client, token, id]);
  // Public endpoints gate only on required params; auth endpoints also require !!token
  const isEnabled = !!id && (options?.enabled !== undefined ? options.enabled : true);

  return useQuery({
    queryKey: queryKeys.sudojo.thing(id),
    queryFn,
    staleTime: STALE_TIMES.THING,
    ...options,
    enabled: isEnabled, // always last, so callers can't bypass the gate
  });
};
```

Token-gated query hooks: `useSudojoUser`, `useSudojoUserSubscription`, `useSudojoGamificationStats`, `useSudojoPointHistory`, `useSolverSolve`, `useSolverGenerate`. All other query hooks run without a token.

### Mutation Hook Pattern

Create/update/delete mutations include automatic cache invalidation:

```typescript
export const useCreateResource = (networkClient, baseUrl) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ token, data }) => client.createResource(token, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [...queryKeys.sudojo.all(), "resources"] });
    },
  });
};
```

Updates also invalidate the item key; deletes `removeQueries` it.

### Query Key Hierarchy

Root is `["sudojo"]`, and solver keys live under `["sudojo", "solver"]`. Filter-taking factories always append the filter slot:

```typescript
queryKeys.sudojo.all()                     // ["sudojo"]
queryKeys.sudojo.boards()                  // ["sudojo", "boards", undefined]  ← note trailing slot
queryKeys.sudojo.boards({ level: 3 })      // ["sudojo", "boards", { level: 3 }]
queryKeys.sudojo.board(uuid)               // ["sudojo", "boards", uuid]
queryKeys.sudojo.boardRandom({ level: 3 }) // ["sudojo", "boards", "random", { level: 3 }]
solverQueryKeys.validate(original)         // ["sudojo", "solver", "validate", original]
```

To invalidate a whole resource, use the prefix `[...queryKeys.sudojo.all(), "boards"]`, not `boards()`. That is what the built-in mutations and `useSudojoInvalidation` do.

### Stale Times

| Value | Used by |
|---|---|
| 10 min | `STALE_TIMES.LEVELS`, `TECHNIQUES`, `LEARNING`, `COMMUNITIES`, `STRATEGIES`; badge definitions; `SOLVER_STALE_TIMES.VALIDATE` |
| 5 min | `BOARDS`, `DAILIES`, `CHALLENGES`, `USER` |
| 2 min | `USER_SUBSCRIPTION`; gamification stats |
| 1 min | `HEALTH_STATUS`; `SOLVER_STALE_TIMES.SOLVE` |
| 0 | random challenge, random practice, practice counts, point history, `SOLVER_STALE_TIMES.GENERATE` |
| `Infinity` | `useSudojoRandomBoard` (new puzzle only via `refetch()`; token held in a ref so refreshes don't refetch) |

### Auth, Base URL, Requests

- `token` (Firebase ID token) is a parameter of every call and is not stored in the client. It is sent as `Authorization: Bearer <token>` only when truthy.
- `baseUrl` is the API **origin** (e.g. `https://api.sudojo.com`). Endpoints already include `/api/v1`, and health is `GET /`, so a trailing slash or `/api/v1` suffix breaks URLs.
- Only `networkClient.request()` is used. Consumers inject any `NetworkClient` implementation from `@sudobility/types`.
- Hooks build a fresh `SudojoClient` per `(networkClient, baseUrl)` via `useMemo`. Pass stable references.

### Solution Decryption

```typescript
await configureSolutionKey(hexKey); // once at startup; "" or unset → no-op
```

Every response is walked recursively, and any `solution` string starting with `enc:` is decrypted with WebCrypto (`globalThis.crypto.subtle`, `atob`). The key is module-global. Without a key, `enc:` strings pass through unchanged. With a wrong key, `subtle.decrypt` throws and the whole request rejects.

### Solver

- `solverSolve` / `solverValidate` use 120 s timeouts; `regeneratePracticeHints` uses 600 s.
- `solverSolve` builds its own request. It throws `HintAccessDeniedError` on 402 + `error.code === "HINT_ACCESS_DENIED"`, and a generic `Error` on any other `!ok`.
- Solver query params are sorted alphabetically, and commas are left unencoded (`createURLSearchParams`). The code comment still says the backend is Kotlin. It is now `sudojo_api` (Hono) proxying to `sudojo_solver`.
- `SolveOptions.techniques` is a comma-separated list of technique IDs (`"1,2,60"`), **not** a bitmask. It needs no BigInt handling.

### Technique Bitmasks (decimal strings, never JS numbers)

Bit N = technique id N (ids 1–60). Any mask with an id ≥ 54 exceeds 2^53, so a JS number silently drops low bits: `Number("1152921504606846978")` (technique 60 + technique 1) loses technique 1. The owner's chosen wire format is a **base-10 string**, with `bigint` for bit math.

- **Responses:** `sudojo_api` sends an exact string next to each numeric field: `techniques_bitmask` on boards, dailies, and solver validate/generate, and `techniques_bitfield_bitmask` on examples. The client returns response bodies untouched (the `decryptSolutionFields` walk copies strings as-is). To make decisions, read `techniqueBitmaskOf(obj)` (a `bigint`, from sudojo_types), never the numeric `techniques`. No code in `src/` reads a mask today.
- **Requests:** `BoardQueryParams.techniques` / `technique_bit`, the board/daily bodies' `techniques`, and the example body's `techniques_bitfield` accept `number | string`. Send `formatTechniqueBitmask(mask)`. `getBoards` formats with `bitmaskQueryValue`: strings and bigints pass through exactly, and integer numbers go through `BigInt(n)`. Never use `String(n)` for a mask, because it rounds anything above 2^53 to a *different* decimal: `String(2 ** 60)` is `"1152921504606847000"` (2^60 + 24), which the API reads as techniques 60, 4 and 3. JSON bodies don't have this problem, because the API `JSON.parse`s a number back to the same double. `request()` serializes a stray `bigint` in a body as its decimal string (the `bigintAsString` replacer) instead of throwing. `sudojo_api` returns 400 for invalid values.
- **Query keys:** React Query hashes keys with `JSON.stringify`, which throws on `bigint`, and numbers beyond 2^53 collide. If a key ever carries a mask, put it in as a string. No key does today, because `useSudojoBoards` forwards only `level`.
- Tests: "technique bitmasks beyond 2^53" in `src/network/__tests__/sudojo-client.test.ts`, and "query key serializability" in `src/hooks/__tests__/query-keys.test.ts`.

**Pending sudojo_types release.** The `*_bitmask` response fields, the `number | string` request types, and the BigInt helpers (`parseTechniqueBitmask`, `techniqueBitmaskOf`, `hasTechniqueInBitmask`, `techniqueIdsFromBitmask`, `techniqueIdsToBitmask`, `formatTechniqueBitmask`) exist only in the local, unpublished `../sudojo_types/src/index.ts`. The installed 1.2.61 types say `techniques: number`. `src/` doesn't import the new helpers, so `typecheck` and `test:run` pass against either version. To check against the local source without touching `package.json` or `bun.lock`, use a throwaway config and delete it afterwards: a tsconfig that extends `tsconfig.json` with `"rootDir": ".."` and `paths: {"@sudobility/sudojo_types": ["../sudojo_types/src/index.ts"]}`, and a vitest config that `mergeConfig`s `vitest.config.ts` with the same `resolve.alias`. Once sudojo_types is published, bump its ranges here and remove this note.

## Sibling Dependencies (`@sudobility/*`)

| Package | Repo | `dependencies` | `devDependencies` | `peerDependencies` | Locked |
|---|---|---|---|---|---|
| `@sudobility/sudojo_types` | sudojo_types | ^1.2.61 | ^1.2.61 | ^1.2.67 | 1.2.61 |
| `@sudobility/types` | (shared) | — | ^1.9.67 | ^1.9.67 | 1.9.67 |
| `@sudobility/di` | (shared) | — | ^1.5.65 | ^1.5.65 | 1.5.65 |

Other peers: `@tanstack/react-query >=5.0.0`, `react >=18.0.0`. `@sudobility/di` is used only by tests (`@sudobility/di/mocks`), since `src/` never imports it.

**Consumers** (all `^0.0.150`): `sudojo_app` (dep), `sudojo_app_rn` (dep), `sudojo_extension` (dep), `sudojo_lib` (dev + peer). Exports in use: `SudojoClient`, `createSudojoClient`, `configureSolutionKey`, `HintAccessDeniedError`, `useSolverValidate`, and the level / technique / learning / board / daily / community / strategy / practice / user / gamification / play hooks. Renaming or removing any export breaks them.

## Cross-Repo Contracts

| Contract | Keep in sync with |
|---|---|
| `ENDPOINTS` paths, HTTP methods, query param names | `sudojo_api/src/routes/*.ts` (mounted at `/api/v1` in `src/routes/index.ts`) |
| Request/response types (`Board`, `SolveOptions`, `HintAccessDeniedResponse`, …) | `sudojo_types/src/index.ts`. Bump the sudojo_types range here when using new types |
| `enc:` solution format (AES-256-GCM, 12-byte nonce, base64) | `sudojo_api/src/lib/solution-crypto.ts` (`SOLUTION_ENCRYPTION_KEY`); apps pass the same hex key (e.g. sudojo_app `VITE_SOLUTION_KEY`) |
| 402 `HINT_ACCESS_DENIED` body | sudojo_types `HintAccessDeniedResponse`. Current `sudojo_api` has no code path that emits this code; its only 402 is the daily-limit body from `middleware/accessControl.ts`, which surfaces here as a generic `Error` |
| Solver `filters` param | Still sent, but `sudojo_api` `/solver/solve` ignores it (sudojo_types marks it legacy) |
| Technique bitmasks as decimal strings (`techniques_bitmask`, `techniques_bitfield_bitmask`; string or number accepted on input) | sudojo_api (parses and returns 400 on bad input), and sudojo_types BigInt helpers. See [Technique Bitmasks](#technique-bitmasks-decimal-strings-never-js-numbers) |

## Release / Publishing

Document only. Never run these without an explicit request (see git policy).

1. The family release script is `sudojo_app/scripts/push_all.sh`, which sources `workflows/scripts/push_projects.sh`. It runs in dependency order: `sudojo_types → sudojo_ocr → sudojo_api → sudojo_client → sudojo_lib → sudojo_ui → apps`. For each repo it updates `@sudobility/*` deps, validates, bumps the patch version (`npm version patch --no-git-tag-version`), commits (`chore: … bump version to X`), and pushes.
2. A push to `main` triggers CI (`unified-cicd.yml`): typecheck → lint → `bun run test` → build. If `package.json`'s version is not yet on npm, CI creates a GitHub release and runs `npm publish --access public`. Pushes to `develop` run tests only. This repo currently has only a `main` branch.
3. `prepublishOnly` (`clean && build`) runs on any manual `npm publish`.

## Code Conventions

- Export all public APIs from `src/index.ts` (barrel export, named exports only). New hooks must be added to both `src/hooks/index.ts` and `src/index.ts`.
- Hooks: `useSudojo*` / `useSolver*`. Signature is `(networkClient, baseUrl, token?, ...params, options?)`. Mutations take `(networkClient, baseUrl)`.
- Constants use `UPPER_SNAKE_CASE`
- JSDoc on public functions (most hooks document stale time and gating)
- TypeScript strict mode with `exactOptionalPropertyTypes`, `noUncheckedIndexedAccess`, `noImplicitOverride`, `noUnusedLocals/Parameters`. Optional params are typed `T | undefined` or `Optional<T>`.
- Prettier: double quotes, semicolons, trailing commas (all), 80 chars, 2 spaces, LF
- ESLint: `sort-imports` (member sort only), `prefer-template`, `object-shorthand`, unused vars must be `_`-prefixed
- Tests live in `__tests__/` directories next to the code they cover

## Gotchas

- **Tests are not typechecked or linted.** `tsconfig.json` excludes `**/*.test.ts`, and `eslint.config.js` ignores test files.
- **No coverage threshold.** `test:coverage` only reports (~25% lines; no hook render tests). The old 70% threshold was mis-nested under `global` and never enforced, so it was removed (owner decision, 2026-09-10) rather than left looking like a gate.
- **The `format` / `format:check` glob is shallow.** `src/**/*.ts` is expanded by `sh` without globstar, so it only matches `src/*/*.ts` and skips `src/index.ts`, `src/solver/hooks/*`, and all tests. Lint still enforces Prettier on non-test `src`.
- **`dist/` is bundler-only.** Imports are extensionless (`from "./network"`), so plain Node ESM can't load it (`ERR_UNSUPPORTED_DIR_IMPORT`). Vite, Metro, and Vitest are fine.
- **Hooks drop some query params.** `useSudojoBoards` forwards only `level` (not `limit/offset/techniques/technique_bit`), and `useSudojoRandomBoard` drops `symmetrical`. Use `SudojoClient` directly for those.
- **`useSudojoUserSubscription`'s key omits `testMode`.** Test and live results share one cache entry.
- `src/solver/index.ts` re-exports solver types (`SolveData`, `SolverHints`, …), but `src/index.ts` does not. Import those from `@sudobility/sudojo_types`.
- `request()` ignores `response.ok`. Non-2xx bodies resolve as data unless the `NetworkClient` throws.
- `useSudojoInvalidation` has no helpers for communities or strategies.
- `vitest.config.ts` defines an `@` → `src` alias that tsc doesn't know about. Don't use it in `src/`.

## Common Tasks

### Add New API Method
1. Add the path to `createApiConfig().ENDPOINTS` and a method on `SudojoClient` in `src/network/sudojo-client.ts`. Validate params before the request, matching existing checks.
2. Confirm the route exists in `sudojo_api/src/routes/` and the types exist in `@sudobility/sudojo_types`.
3. Add a test in `src/network/__tests__/sudojo-client.test.ts` (uses `MockNetworkClient`).
4. Add a row to `docs/API.md`.

### Add New Hook
1. Create or extend a `src/hooks/use-sudojo-*.ts` file following the hook pattern above.
2. Add a key factory in `query-keys.ts` (and a test in `hooks/__tests__/query-keys.test.ts`).
3. Add a `STALE_TIMES` entry in `query-config.ts` if needed.
4. Export from `src/hooks/index.ts` **and** `src/index.ts`.
5. Update the tables in `docs/API.md` and this file's Public API Surface.

## Git Workflow

- Do not use feature branches for code changes. Always stay on the current branch.
