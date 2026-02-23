/**
 * Query Key Factory for Sudojo TanStack Query
 *
 * Provides type-safe, consistent query keys for all Sudojo API endpoints.
 * Follows TanStack Query best practices for hierarchical key structure.
 *
 * ## Key Hierarchy
 *
 * All keys start with `["sudojo"]` as the root, then branch by resource:
 * - `["sudojo", "levels"]` - all levels
 * - `["sudojo", "levels", 1]` - specific level
 * - `["sudojo", "boards", { level: 3 }]` - boards filtered by level
 *
 * ## Invalidation Patterns
 *
 * Use the hierarchical structure for targeted invalidation:
 * - `queryKeys.sudojo.all()` invalidates ALL sudojo queries
 * - `queryKeys.sudojo.levels()` invalidates the levels list
 * - `queryKeys.sudojo.level(1)` invalidates only level 1
 *
 * For broader invalidation (e.g., all board queries including random):
 * ```ts
 * queryClient.invalidateQueries({ queryKey: [...queryKeys.sudojo.all(), "boards"] })
 * ```
 *
 * ## Filter Parameters
 *
 * Keys that accept filter objects (e.g., `boards`, `techniques`, `challenges`)
 * include the filter in the key so that different filter combinations produce
 * distinct cache entries.
 */

const sudojoBase = () => ["sudojo"] as const;

export const queryKeys = {
  sudojo: {
    /** Root key for all sudojo queries. Use for bulk invalidation. */
    all: sudojoBase,

    // Health
    /** Key for the server health check endpoint. */
    health: () => [...sudojoBase(), "health"] as const,

    // Levels
    /** Key for the levels list query. */
    levels: () => [...sudojoBase(), "levels"] as const,
    /** Key for a specific level query. @param level - Level number (1-12) */
    level: (level: number) => [...sudojoBase(), "levels", level] as const,

    // Techniques
    /** Key for the techniques list query, optionally filtered by level. */
    techniques: (filters?: { level?: number | undefined }) =>
      [...sudojoBase(), "techniques", filters] as const,
    /** Key for a specific technique query. @param technique - Technique number (>= 1) */
    technique: (technique: number) =>
      [...sudojoBase(), "techniques", technique] as const,

    // Learning
    /** Key for the learning entries list, optionally filtered by technique and/or language. */
    learning: (filters?: {
      technique?: number | undefined;
      language_code?: string | undefined;
    }) => [...sudojoBase(), "learning", filters] as const,
    /** Key for a specific learning item by UUID. */
    learningItem: (uuid: string) =>
      [...sudojoBase(), "learning", uuid] as const,

    // Boards
    /** Key for the boards list query, optionally filtered by level. */
    boards: (filters?: { level?: number | undefined }) =>
      [...sudojoBase(), "boards", filters] as const,
    /** Key for the random board query, optionally filtered by level. */
    boardRandom: (filters?: { level?: number | undefined }) =>
      [...sudojoBase(), "boards", "random", filters] as const,
    /** Key for a specific board by UUID. */
    board: (uuid: string) => [...sudojoBase(), "boards", uuid] as const,

    // Dailies
    /** Key for the dailies list query. */
    dailies: () => [...sudojoBase(), "dailies"] as const,
    /** Key for the random daily query. */
    dailyRandom: () => [...sudojoBase(), "dailies", "random"] as const,
    /** Key for today's daily puzzle query. */
    dailyToday: () => [...sudojoBase(), "dailies", "today"] as const,
    /** Key for a daily puzzle by date. @param date - Date string in YYYY-MM-DD format */
    dailyByDate: (date: string) =>
      [...sudojoBase(), "dailies", "date", date] as const,
    /** Key for a specific daily by UUID. */
    daily: (uuid: string) => [...sudojoBase(), "dailies", uuid] as const,

    // Challenges
    /** Key for the challenges list, optionally filtered by level and/or difficulty. */
    challenges: (filters?: {
      level?: number | undefined;
      difficulty?: string | undefined;
    }) => [...sudojoBase(), "challenges", filters] as const,
    /** Key for the random challenge query, optionally filtered. */
    challengeRandom: (filters?: {
      level?: number | undefined;
      difficulty?: string | undefined;
    }) => [...sudojoBase(), "challenges", "random", filters] as const,
    /** Key for a specific challenge by UUID. */
    challenge: (uuid: string) => [...sudojoBase(), "challenges", uuid] as const,

    // Users
    /** Key for a user info query. @param userId - Firebase UID */
    user: (userId: string) => [...sudojoBase(), "users", userId] as const,
    /** Key for a user's subscription status query. @param userId - Firebase UID */
    userSubscription: (userId: string) =>
      [...sudojoBase(), "users", userId, "subscription"] as const,

    // Practices
    /** Key for practice counts across all techniques. */
    practiceCounts: () => [...sudojoBase(), "practices", "counts"] as const,
    /** Key for a random practice for a specific technique. */
    practiceRandom: (technique: number) =>
      [...sudojoBase(), "practices", "random", technique] as const,

    // Gamification
    /** Key for the user's gamification stats (points, level, badges). */
    gamificationStats: () =>
      [...sudojoBase(), "gamification", "stats"] as const,
    /** Key for badge definitions (public, no auth required). */
    gamificationBadges: () =>
      [...sudojoBase(), "gamification", "badges"] as const,
    /** Key for point transaction history with optional pagination. */
    gamificationHistory: (options?: { limit?: number; offset?: number }) =>
      [...sudojoBase(), "gamification", "history", options] as const,
  },
} as const;

/**
 * Utility type to extract query key from the factory.
 * All query keys are readonly arrays of unknown values.
 */
export type QueryKey = readonly unknown[];

/**
 * Helper function to create a query key for custom or ad-hoc endpoints
 * that are not covered by the standard `queryKeys` factory.
 *
 * @param service - The service name (e.g., "sudojo", "solver")
 * @param parts - Additional key segments (strings, numbers, or filter objects)
 * @returns A readonly query key tuple
 *
 * @example
 * ```ts
 * const key = createQueryKey("sudojo", "custom-endpoint", { filter: "value" });
 * // => ["sudojo", "custom-endpoint", { filter: "value" }]
 * ```
 */
export const createQueryKey = (
  service: string,
  ...parts: (string | number | object)[]
): readonly unknown[] => {
  return [service, ...parts] as const;
};

/**
 * Helper to get the root key for all sudojo service queries.
 * Useful for bulk invalidation of the entire sudojo cache.
 *
 * @returns The root query key `["sudojo"]`
 *
 * @example
 * ```ts
 * // Invalidate all sudojo queries at once
 * queryClient.invalidateQueries({ queryKey: getServiceKeys() });
 * ```
 */
export const getServiceKeys = () => {
  return queryKeys.sudojo.all();
};
