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
 * Hook to get a specific level by UUID
 */
export const useSudojoLevel = (
  networkClient: NetworkClient,
  baseUrl: string,
  token: string,
  uuid: string,
  options?: Omit<UseQueryOptions<BaseResponse<Level>>, "queryKey" | "queryFn">,
): UseQueryResult<BaseResponse<Level>> => {
  const client = useMemo(
    () => new SudojoClient(networkClient, baseUrl),
    [networkClient, baseUrl],
  );

  const queryFn = useCallback(async (): Promise<BaseResponse<Level>> => {
    return client.getLevel(token, uuid);
  }, [client, token, uuid]);

  // Public endpoint - no token required, but uuid is required
  const isEnabled =
    !!uuid && (options?.enabled !== undefined ? options.enabled : true);

  return useQuery({
    queryKey: queryKeys.sudojo.level(uuid),
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
  { token: string; uuid: string; data: LevelUpdateRequest }
> => {
  const client = useMemo(
    () => new SudojoClient(networkClient, baseUrl),
    [networkClient, baseUrl],
  );
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      token,
      uuid,
      data,
    }: {
      token: string;
      uuid: string;
      data: LevelUpdateRequest;
    }) => {
      return client.updateLevel(token, uuid, data);
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.sudojo.levels() });
      queryClient.invalidateQueries({
        queryKey: queryKeys.sudojo.level(variables.uuid),
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
  { token: string; uuid: string }
> => {
  const client = useMemo(
    () => new SudojoClient(networkClient, baseUrl),
    [networkClient, baseUrl],
  );
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ token, uuid }: { token: string; uuid: string }) => {
      return client.deleteLevel(token, uuid);
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.sudojo.levels() });
      queryClient.removeQueries({
        queryKey: queryKeys.sudojo.level(variables.uuid),
      });
    },
  });
};
