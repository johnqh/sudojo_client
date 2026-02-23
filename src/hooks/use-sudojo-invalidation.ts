/**
 * Query invalidation utility hook for Sudojo API queries.
 *
 * Provides helper functions for common cache invalidation patterns.
 * Use this when you need to programmatically invalidate queries outside
 * of the built-in mutation `onSuccess` callbacks.
 *
 * ## When to Use
 *
 * - After a custom operation that affects cached data
 * - When you need to force-refresh specific resource types
 * - For bulk invalidation across resource categories
 *
 * ## Built-in Invalidation
 *
 * All mutation hooks (create/update/delete) already handle invalidation
 * automatically in their `onSuccess` callbacks. You only need this hook
 * for cases not covered by the built-in behavior.
 *
 * @example
 * ```tsx
 * function AdminPanel() {
 *   const { invalidateAll, invalidateBoards, invalidateDailies } = useSudojoInvalidation();
 *
 *   const handleBulkImport = async () => {
 *     await performBulkImport();
 *     // Invalidate all board and daily queries after import
 *     invalidateBoards();
 *     invalidateDailies();
 *   };
 * }
 * ```
 */

import { useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "./query-keys";

/**
 * Hook that provides helper functions for common Sudojo query invalidation patterns.
 *
 * Each function invalidates all queries that start with the corresponding resource
 * key prefix, covering list queries, detail queries, random queries, and filtered
 * variants.
 *
 * @returns An object with invalidation functions for each resource type
 */
export const useSudojoInvalidation = () => {
  const queryClient = useQueryClient();

  /** Invalidate ALL Sudojo queries (nuclear option). */
  const invalidateAll = useCallback(() => {
    return queryClient.invalidateQueries({
      queryKey: queryKeys.sudojo.all(),
    });
  }, [queryClient]);

  /** Invalidate all level queries (list + individual levels). */
  const invalidateLevels = useCallback(() => {
    return queryClient.invalidateQueries({
      queryKey: [...queryKeys.sudojo.all(), "levels"],
    });
  }, [queryClient]);

  /** Invalidate all technique queries (list + individual + filtered). */
  const invalidateTechniques = useCallback(() => {
    return queryClient.invalidateQueries({
      queryKey: [...queryKeys.sudojo.all(), "techniques"],
    });
  }, [queryClient]);

  /** Invalidate all learning queries (list + individual + filtered). */
  const invalidateLearning = useCallback(() => {
    return queryClient.invalidateQueries({
      queryKey: [...queryKeys.sudojo.all(), "learning"],
    });
  }, [queryClient]);

  /** Invalidate all board queries (list + random + individual + filtered). */
  const invalidateBoards = useCallback(() => {
    return queryClient.invalidateQueries({
      queryKey: [...queryKeys.sudojo.all(), "boards"],
    });
  }, [queryClient]);

  /** Invalidate all daily queries (list + random + today + by-date + individual). */
  const invalidateDailies = useCallback(() => {
    return queryClient.invalidateQueries({
      queryKey: [...queryKeys.sudojo.all(), "dailies"],
    });
  }, [queryClient]);

  /** Invalidate all challenge queries (list + random + individual + filtered). */
  const invalidateChallenges = useCallback(() => {
    return queryClient.invalidateQueries({
      queryKey: [...queryKeys.sudojo.all(), "challenges"],
    });
  }, [queryClient]);

  /** Invalidate all user queries (info + subscription) for all users. */
  const invalidateUsers = useCallback(() => {
    return queryClient.invalidateQueries({
      queryKey: [...queryKeys.sudojo.all(), "users"],
    });
  }, [queryClient]);

  /** Invalidate all practice queries (counts + random). */
  const invalidatePractices = useCallback(() => {
    return queryClient.invalidateQueries({
      queryKey: [...queryKeys.sudojo.all(), "practices"],
    });
  }, [queryClient]);

  /** Invalidate all gamification queries (stats + badges + history). */
  const invalidateGamification = useCallback(() => {
    return queryClient.invalidateQueries({
      queryKey: [...queryKeys.sudojo.all(), "gamification"],
    });
  }, [queryClient]);

  return {
    invalidateAll,
    invalidateLevels,
    invalidateTechniques,
    invalidateLearning,
    invalidateBoards,
    invalidateDailies,
    invalidateChallenges,
    invalidateUsers,
    invalidatePractices,
    invalidateGamification,
  };
};
