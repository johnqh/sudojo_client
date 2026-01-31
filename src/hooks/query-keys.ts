/**
 * Query Key Factory for Sudojo TanStack Query
 *
 * Provides type-safe, consistent query keys for Sudojo API endpoints.
 * Following TanStack Query best practices for key structure.
 */

const sudojoBase = () => ["sudojo"] as const;

export const queryKeys = {
  sudojo: {
    all: sudojoBase,

    // Health
    health: () => [...sudojoBase(), "health"] as const,

    // Levels
    levels: () => [...sudojoBase(), "levels"] as const,
    level: (level: number) => [...sudojoBase(), "levels", level] as const,

    // Techniques
    techniques: (filters?: { level?: number | undefined }) =>
      [...sudojoBase(), "techniques", filters] as const,
    technique: (technique: number) =>
      [...sudojoBase(), "techniques", technique] as const,

    // Learning
    learning: (filters?: {
      technique?: number | undefined;
      language_code?: string | undefined;
    }) => [...sudojoBase(), "learning", filters] as const,
    learningItem: (uuid: string) =>
      [...sudojoBase(), "learning", uuid] as const,

    // Boards
    boards: (filters?: { level?: number | undefined }) =>
      [...sudojoBase(), "boards", filters] as const,
    boardRandom: (filters?: { level?: number | undefined }) =>
      [...sudojoBase(), "boards", "random", filters] as const,
    board: (uuid: string) => [...sudojoBase(), "boards", uuid] as const,

    // Dailies
    dailies: () => [...sudojoBase(), "dailies"] as const,
    dailyRandom: () => [...sudojoBase(), "dailies", "random"] as const,
    dailyToday: () => [...sudojoBase(), "dailies", "today"] as const,
    dailyByDate: (date: string) =>
      [...sudojoBase(), "dailies", "date", date] as const,
    daily: (uuid: string) => [...sudojoBase(), "dailies", uuid] as const,

    // Challenges
    challenges: (filters?: {
      level?: number | undefined;
      difficulty?: string | undefined;
    }) => [...sudojoBase(), "challenges", filters] as const,
    challengeRandom: (filters?: {
      level?: number | undefined;
      difficulty?: string | undefined;
    }) => [...sudojoBase(), "challenges", "random", filters] as const,
    challenge: (uuid: string) => [...sudojoBase(), "challenges", uuid] as const,

    // Users
    userSubscription: (userId: string) =>
      [...sudojoBase(), "users", userId, "subscription"] as const,

    // Practices
    practiceCounts: () => [...sudojoBase(), "practices", "counts"] as const,
    practiceRandom: (technique: number) =>
      [...sudojoBase(), "practices", "random", technique] as const,

    // Gamification
    gamificationStats: () =>
      [...sudojoBase(), "gamification", "stats"] as const,
    gamificationBadges: () =>
      [...sudojoBase(), "gamification", "badges"] as const,
    gamificationHistory: (options?: { limit?: number; offset?: number }) =>
      [...sudojoBase(), "gamification", "history", options] as const,
  },
} as const;

/**
 * Utility type to extract query key from the factory
 */
export type QueryKey = readonly unknown[];

/**
 * Helper function to create a query key for custom endpoints
 */
export const createQueryKey = (
  service: string,
  ...parts: (string | number | object)[]
): readonly unknown[] => {
  return [service, ...parts] as const;
};

/**
 * Helper to get all keys for sudojo service (useful for invalidation)
 */
export const getServiceKeys = () => {
  return queryKeys.sudojo.all();
};
