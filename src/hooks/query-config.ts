/**
 * Sudojo TanStack Query Configuration
 *
 * Provides stale time constants for Sudojo queries.
 */

/**
 * Default stale times for different types of Sudojo queries
 */
export const STALE_TIMES = {
  // Health status - check frequently
  HEALTH_STATUS: 1 * 60 * 1000, // 1 minute

  // Levels - rarely change
  LEVELS: 10 * 60 * 1000, // 10 minutes

  // Techniques - rarely change
  TECHNIQUES: 10 * 60 * 1000, // 10 minutes

  // Learning content - rarely change
  LEARNING: 10 * 60 * 1000, // 10 minutes

  // Boards - stable once created
  BOARDS: 5 * 60 * 1000, // 5 minutes

  // Daily puzzles - changes once per day
  DAILIES: 5 * 60 * 1000, // 5 minutes

  // Challenges - stable once created
  CHALLENGES: 5 * 60 * 1000, // 5 minutes

  // User subscription - cache for a short time
  USER_SUBSCRIPTION: 2 * 60 * 1000, // 2 minutes
} as const;
