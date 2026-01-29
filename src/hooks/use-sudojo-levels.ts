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
 * Hook to get all levels
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
 * Hook to get a specific level by level number (1-12)
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
 * Hook to create a level
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
 * Hook to update a level
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
 * Hook to delete a level
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
