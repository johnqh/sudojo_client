/**
 * Hook for Sudojo levels endpoints
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
  BaseResponse,
  Level,
  LevelCreateRequest,
  LevelUpdateRequest,
} from "@sudobility/sudojo_types";
import { queryKeys } from "./query-keys";
import { STALE_TIMES } from "./query-config";
import { SudojoClient } from "../network/sudojo-client";

/**
 * Hook to fetch all Sudoku difficulty levels.
 *
 * Levels are admin-managed reference data (1-12) that define puzzle difficulty
 * tiers. This is a public endpoint that does not require authentication, though
 * a token is accepted for consistency.
 *
 * Stale time: {@link STALE_TIMES.LEVELS} (10 minutes) since levels rarely change.
 *
 * @param networkClient - Network client for making HTTP requests
 * @param baseUrl - Base URL of the Sudojo API
 * @param token - Firebase access token (optional for this public endpoint)
 * @param options - Additional TanStack Query options (excluding queryKey and queryFn)
 * @returns A UseQueryResult containing an array of Level objects
 *
 * @example
 * ```tsx
 * const { data: levels, isLoading } = useSudojoLevels(networkClient, baseUrl, token);
 * ```
 */
export const useSudojoLevels = (
  networkClient: NetworkClient,
  baseUrl: string,
  token: string,
  options?: Omit<
    UseQueryOptions<BaseResponse<Level[]>>,
    "queryKey" | "queryFn"
  >,
): UseQueryResult<BaseResponse<Level[]>> => {
  const client = useMemo(
    () => new SudojoClient(networkClient, baseUrl),
    [networkClient, baseUrl],
  );

  const queryFn = useCallback(async (): Promise<BaseResponse<Level[]>> => {
    return client.getLevels(token);
  }, [client, token]);

  // Public endpoint - no token required
  const isEnabled = options?.enabled !== undefined ? options.enabled : true;

  return useQuery({
    queryKey: queryKeys.sudojo.levels(),
    queryFn,
    staleTime: STALE_TIMES.LEVELS,
    ...options,
    enabled: isEnabled,
  });
};

/**
 * Hook to fetch a specific level by its number (1-12).
 *
 * The query is automatically disabled if the level number is outside
 * the valid range of 1-12. This is a public endpoint.
 *
 * Stale time: {@link STALE_TIMES.LEVELS} (10 minutes).
 *
 * @param networkClient - Network client for making HTTP requests
 * @param baseUrl - Base URL of the Sudojo API
 * @param token - Firebase access token
 * @param level - Level number (1-12). Query is disabled if out of range.
 * @param options - Additional TanStack Query options
 * @returns A UseQueryResult containing a single Level object
 */
export const useSudojoLevel = (
  networkClient: NetworkClient,
  baseUrl: string,
  token: string,
  level: number,
  options?: Omit<UseQueryOptions<BaseResponse<Level>>, "queryKey" | "queryFn">,
): UseQueryResult<BaseResponse<Level>> => {
  const client = useMemo(
    () => new SudojoClient(networkClient, baseUrl),
    [networkClient, baseUrl],
  );

  const queryFn = useCallback(async (): Promise<BaseResponse<Level>> => {
    return client.getLevel(token, level);
  }, [client, token, level]);

  // Public endpoint - no token required, but level is required
  const isEnabled =
    level >= 1 &&
    level <= 12 &&
    (options?.enabled !== undefined ? options.enabled : true);

  return useQuery({
    queryKey: queryKeys.sudojo.level(level),
    queryFn,
    staleTime: STALE_TIMES.LEVELS,
    ...options,
    enabled: isEnabled,
  });
};

/**
 * Hook to create a new level. Requires admin authentication.
 *
 * On success, automatically invalidates the levels list query so the UI
 * reflects the new level.
 *
 * @param networkClient - Network client for making HTTP requests
 * @param baseUrl - Base URL of the Sudojo API
 * @returns A UseMutationResult. Call `mutate({ token, data })` to execute.
 *
 * @example
 * ```tsx
 * const createLevel = useSudojoCreateLevel(networkClient, baseUrl);
 * createLevel.mutate({ token, data: { level: 5, title: "Advanced", text: null, requires_subscription: true } });
 * ```
 */
export const useSudojoCreateLevel = (
  networkClient: NetworkClient,
  baseUrl: string,
): UseMutationResult<
  BaseResponse<Level>,
  Error,
  { token: string; data: LevelCreateRequest }
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
      data: LevelCreateRequest;
    }) => {
      return client.createLevel(token, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.sudojo.levels() });
    },
  });
};

/**
 * Hook to update an existing level. Requires admin authentication.
 *
 * On success, automatically invalidates both the levels list and the
 * specific level query for the updated level number.
 *
 * @param networkClient - Network client for making HTTP requests
 * @param baseUrl - Base URL of the Sudojo API
 * @returns A UseMutationResult. Call `mutate({ token, level, data })` to execute.
 */
export const useSudojoUpdateLevel = (
  networkClient: NetworkClient,
  baseUrl: string,
): UseMutationResult<
  BaseResponse<Level>,
  Error,
  { token: string; level: number; data: LevelUpdateRequest }
> => {
  const client = useMemo(
    () => new SudojoClient(networkClient, baseUrl),
    [networkClient, baseUrl],
  );
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      token,
      level,
      data,
    }: {
      token: string;
      level: number;
      data: LevelUpdateRequest;
    }) => {
      return client.updateLevel(token, level, data);
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.sudojo.levels() });
      queryClient.invalidateQueries({
        queryKey: queryKeys.sudojo.level(variables.level),
      });
    },
  });
};

/**
 * Hook to delete a level. Requires admin authentication.
 *
 * On success, invalidates the levels list and removes the specific level
 * from the query cache entirely.
 *
 * @param networkClient - Network client for making HTTP requests
 * @param baseUrl - Base URL of the Sudojo API
 * @returns A UseMutationResult. Call `mutate({ token, level })` to execute.
 */
export const useSudojoDeleteLevel = (
  networkClient: NetworkClient,
  baseUrl: string,
): UseMutationResult<
  BaseResponse<Level>,
  Error,
  { token: string; level: number }
> => {
  const client = useMemo(
    () => new SudojoClient(networkClient, baseUrl),
    [networkClient, baseUrl],
  );
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ token, level }: { token: string; level: number }) => {
      return client.deleteLevel(token, level);
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.sudojo.levels() });
      queryClient.removeQueries({
        queryKey: queryKeys.sudojo.level(variables.level),
      });
    },
  });
};
