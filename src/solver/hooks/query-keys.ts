/**
 * Query Key Factory for Sudojo Solver TanStack Query
 *
 * Provides type-safe, consistent query keys for Solver API endpoints.
 * Following TanStack Query best practices for key structure.
 *
 * ## Key Hierarchy
 *
 * All solver keys start with `["sudojo", "solver"]` as the root:
 * - `["sudojo", "solver", "solve", { original, user, ... }]` - solve hints
 * - `["sudojo", "solver", "validate", originalPuzzle]` - validation
 * - `["sudojo", "solver", "generate", { symmetrical }]` - generation
 *
 * ## Invalidation
 *
 * Use `getSolverServiceKeys()` to invalidate all solver queries at once.
 * Individual solve/validate/generate keys include their parameters so
 * different inputs produce distinct cache entries.
 */

const solverBase = (): readonly ["sudojo", "solver"] =>
  ["sudojo", "solver"] as const;

export const solverQueryKeys = {
  /** Root key for all solver queries. Use for bulk invalidation. */
  all: solverBase,

  /**
   * Key for a solve hints query. Includes all puzzle state parameters
   * so different board states produce separate cache entries.
   */
  solve: (options: {
    original: string;
    user: string;
    autoPencilmarks?: boolean | undefined;
    pencilmarks?: string | undefined;
    filters?: string | undefined;
  }) => [...solverBase(), "solve", options] as const,

  /**
   * Key for a puzzle validation query. Since validation is deterministic
   * for a given original puzzle string, only the puzzle string is needed.
   */
  validate: (original: string) =>
    [...solverBase(), "validate", original] as const,

  /**
   * Key for a puzzle generation query. Includes symmetry preference
   * as different options may produce different puzzle types.
   */
  generate: (options?: { symmetrical?: boolean | undefined }) =>
    [...solverBase(), "generate", options] as const,
} as const;

/**
 * Helper to get the root key for all solver service queries.
 * Useful for bulk invalidation of the entire solver cache.
 *
 * @returns The root query key `["sudojo", "solver"]`
 *
 * @example
 * ```ts
 * queryClient.invalidateQueries({ queryKey: getSolverServiceKeys() });
 * ```
 */
export const getSolverServiceKeys = (): readonly ["sudojo", "solver"] => {
  return solverQueryKeys.all();
};
