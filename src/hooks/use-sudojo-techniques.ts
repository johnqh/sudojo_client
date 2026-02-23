/**
 * Hook for Sudojo techniques endpoints
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
  Technique,
  TechniqueCreateRequest,
  TechniqueQueryParams,
  TechniqueUpdateRequest,
} from "@sudobility/sudojo_types";
import { queryKeys } from "./query-keys";
import { STALE_TIMES } from "./query-config";
import { SudojoClient } from "../network/sudojo-client";

/**
 * Hook to fetch all Sudoku solving techniques, optionally filtered by level.
 *
 * Techniques are the core solving strategies (e.g., Hidden Singles, X-Wing).
 * This is a public endpoint. Results are cached with the filter parameters
 * as part of the query key, so different level filters produce separate cache entries.
 *
 * Stale time: {@link STALE_TIMES.TECHNIQUES} (10 minutes) since techniques rarely change.
 *
 * @param networkClient - Network client for making HTTP requests
 * @param baseUrl - Base URL of the Sudojo API
 * @param token - Firebase access token (optional for this public endpoint)
 * @param queryParams - Optional filter parameters (e.g., `{ level: 1 }`)
 * @param options - Additional TanStack Query options
 * @returns A UseQueryResult containing an array of Technique objects
 */
export const useSudojoTechniques = (
  networkClient: NetworkClient,
  baseUrl: string,
  token: string,
  queryParams?: TechniqueQueryParams,
  options?: Omit<
    UseQueryOptions<BaseResponse<Technique[]>>,
    "queryKey" | "queryFn"
  >,
): UseQueryResult<BaseResponse<Technique[]>> => {
  const client = useMemo(
    () => new SudojoClient(networkClient, baseUrl),
    [networkClient, baseUrl],
  );

  const queryFn = useCallback(async (): Promise<BaseResponse<Technique[]>> => {
    return client.getTechniques(token, queryParams);
  }, [client, token, queryParams]);

  // Public endpoint - no token required
  const isEnabled = options?.enabled !== undefined ? options.enabled : true;

  return useQuery({
    queryKey: queryKeys.sudojo.techniques({
      level: queryParams?.level ?? undefined,
    }),
    queryFn,
    staleTime: STALE_TIMES.TECHNIQUES,
    ...options,
    enabled: isEnabled,
  });
};

/**
 * Hook to fetch a specific technique by its number.
 *
 * The query is automatically disabled when the technique number is less than 1.
 *
 * Stale time: {@link STALE_TIMES.TECHNIQUES} (10 minutes).
 *
 * @param networkClient - Network client for making HTTP requests
 * @param baseUrl - Base URL of the Sudojo API
 * @param token - Firebase access token
 * @param technique - Technique number (>= 1). Query is disabled if < 1.
 * @param options - Additional TanStack Query options
 * @returns A UseQueryResult containing a single Technique object
 */
export const useSudojoTechnique = (
  networkClient: NetworkClient,
  baseUrl: string,
  token: string,
  technique: number,
  options?: Omit<
    UseQueryOptions<BaseResponse<Technique>>,
    "queryKey" | "queryFn"
  >,
): UseQueryResult<BaseResponse<Technique>> => {
  const client = useMemo(
    () => new SudojoClient(networkClient, baseUrl),
    [networkClient, baseUrl],
  );

  const queryFn = useCallback(async (): Promise<BaseResponse<Technique>> => {
    return client.getTechnique(token, technique);
  }, [client, token, technique]);

  // Public endpoint - no token required, but technique is required
  const isEnabled =
    technique >= 1 && (options?.enabled !== undefined ? options.enabled : true);

  return useQuery({
    queryKey: queryKeys.sudojo.technique(technique),
    queryFn,
    staleTime: STALE_TIMES.TECHNIQUES,
    ...options,
    enabled: isEnabled,
  });
};

/**
 * Hook to create a new technique. Requires admin authentication.
 *
 * On success, invalidates all technique list queries.
 *
 * @param networkClient - Network client for making HTTP requests
 * @param baseUrl - Base URL of the Sudojo API
 * @returns A UseMutationResult. Call `mutate({ token, data })` to execute.
 */
export const useSudojoCreateTechnique = (
  networkClient: NetworkClient,
  baseUrl: string,
): UseMutationResult<
  BaseResponse<Technique>,
  Error,
  { token: string; data: TechniqueCreateRequest }
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
      data: TechniqueCreateRequest;
    }) => {
      return client.createTechnique(token, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [...queryKeys.sudojo.all(), "techniques"],
      });
    },
  });
};

/**
 * Hook to update an existing technique. Requires admin authentication.
 *
 * On success, invalidates all technique list queries and the specific technique query.
 *
 * @param networkClient - Network client for making HTTP requests
 * @param baseUrl - Base URL of the Sudojo API
 * @returns A UseMutationResult. Call `mutate({ token, technique, data })` to execute.
 */
export const useSudojoUpdateTechnique = (
  networkClient: NetworkClient,
  baseUrl: string,
): UseMutationResult<
  BaseResponse<Technique>,
  Error,
  { token: string; technique: number; data: TechniqueUpdateRequest }
> => {
  const client = useMemo(
    () => new SudojoClient(networkClient, baseUrl),
    [networkClient, baseUrl],
  );
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      token,
      technique,
      data,
    }: {
      token: string;
      technique: number;
      data: TechniqueUpdateRequest;
    }) => {
      return client.updateTechnique(token, technique, data);
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: [...queryKeys.sudojo.all(), "techniques"],
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.sudojo.technique(variables.technique),
      });
    },
  });
};

/**
 * Hook to delete a technique. Requires admin authentication.
 *
 * On success, invalidates all technique list queries and removes the specific
 * technique from the query cache.
 *
 * @param networkClient - Network client for making HTTP requests
 * @param baseUrl - Base URL of the Sudojo API
 * @returns A UseMutationResult. Call `mutate({ token, technique })` to execute.
 */
export const useSudojoDeleteTechnique = (
  networkClient: NetworkClient,
  baseUrl: string,
): UseMutationResult<
  BaseResponse<Technique>,
  Error,
  { token: string; technique: number }
> => {
  const client = useMemo(
    () => new SudojoClient(networkClient, baseUrl),
    [networkClient, baseUrl],
  );
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      token,
      technique,
    }: {
      token: string;
      technique: number;
    }) => {
      return client.deleteTechnique(token, technique);
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: [...queryKeys.sudojo.all(), "techniques"],
      });
      queryClient.removeQueries({
        queryKey: queryKeys.sudojo.technique(variables.technique),
      });
    },
  });
};
