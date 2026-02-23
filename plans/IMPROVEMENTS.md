# Improvement Plans for @sudobility/sudojo_client

## Priority 1 - High Impact

### 1. Add JSDoc to All Hook Exports -- COMPLETED

- Added comprehensive JSDoc to all 40+ hook exports across all hook files:
  - `use-sudojo-levels.ts` - All 5 hooks documented with params, return types, stale times, and cache invalidation behavior
  - `use-sudojo-boards.ts` - All 6 hooks documented, including special `staleTime: Infinity` behavior on random board
  - `use-sudojo-dailies.ts` - All 8 hooks documented
  - `use-sudojo-techniques.ts` - All 5 hooks documented
  - `use-sudojo-learning.ts` - All 5 hooks documented
  - `use-sudojo-challenges.ts` - All 6 hooks documented
  - `use-sudojo-users.ts` - Both hooks documented with auth requirements
  - `use-sudojo-practices.ts` - All 4 hooks documented with admin notes
  - `use-sudojo-gamification.ts` - All 5 hooks documented with game session flow
  - `use-sudojo-health.ts` - Hook documented
- Documented `STALE_TIMES` with rationale for each resource's cache duration
- Documented `SOLVER_STALE_TIMES` with latency notes and error handling behavior
- Added comprehensive JSDoc to `queryKeys` factory explaining key hierarchy and invalidation patterns
- Added JSDoc to `solverQueryKeys` factory with hierarchy and invalidation docs
- Documented `createQueryKey` and `getServiceKeys` helpers with examples

### 2. Expand Test Coverage Beyond the Network Client -- COMPLETED

- Added `src/errors/__tests__/hint-access-denied.test.ts` (11 tests):
  - Tests error construction, properties, readonly code, stack trace
  - Tests `isHintAccessDeniedError` type guard with various inputs (instances, generic errors, null, undefined, plain objects, strings, numbers)
  - Tests preservation of different hint levels
- Added `src/hooks/__tests__/query-keys.test.ts` (37 tests):
  - Tests all query key factory methods (health, levels, techniques, learning, boards, dailies, challenges, users, practices, gamification)
  - Tests keys with and without filter parameters
  - Tests `createQueryKey` helper with various argument types
  - Tests `getServiceKeys` helper
- Added `src/solver/hooks/__tests__/query-keys.test.ts` (11 tests):
  - Tests all solver query key methods (solve, validate, generate)
  - Tests with different options and key uniqueness
  - Tests `getSolverServiceKeys` helper
- Expanded `src/network/__tests__/sudojo-client.test.ts` (from 26 to 64 tests):
  - Added validation error tests (invalid levels, techniques, dates, userIds)
  - Added no-data handling test
  - Added practices endpoint tests (counts, random, create, delete all)
  - Added gamification tests (stats, badges, history with pagination, play start/finish)
  - Added solver tests (validate, generate with options)
  - Added examples tests (counts, list, filtered)
  - Added board counts tests
  - Added `createSudojoClient` factory test
  - Added `isValidUUID` and `validateUUID` utility export tests
- Total: 123 tests across 4 test files (up from 26 tests in 1 file)

### 3. Add Error Handling Documentation and Patterns -- COMPLETED

- Added comprehensive class-level JSDoc to `SudojoClient` documenting all error handling patterns:
  - Network errors (thrown by NetworkClient)
  - Empty response errors ("No data received from server")
  - Validation errors (invalid parameters thrown before request)
  - HTTP 402 (`HintAccessDeniedError` from `solverSolve()`)
  - Other HTTP errors (depend on NetworkClient implementation)
- Documented authentication pattern (Bearer token in Authorization header)
- Added detailed module-level JSDoc to `hint-access-denied.ts` with:
  - When the error is thrown
  - Error properties description
  - Code example for handling the error
  - Note that this is the only custom error class (others are generic Error)
- Added JSDoc to `createURLSearchParams` documenting the special comma encoding behavior for the solver API's pencilmark values
- Added JSDoc to `isValidUUID` and `validateUUID` re-exports documenting their public API role

## Priority 2 - Medium Impact

### 4. Improve Type Safety in SudojoClient Methods -- PARTIALLY COMPLETED

- Documented `isValidUUID` and `validateUUID` as intentional public API exports with JSDoc explaining their dual role (internal validation + consumer convenience)
- The shared query parameter builder and NetworkClient response type safety improvements were skipped as they would require larger architectural changes to the types package

### 5. Add Query Invalidation Helpers -- COMPLETED

- Created `src/hooks/use-sudojo-invalidation.ts` with a `useSudojoInvalidation` hook that provides:
  - `invalidateAll()` - nuclear option to invalidate all sudojo queries
  - `invalidateLevels()` - invalidate all level queries
  - `invalidateTechniques()` - invalidate all technique queries
  - `invalidateLearning()` - invalidate all learning queries
  - `invalidateBoards()` - invalidate all board queries (list + random + individual)
  - `invalidateDailies()` - invalidate all daily queries (list + random + today + by-date)
  - `invalidateChallenges()` - invalidate all challenge queries
  - `invalidateUsers()` - invalidate all user queries (info + subscription)
  - `invalidatePractices()` - invalidate all practice queries
  - `invalidateGamification()` - invalidate all gamification queries
- Exported from `src/hooks/index.ts` and `src/index.ts`
- All mutation hooks' `onSuccess` callbacks already document which queries they invalidate via JSDoc
- Added JSDoc to `queryKeys` factory explaining invalidation patterns with examples

### 6. Centralize API Configuration -- SKIPPED
- Skipped: Would require significant architectural changes to the endpoint configuration pattern
- The current hardcoded `/api/v1` pattern is stable and works well

## Priority 3 - Nice to Have

### 7. Add Request/Response Logging Hooks -- SKIPPED
- Skipped: Would require adding constructor parameters and middleware infrastructure to SudojoClient

### 8. Provide Offline Support Utilities -- SKIPPED
- Skipped: Would require external service integration (React Query persistence adapters) and complex infrastructure

### 9. Add Performance Monitoring Integration -- SKIPPED
- Skipped: Would require complex infrastructure and external monitoring service integration

## Additional Improvements Made

### Added `verify` Script
- Added `bun run verify` script to `package.json` that runs: lint + typecheck + test + build
- This is the standard verification command used across the Sudobility ecosystem
