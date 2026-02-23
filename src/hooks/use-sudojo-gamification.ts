/**
 * Hooks for Sudojo gamification endpoints
 * Points, badges, levels, and game sessions
 */

import { useCallback, useMemo } from "react";
import {
  useMutation,
  UseMutationResult,
  useQuery,
  useQueryClient,
  UseQueryOptions,
  UseQueryResult,
} from "@tanstack/react-query";
import type { NetworkClient } from "@sudobility/types";
import type {
  BadgeDefinition,
  BaseResponse,
  GameFinishRequest,
  GameFinishResponse,
  GameStartRequest,
  GameStartResponse,
  GamificationStats,
  PointTransaction,
} from "@sudobility/sudojo_types";
import { queryKeys } from "./query-keys";
import { STALE_TIMES } from "./query-config";
import { SudojoClient } from "../network/sudojo-client";

// =============================================================================
// Game Session Hooks
// =============================================================================

/**
 * Hook to start a new game session. Requires authentication.
 *
 * Call this when a user begins playing a puzzle. Returns a session ID
 * that must be passed to `useSudojoPlayFinish` when the game ends.
 *
 * @param networkClient - Network client for making HTTP requests
 * @param baseUrl - Base URL of the Sudojo API
 * @returns A UseMutationResult. Call `mutate({ token, data })` to execute.
 *
 * @example
 * ```tsx
 * const playStart = useSudojoPlayStart(networkClient, baseUrl);
 * playStart.mutate({ token, data: { board_uuid: "...", mode: "play" } });
 * ```
 */
export const useSudojoPlayStart = (
  networkClient: NetworkClient,
  baseUrl: string,
): UseMutationResult<
  BaseResponse<GameStartResponse>,
  Error,
  { token: string; data: GameStartRequest }
> => {
  const client = useMemo(
    () => new SudojoClient(networkClient, baseUrl),
    [networkClient, baseUrl],
  );

  return useMutation({
    mutationFn: async ({
      token,
      data,
    }: {
      token: string;
      data: GameStartRequest;
    }) => {
      return client.playStart(token, data);
    },
  });
};

/**
 * Hook to finish a game session and receive rewards. Requires authentication.
 *
 * Call this when a user completes or abandons a puzzle. Returns earned points,
 * new badges, and updated gamification stats. On success, automatically
 * invalidates gamification stats and point history queries.
 *
 * @param networkClient - Network client for making HTTP requests
 * @param baseUrl - Base URL of the Sudojo API
 * @returns A UseMutationResult. Call `mutate({ token, data })` to execute.
 */
export const useSudojoPlayFinish = (
  networkClient: NetworkClient,
  baseUrl: string,
): UseMutationResult<
  BaseResponse<GameFinishResponse>,
  Error,
  { token: string; data: GameFinishRequest }
> => {
  const client = useMemo(
    () => new SudojoClient(networkClient, baseUrl),
    [networkClient, baseUrl],
  );
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      token,
      data,
    }: {
      token: string;
      data: GameFinishRequest;
    }) => {
      return client.playFinish(token, data);
    },
    onSuccess: () => {
      // Invalidate gamification stats and history
      queryClient.invalidateQueries({
        queryKey: queryKeys.sudojo.gamificationStats(),
      });
      queryClient.invalidateQueries({
        queryKey: [...queryKeys.sudojo.all(), "gamification", "history"],
      });
    },
  });
};

// =============================================================================
// Gamification Stats Hooks
// =============================================================================

/**
 * Hook to fetch the user's gamification stats (total points, level, earned badges).
 *
 * Requires authentication. The query is automatically disabled when no token
 * is provided. Uses the subscription stale time (2 min) since stats change
 * after game sessions.
 *
 * Stale time: {@link STALE_TIMES.USER_SUBSCRIPTION} (2 minutes).
 *
 * @param networkClient - Network client for making HTTP requests
 * @param baseUrl - Base URL of the Sudojo API
 * @param token - Firebase access token (required). Query is disabled if empty.
 * @param options - Additional TanStack Query options
 * @returns A UseQueryResult containing the GamificationStats
 */
export const useSudojoGamificationStats = (
  networkClient: NetworkClient,
  baseUrl: string,
  token: string,
  options?: Omit<
    UseQueryOptions<BaseResponse<GamificationStats>>,
    "queryKey" | "queryFn"
  >,
): UseQueryResult<BaseResponse<GamificationStats>> => {
  const client = useMemo(
    () => new SudojoClient(networkClient, baseUrl),
    [networkClient, baseUrl],
  );

  const queryFn = useCallback(async (): Promise<
    BaseResponse<GamificationStats>
  > => {
    return client.getGamificationStats(token);
  }, [client, token]);

  const isEnabled =
    !!token && (options?.enabled !== undefined ? options.enabled : true);

  return useQuery({
    queryKey: queryKeys.sudojo.gamificationStats(),
    queryFn,
    staleTime: STALE_TIMES.USER_SUBSCRIPTION, // 2 minutes
    ...options,
    enabled: isEnabled,
  });
};

/**
 * Hook to fetch all badge definitions. **Public endpoint** - no auth required.
 *
 * Badge definitions describe the available badges, their icons, descriptions,
 * and unlock criteria. Does not require a token parameter at all.
 *
 * Stale time: {@link STALE_TIMES.LEVELS} (10 minutes) since badge definitions rarely change.
 *
 * @param networkClient - Network client for making HTTP requests
 * @param baseUrl - Base URL of the Sudojo API
 * @param options - Additional TanStack Query options
 * @returns A UseQueryResult containing an array of BadgeDefinition objects
 */
export const useSudojoBadgeDefinitions = (
  networkClient: NetworkClient,
  baseUrl: string,
  options?: Omit<
    UseQueryOptions<BaseResponse<BadgeDefinition[]>>,
    "queryKey" | "queryFn"
  >,
): UseQueryResult<BaseResponse<BadgeDefinition[]>> => {
  const client = useMemo(
    () => new SudojoClient(networkClient, baseUrl),
    [networkClient, baseUrl],
  );

  const queryFn = useCallback(async (): Promise<
    BaseResponse<BadgeDefinition[]>
  > => {
    return client.getBadgeDefinitions();
  }, [client]);

  const isEnabled = options?.enabled !== undefined ? options.enabled : true;

  return useQuery({
    queryKey: queryKeys.sudojo.gamificationBadges(),
    queryFn,
    staleTime: STALE_TIMES.LEVELS, // 10 minutes - badges rarely change
    ...options,
    enabled: isEnabled,
  });
};

/**
 * Hook to fetch the user's point transaction history with optional pagination.
 *
 * Requires authentication. Uses `staleTime: 0` to always fetch fresh history
 * since it changes after every game session.
 *
 * @param networkClient - Network client for making HTTP requests
 * @param baseUrl - Base URL of the Sudojo API
 * @param token - Firebase access token (required). Query is disabled if empty.
 * @param historyOptions - Pagination options (`{ limit?: number; offset?: number }`)
 * @param options - Additional TanStack Query options
 * @returns A UseQueryResult containing an array of PointTransaction objects
 */
export const useSudojoPointHistory = (
  networkClient: NetworkClient,
  baseUrl: string,
  token: string,
  historyOptions?: { limit?: number; offset?: number },
  options?: Omit<
    UseQueryOptions<BaseResponse<PointTransaction[]>>,
    "queryKey" | "queryFn"
  >,
): UseQueryResult<BaseResponse<PointTransaction[]>> => {
  const client = useMemo(
    () => new SudojoClient(networkClient, baseUrl),
    [networkClient, baseUrl],
  );

  const limit = historyOptions?.limit;
  const offset = historyOptions?.offset;

  const queryFn = useCallback(async (): Promise<
    BaseResponse<PointTransaction[]>
  > => {
    const opts: { limit?: number; offset?: number } = {};
    if (limit !== undefined) opts.limit = limit;
    if (offset !== undefined) opts.offset = offset;
    return client.getPointHistory(token, opts);
  }, [client, token, limit, offset]);

  const isEnabled =
    !!token && (options?.enabled !== undefined ? options.enabled : true);

  const historyKeyOpts: { limit?: number; offset?: number } = {};
  if (limit !== undefined) historyKeyOpts.limit = limit;
  if (offset !== undefined) historyKeyOpts.offset = offset;

  return useQuery({
    queryKey: queryKeys.sudojo.gamificationHistory(historyKeyOpts),
    queryFn,
    staleTime: 0, // Always fresh
    ...options,
    enabled: isEnabled,
  });
};
