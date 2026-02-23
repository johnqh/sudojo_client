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
 * Hook to fetch all learning entries, optionally filtered by technique and/or language.
 *
 * Learning entries contain educational content that teaches users about specific
 * Sudoku solving techniques. This is a public endpoint.
 *
 * Stale time: {@link STALE_TIMES.LEARNING} (10 minutes) since learning content rarely changes.
 *
 * @param networkClient - Network client for making HTTP requests
 * @param baseUrl - Base URL of the Sudojo API
 * @param token - Firebase access token (optional for this public endpoint)
 * @param queryParams - Optional filter parameters (e.g., `{ technique: 1, language_code: "en" }`)
 * @param options - Additional TanStack Query options
 * @returns A UseQueryResult containing an array of Learning objects
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
 * Hook to fetch a specific learning item by its UUID.
 *
 * The query is automatically disabled when no UUID is provided.
 *
 * Stale time: {@link STALE_TIMES.LEARNING} (10 minutes).
 *
 * @param networkClient - Network client for making HTTP requests
 * @param baseUrl - Base URL of the Sudojo API
 * @param token - Firebase access token
 * @param uuid - Learning item UUID. Query is disabled if empty.
 * @param options - Additional TanStack Query options
 * @returns A UseQueryResult containing a single Learning object
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
 * Hook to create a new learning entry. Requires admin authentication.
 *
 * On success, invalidates all learning list queries.
 *
 * @param networkClient - Network client for making HTTP requests
 * @param baseUrl - Base URL of the Sudojo API
 * @returns A UseMutationResult. Call `mutate({ token, data })` to execute.
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
 * Hook to update an existing learning entry. Requires admin authentication.
 *
 * On success, invalidates all learning list queries and the specific learning item query.
 *
 * @param networkClient - Network client for making HTTP requests
 * @param baseUrl - Base URL of the Sudojo API
 * @returns A UseMutationResult. Call `mutate({ token, uuid, data })` to execute.
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
 * Hook to delete a learning entry. Requires admin authentication.
 *
 * On success, invalidates all learning list queries and removes the specific
 * learning item from the query cache.
 *
 * @param networkClient - Network client for making HTTP requests
 * @param baseUrl - Base URL of the Sudojo API
 * @returns A UseMutationResult. Call `mutate({ token, uuid })` to execute.
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
