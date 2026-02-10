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
 * Hook to get practice counts for all techniques
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
 * Hook to get a random practice for a specific technique
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
    technique >= 1 &&
    (options?.enabled !== undefined ? options.enabled : true);

  return useQuery({
    queryKey: queryKeys.sudojo.practiceRandom(technique),
    queryFn,
    staleTime: 0, // Always fetch fresh for random
    ...options,
    enabled: isEnabled,
  });
};

/**
 * Hook to create a practice (admin only)
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
 * Hook to delete all practices (admin only)
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
