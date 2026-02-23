/**
 * Sudojo Solver TanStack Query Configuration
 *
 * Provides stale time constants for Solver queries. The solver is a
 * computationally intensive service, so stale times balance freshness
 * with avoiding redundant requests.
 *
 * ## Solver Latency Notes
 *
 * - **Solve**: Can take up to 120 seconds for advanced techniques.
 *   The underlying request uses a 120s timeout.
 * - **Validate**: Also uses a 120s timeout due to iterative solving.
 * - **Generate**: Typically faster but still involves puzzle generation.
 *
 * ## Error Handling
 *
 * The solve endpoint may throw {@link HintAccessDeniedError} (HTTP 402)
 * when the requested hint level exceeds the user's subscription tier.
 * Other endpoints throw generic errors on failure.
 */

/**
 * Default stale times (in milliseconds) for Solver queries.
 */
export const SOLVER_STALE_TIMES = {
  /**
   * Solve hints - short cache (1 min) since the user's puzzle state changes
   * frequently as they make moves. The same puzzle+state combination is
   * deterministic, so a brief cache avoids redundant requests during rapid interactions.
   */
  SOLVE: 1 * 60 * 1000, // 1 minute

  /**
   * Validate - puzzle validation is deterministic for a given original puzzle
   * string, so results can be cached longer (10 min). A given puzzle string
   * will always produce the same validation result.
   */
  VALIDATE: 10 * 60 * 1000, // 10 minutes

  /**
   * Generate - always fetch fresh (0ms stale time) since the purpose is to
   * create a new random puzzle each time. Caching would defeat the purpose.
   */
  GENERATE: 0, // Always fresh
} as const;
