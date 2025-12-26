/**
 * Sudojo Solver TanStack Query Configuration
 *
 * Provides stale time constants for Solver queries.
 */

/**
 * Default stale times for different types of Solver queries
 */
export const SOLVER_STALE_TIMES = {
  // Solve hints - might want fresh data each time
  SOLVE: 1 * 60 * 1000, // 1 minute

  // Validate - puzzle validation is deterministic, can cache longer
  VALIDATE: 10 * 60 * 1000, // 10 minutes

  // Generate - each call generates a new puzzle, don't cache long
  GENERATE: 0, // Always fresh
} as const;
