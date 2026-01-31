/**
 * Hooks for Sudojo gamification endpoints
 * Points, badges, levels, and game sessions
 */

import { useCallback, useMemo } from "react";
import {
  useMutation,
  useQuery,
  useQueryClient,
  UseMutationResult,
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
 * Hook to start a new game session
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
 * Hook to finish a game session and get rewards
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
 * Hook to get user's gamification stats (points, level, badges)
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
 * Hook to get all badge definitions (public endpoint)
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
 * Hook to get user's point transaction history
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
