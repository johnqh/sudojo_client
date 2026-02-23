/**
 * Sudojo TanStack Query Configuration
 *
 * Provides stale time constants for Sudojo queries. Stale time determines how
 * long cached data is considered fresh before TanStack Query will refetch it
 * in the background on the next access.
 *
 * ## Design Rationale
 *
 * Stale times are chosen based on how frequently each resource type changes:
 * - **Static reference data** (levels, techniques, learning): 10 minutes.
 *   These are admin-managed and rarely change during a user session.
 * - **Content data** (boards, dailies, challenges): 5 minutes.
 *   Stable once created but new content may be added by admins.
 * - **User-specific data** (user info, subscriptions): 2-5 minutes.
 *   Subscription status may change via in-app purchase flows.
 * - **Volatile data** (health): 1 minute. Used for connectivity checks.
 *
 * Some hooks override these defaults (e.g., random endpoints use `staleTime: 0`
 * to always fetch fresh data, and `useSudojoRandomBoard` uses `Infinity` to
 * only refetch on explicit user action).
 */

/**
 * Default stale times (in milliseconds) for different types of Sudojo queries.
 * These values are used as the `staleTime` option in TanStack Query hooks.
 */
export const STALE_TIMES = {
  /** Health check - short cache since it monitors server availability (1 min). */
  HEALTH_STATUS: 1 * 60 * 1000, // 1 minute

  /** Levels list - admin-managed reference data that rarely changes (10 min). */
  LEVELS: 10 * 60 * 1000, // 10 minutes

  /** Techniques list - admin-managed reference data that rarely changes (10 min). */
  TECHNIQUES: 10 * 60 * 1000, // 10 minutes

  /** Learning content - admin-managed educational content that rarely changes (10 min). */
  LEARNING: 10 * 60 * 1000, // 10 minutes

  /** Boards - stable once created; new boards may be added by admins (5 min). */
  BOARDS: 5 * 60 * 1000, // 5 minutes

  /** Daily puzzles - one new puzzle per day; moderate cache (5 min). */
  DAILIES: 5 * 60 * 1000, // 5 minutes

  /** Challenges - stable once created; new challenges may be added (5 min). */
  CHALLENGES: 5 * 60 * 1000, // 5 minutes

  /** User info - admin status rarely changes during a session (5 min). */
  USER: 5 * 60 * 1000, // 5 minutes

  /** User subscription - may change via in-app purchase; shorter cache (2 min). */
  USER_SUBSCRIPTION: 2 * 60 * 1000, // 2 minutes
} as const;
