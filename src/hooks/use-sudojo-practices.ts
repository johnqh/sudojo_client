/**
 * Hook for Sudojo practices endpoints
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
  TechniquePractice,
  TechniquePracticeCountItem,
  TechniquePracticeCreateRequest,
} from "@sudobility/sudojo_types";
import { queryKeys } from "./query-keys";
import { SudojoClient } from "../network/sudojo-client";

/**
 * Hook to fetch practice counts for all techniques.
 *
 * Returns the number of practice puzzles available for each technique.
 * Uses `staleTime: 0` to always fetch fresh counts.
 *
 * @param networkClient - Network client for making HTTP requests
 * @param baseUrl - Base URL of the Sudojo API
 * @param token - Firebase access token
 * @param options - Additional TanStack Query options
 * @returns A UseQueryResult containing an array of TechniquePracticeCountItem
 */
export const useSudojoPracticeCounts = (
  networkClient: NetworkClient,
  baseUrl: string,
  token: string,
  options?: Omit<
    UseQueryOptions<BaseResponse<TechniquePracticeCountItem[]>>,
    "queryKey" | "queryFn"
  >,
): UseQueryResult<BaseResponse<TechniquePracticeCountItem[]>> => {
  const client = useMemo(
    () => new SudojoClient(networkClient, baseUrl),
    [networkClient, baseUrl],
  );

  const queryFn = useCallback(async (): Promise<
    BaseResponse<TechniquePracticeCountItem[]>
  > => {
    return client.getPracticeCounts(token);
  }, [client, token]);

  const isEnabled = options?.enabled !== undefined ? options.enabled : true;

  return useQuery({
    queryKey: queryKeys.sudojo.practiceCounts(),
    queryFn,
    staleTime: 0, // Always fetch fresh for counts
    ...options,
    enabled: isEnabled,
  });
};

/**
 * Hook to fetch a random practice puzzle for a specific technique.
 *
 * The query is automatically disabled when technique < 1. Uses `staleTime: 0`
 * to always fetch a fresh random practice.
 *
 * @param networkClient - Network client for making HTTP requests
 * @param baseUrl - Base URL of the Sudojo API
 * @param token - Firebase access token
 * @param technique - Technique number (>= 1). Query is disabled if < 1.
 * @param options - Additional TanStack Query options
 * @returns A UseQueryResult containing a single TechniquePractice object
 */
export const useSudojoRandomPractice = (
  networkClient: NetworkClient,
  baseUrl: string,
  token: string,
  technique: number,
  options?: Omit<
    UseQueryOptions<BaseResponse<TechniquePractice>>,
    "queryKey" | "queryFn"
  >,
): UseQueryResult<BaseResponse<TechniquePractice>> => {
  const client = useMemo(
    () => new SudojoClient(networkClient, baseUrl),
    [networkClient, baseUrl],
  );

  const queryFn = useCallback(async (): Promise<
    BaseResponse<TechniquePractice>
  > => {
    return client.getRandomPractice(token, technique);
  }, [client, token, technique]);

  const isEnabled =
    technique >= 1 && (options?.enabled !== undefined ? options.enabled : true);

  return useQuery({
    queryKey: queryKeys.sudojo.practiceRandom(technique),
    queryFn,
    staleTime: 0, // Always fetch fresh for random
    ...options,
    enabled: isEnabled,
  });
};

/**
 * Hook to create a new practice puzzle. **Admin only.**
 *
 * On success, invalidates the practice counts query so the UI reflects the new count.
 *
 * @param networkClient - Network client for making HTTP requests
 * @param baseUrl - Base URL of the Sudojo API
 * @returns A UseMutationResult. Call `mutate({ token, data })` to execute.
 */
export const useSudojoCreatePractice = (
  networkClient: NetworkClient,
  baseUrl: string,
): UseMutationResult<
  BaseResponse<TechniquePractice>,
  Error,
  { token: string; data: TechniquePracticeCreateRequest }
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
      data: TechniquePracticeCreateRequest;
    }) => {
      return client.createPractice(token, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.sudojo.practiceCounts(),
      });
    },
  });
};

/**
 * Hook to delete all practices. **Admin only.** This is a destructive operation
 * that removes all practice puzzles from the database.
 *
 * Internally passes `confirm=true` as a query parameter (required by the API
 * as a safety measure). On success, invalidates the practice counts query.
 *
 * @param networkClient - Network client for making HTTP requests
 * @param baseUrl - Base URL of the Sudojo API
 * @returns A UseMutationResult. Call `mutate({ token })` to execute.
 */
export const useSudojoDeleteAllPractices = (
  networkClient: NetworkClient,
  baseUrl: string,
): UseMutationResult<
  BaseResponse<{ deleted: number; message: string }>,
  Error,
  { token: string }
> => {
  const client = useMemo(
    () => new SudojoClient(networkClient, baseUrl),
    [networkClient, baseUrl],
  );
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ token }: { token: string }) => {
      return client.deleteAllPractices(token);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.sudojo.practiceCounts(),
      });
    },
  });
};
