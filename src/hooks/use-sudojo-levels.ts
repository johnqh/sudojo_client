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
import type { SudojoAuth, SudojoConfig } from "../network/sudojo-client";

/**
 * Hook to get all levels
 */
export const useSudojoLevels = (
  networkClient: NetworkClient,
  config: SudojoConfig,
  auth: SudojoAuth,
  options?: Omit<
    UseQueryOptions<BaseResponse<Level[]>>,
    "queryKey" | "queryFn"
  >,
): UseQueryResult<BaseResponse<Level[]>> => {
  const client = useMemo(
    () => new SudojoClient(networkClient, config),
    [networkClient, config],
  );

  const queryFn = useCallback(async (): Promise<BaseResponse<Level[]>> => {
    return client.getLevels(auth);
  }, [client, auth]);

  return useQuery({
    queryKey: queryKeys.sudojo.levels(),
    queryFn,
    staleTime: STALE_TIMES.LEVELS,
    enabled: !!auth?.accessToken,
    ...options,
  });
};

/**
 * Hook to get a specific level by UUID
 */
export const useSudojoLevel = (
  networkClient: NetworkClient,
  config: SudojoConfig,
  auth: SudojoAuth,
  uuid: string,
  options?: Omit<UseQueryOptions<BaseResponse<Level>>, "queryKey" | "queryFn">,
): UseQueryResult<BaseResponse<Level>> => {
  const client = useMemo(
    () => new SudojoClient(networkClient, config),
    [networkClient, config],
  );

  const queryFn = useCallback(async (): Promise<BaseResponse<Level>> => {
    return client.getLevel(auth, uuid);
  }, [client, auth, uuid]);

  return useQuery({
    queryKey: queryKeys.sudojo.level(uuid),
    queryFn,
    staleTime: STALE_TIMES.LEVELS,
    enabled: !!uuid && !!auth?.accessToken,
    ...options,
  });
};

/**
 * Hook to create a level
 */
export const useSudojoCreateLevel = (
  networkClient: NetworkClient,
  config: SudojoConfig,
): UseMutationResult<
  BaseResponse<Level>,
  Error,
  { auth: SudojoAuth; data: LevelCreateRequest }
> => {
  const client = useMemo(
    () => new SudojoClient(networkClient, config),
    [networkClient, config],
  );
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      auth,
      data,
    }: {
      auth: SudojoAuth;
      data: LevelCreateRequest;
    }) => {
      return client.createLevel(auth, data);
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
  config: SudojoConfig,
): UseMutationResult<
  BaseResponse<Level>,
  Error,
  { auth: SudojoAuth; uuid: string; data: LevelUpdateRequest }
> => {
  const client = useMemo(
    () => new SudojoClient(networkClient, config),
    [networkClient, config],
  );
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      auth,
      uuid,
      data,
    }: {
      auth: SudojoAuth;
      uuid: string;
      data: LevelUpdateRequest;
    }) => {
      return client.updateLevel(auth, uuid, data);
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
  config: SudojoConfig,
): UseMutationResult<
  BaseResponse<Level>,
  Error,
  { auth: SudojoAuth; uuid: string }
> => {
  const client = useMemo(
    () => new SudojoClient(networkClient, config),
    [networkClient, config],
  );
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ auth, uuid }: { auth: SudojoAuth; uuid: string }) => {
      return client.deleteLevel(auth, uuid);
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.sudojo.levels() });
      queryClient.removeQueries({
        queryKey: queryKeys.sudojo.level(variables.uuid),
      });
    },
  });
};
