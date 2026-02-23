# Improvement Plans for @sudobility/sudojo_client

## Priority 1 - High Impact

### 1. Add JSDoc to All Hook Exports
- The client exports 40+ React Query hooks from `src/index.ts` (e.g., `useSudojoLevels`, `useSudojoDailyByDate`, `useSudojoPlayStart`) but none have JSDoc documentation at the export level.
- Hook files like `use-sudojo-boards.ts`, `use-sudojo-dailies.ts`, `use-sudojo-gamification.ts` should document: what data the hook returns, required parameters, loading/error states, cache behavior, and when to use the hook vs. direct client calls.
- The solver hooks (`useSolverSolve`, `useSolverValidate`, `useSolverGenerate`) interact with an external solver service and should document expected latency, error handling, and retry behavior.
- The `STALE_TIMES` and `SOLVER_STALE_TIMES` constants should document why each resource has its specific stale time configuration.
- The `queryKeys` factory is well-structured but lacks JSDoc explaining the key hierarchy and invalidation patterns.

### 2. Expand Test Coverage Beyond the Network Client
- Test coverage is concentrated in `src/network/__tests__/sudojo-client.test.ts` for the `SudojoClient` class, but there appear to be no tests for the React Query hooks themselves.
- Hook tests should verify: correct query key usage, loading/error/success state transitions, cache invalidation on mutations, and optimistic update behavior.
- The `HintAccessDeniedError` error class in `src/errors/hint-access-denied.ts` should have dedicated tests verifying its properties and error handling flow.
- The `createQueryKey` and `getServiceKeys` helper functions should be tested.
- The solver hooks directory has an `__tests__` directory that should be verified for adequate coverage.

### 3. Add Error Handling Documentation and Patterns
- The `SudojoClient` class has 40+ methods but error handling patterns are not documented. Consumers need to know: which errors are thrown vs. returned, how to handle 401/403/402 responses, and what retry logic is built in.
- The `HintAccessDeniedError` is the only custom error class. Other API errors (network failures, 500s, validation errors) are presumably thrown as generic errors but this is not documented.
- The URL search params utility (`createURLSearchParams`) has a special case for not encoding commas in pencilmarks. This kind of API-specific behavior should be documented with JSDoc.

## Priority 2 - Medium Impact

### 4. Improve Type Safety in SudojoClient Methods
- The `SudojoClient` constructor takes a `NetworkClient` and base URL, but the `NetworkClient` type comes from `@sudobility/types` and may not enforce response type safety for all endpoints.
- Several client methods accept `Optional<T>` parameters for query params but build URL search params manually. A shared query parameter builder with type inference could reduce duplication across the 40+ methods.
- The re-exports of `isValidUUID` and `validateUUID` from `@sudobility/sudojo_types` in the network module suggest these are used internally; they should be documented as part of the public API or removed from exports if they are implementation details.

### 5. Add Query Invalidation Helpers
- Mutation hooks (create, update, delete) should document or provide helpers for cache invalidation. For example, after `useSudojoCreateDaily` succeeds, which queries should be invalidated?
- The `queryKeys` factory is a good foundation but there are no exported utility functions for common invalidation patterns like "invalidate all boards for a level" or "invalidate all dailies."
- Consider exporting a `useSudojoInvalidation` hook or utility that wraps common invalidation patterns.

### 6. Centralize API Configuration
- The `createApiConfig` factory in `sudojo-client.ts` hardcodes endpoint URL patterns. If the API version changes (e.g., `/api/v2`), every endpoint string needs updating.
- The solver hooks appear to connect to a separate service URL. The configuration for multiple service URLs should be documented and validated at initialization time.

## Priority 3 - Nice to Have

### 7. Add Request/Response Logging Hooks
- For debugging purposes, consider providing an optional logging middleware or hook that logs API requests and responses. The `SudojoClient` could accept an optional logger in its constructor.
- This would help consumers debug issues without needing to add interceptors to the underlying `NetworkClient`.

### 8. Provide Offline Support Utilities
- The client library does not appear to have offline support or cache persistence utilities. Since the web app supports PWA mode, the client could provide React Query persistence adapters or offline mutation queuing.
- Document which queries are safe to serve from stale cache and which require fresh data.

### 9. Add Performance Monitoring Integration
- The client makes many API calls across different endpoints. Consider adding optional performance monitoring that tracks: request latency, cache hit rates, and error rates per endpoint.
- This could integrate with the `PerformancePanel` component already used in the web app.
