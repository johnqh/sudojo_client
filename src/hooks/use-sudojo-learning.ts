/**
 * Hook for Sudojo learning endpoints
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
import type { BaseResponse, NetworkClient } from "@sudobility/types";
import type {
  Learning,
  LearningCreateRequest,
  LearningQueryParams,
  LearningUpdateRequest,
} from "@sudobility/sudojo_types";
import { queryKeys } from "./query-keys";
import { STALE_TIMES } from "./query-config";
import { SudojoClient } from "../network/sudojo-client";
import type { SudojoAuth, SudojoConfig } from "../network/sudojo-client";

/**
 * Hook to get all learning entries with optional filtering
 */
export const useSudojoLearning = (
  networkClient: NetworkClient,
  config: SudojoConfig,
  queryParams?: LearningQueryParams,
  options?: Omit<
    UseQueryOptions<BaseResponse<Learning[]>>,
    "queryKey" | "queryFn"
  >,
): UseQueryResult<BaseResponse<Learning[]>> => {
  const client = useMemo(
    () => new SudojoClient(networkClient, config),
    [networkClient, config],
  );

  const queryFn = useCallback(async (): Promise<BaseResponse<Learning[]>> => {
    return client.getLearning(queryParams);
  }, [client, queryParams]);

  return useQuery({
    queryKey: queryKeys.sudojo.learning({
      technique_uuid: queryParams?.technique_uuid ?? undefined,
      language_code: queryParams?.language_code ?? undefined,
    }),
    queryFn,
    staleTime: STALE_TIMES.LEARNING,
    ...options,
  });
};

/**
 * Hook to get a specific learning item by UUID
 */
export const useSudojoLearningItem = (
  networkClient: NetworkClient,
  config: SudojoConfig,
  uuid: string,
  options?: Omit<
    UseQueryOptions<BaseResponse<Learning>>,
    "queryKey" | "queryFn"
  >,
): UseQueryResult<BaseResponse<Learning>> => {
  const client = useMemo(
    () => new SudojoClient(networkClient, config),
    [networkClient, config],
  );

  const queryFn = useCallback(async (): Promise<BaseResponse<Learning>> => {
    return client.getLearningItem(uuid);
  }, [client, uuid]);

  return useQuery({
    queryKey: queryKeys.sudojo.learningItem(uuid),
    queryFn,
    staleTime: STALE_TIMES.LEARNING,
    enabled: !!uuid,
    ...options,
  });
};

/**
 * Hook to create a learning entry
 */
export const useSudojoCreateLearning = (
  networkClient: NetworkClient,
  config: SudojoConfig,
): UseMutationResult<
  BaseResponse<Learning>,
  Error,
  { auth: SudojoAuth; data: LearningCreateRequest }
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
      data: LearningCreateRequest;
    }) => {
      return client.createLearning(auth, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [...queryKeys.sudojo.all(), "learning"],
      });
    },
  });
};

/**
 * Hook to update a learning entry
 */
export const useSudojoUpdateLearning = (
  networkClient: NetworkClient,
  config: SudojoConfig,
): UseMutationResult<
  BaseResponse<Learning>,
  Error,
  { auth: SudojoAuth; uuid: string; data: LearningUpdateRequest }
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
      data: LearningUpdateRequest;
    }) => {
      return client.updateLearning(auth, uuid, data);
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: [...queryKeys.sudojo.all(), "learning"],
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.sudojo.learningItem(variables.uuid),
      });
    },
  });
};

/**
 * Hook to delete a learning entry
 */
export const useSudojoDeleteLearning = (
  networkClient: NetworkClient,
  config: SudojoConfig,
): UseMutationResult<
  BaseResponse<null>,
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
      return client.deleteLearning(auth, uuid);
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: [...queryKeys.sudojo.all(), "learning"],
      });
      queryClient.removeQueries({
        queryKey: queryKeys.sudojo.learningItem(variables.uuid),
      });
    },
  });
};
