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
import type { NetworkClient } from "@sudobility/types";
import type {
  BaseResponse,
  Learning,
  LearningCreateRequest,
  LearningQueryParams,
  LearningUpdateRequest,
} from "@sudobility/sudojo_types";
import { queryKeys } from "./query-keys";
import { STALE_TIMES } from "./query-config";
import { SudojoClient } from "../network/sudojo-client";

/**
 * Hook to get all learning entries with optional filtering
 */
export const useSudojoLearning = (
  networkClient: NetworkClient,
  baseUrl: string,
  token: string,
  queryParams?: LearningQueryParams,
  options?: Omit<
    UseQueryOptions<BaseResponse<Learning[]>>,
    "queryKey" | "queryFn"
  >,
): UseQueryResult<BaseResponse<Learning[]>> => {
  const client = useMemo(
    () => new SudojoClient(networkClient, baseUrl),
    [networkClient, baseUrl],
  );

  const queryFn = useCallback(async (): Promise<BaseResponse<Learning[]>> => {
    return client.getLearning(token, queryParams);
  }, [client, token, queryParams]);

  // Public endpoint - no token required
  const isEnabled = options?.enabled !== undefined ? options.enabled : true;

  return useQuery({
    queryKey: queryKeys.sudojo.learning({
      technique: queryParams?.technique ?? undefined,
      language_code: queryParams?.language_code ?? undefined,
    }),
    queryFn,
    staleTime: STALE_TIMES.LEARNING,
    ...options,
    enabled: isEnabled,
  });
};

/**
 * Hook to get a specific learning item by UUID
 */
export const useSudojoLearningItem = (
  networkClient: NetworkClient,
  baseUrl: string,
  token: string,
  uuid: string,
  options?: Omit<
    UseQueryOptions<BaseResponse<Learning>>,
    "queryKey" | "queryFn"
  >,
): UseQueryResult<BaseResponse<Learning>> => {
  const client = useMemo(
    () => new SudojoClient(networkClient, baseUrl),
    [networkClient, baseUrl],
  );

  const queryFn = useCallback(async (): Promise<BaseResponse<Learning>> => {
    return client.getLearningItem(token, uuid);
  }, [client, token, uuid]);

  // Public endpoint - no token required, but uuid is required
  const isEnabled =
    !!uuid && (options?.enabled !== undefined ? options.enabled : true);

  return useQuery({
    queryKey: queryKeys.sudojo.learningItem(uuid),
    queryFn,
    staleTime: STALE_TIMES.LEARNING,
    ...options,
    enabled: isEnabled,
  });
};

/**
 * Hook to create a learning entry
 */
export const useSudojoCreateLearning = (
  networkClient: NetworkClient,
  baseUrl: string,
): UseMutationResult<
  BaseResponse<Learning>,
  Error,
  { token: string; data: LearningCreateRequest }
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
      data: LearningCreateRequest;
    }) => {
      return client.createLearning(token, data);
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
  baseUrl: string,
): UseMutationResult<
  BaseResponse<Learning>,
  Error,
  { token: string; uuid: string; data: LearningUpdateRequest }
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
      data: LearningUpdateRequest;
    }) => {
      return client.updateLearning(token, uuid, data);
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
  baseUrl: string,
): UseMutationResult<
  BaseResponse<Learning>,
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
      return client.deleteLearning(token, uuid);
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
