/**
 * Hooks for Sudojo strategy endpoints
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
  Strategy,
  StrategyCreateRequest,
  StrategyUpdateRequest,
} from "@sudobility/sudojo_types";
import { queryKeys } from "./query-keys";
import { STALE_TIMES } from "./query-config";
import { SudojoClient } from "../network/sudojo-client";

/**
 * Hook to fetch all strategies sorted by difficulty.
 *
 * @param networkClient - Network client for making HTTP requests
 * @param baseUrl - Base URL of the Sudojo API
 * @param token - Firebase access token (optional for this public endpoint)
 * @param options - Additional TanStack Query options
 * @returns A UseQueryResult containing an array of Strategy objects
 */
export const useSudojoStrategies = (
  networkClient: NetworkClient,
  baseUrl: string,
  token: string,
  options?: Omit<
    UseQueryOptions<BaseResponse<Strategy[]>>,
    "queryKey" | "queryFn"
  >,
): UseQueryResult<BaseResponse<Strategy[]>> => {
  const client = useMemo(
    () => new SudojoClient(networkClient, baseUrl),
    [networkClient, baseUrl],
  );

  const queryFn = useCallback(async (): Promise<BaseResponse<Strategy[]>> => {
    return client.getStrategies(token);
  }, [client, token]);

  const isEnabled = options?.enabled !== undefined ? options.enabled : true;

  return useQuery({
    queryKey: queryKeys.sudojo.strategies(),
    queryFn,
    staleTime: STALE_TIMES.STRATEGIES,
    ...options,
    enabled: isEnabled,
  });
};

/**
 * Hook to fetch a single strategy by stub.
 *
 * @param networkClient - Network client for making HTTP requests
 * @param baseUrl - Base URL of the Sudojo API
 * @param token - Firebase access token (optional for this public endpoint)
 * @param stub - Strategy URL stub (e.g., "naked-subsets")
 * @param options - Additional TanStack Query options
 * @returns A UseQueryResult containing a Strategy object
 */
export const useSudojoStrategyByStub = (
  networkClient: NetworkClient,
  baseUrl: string,
  token: string,
  stub: string,
  options?: Omit<
    UseQueryOptions<BaseResponse<Strategy>>,
    "queryKey" | "queryFn"
  >,
): UseQueryResult<BaseResponse<Strategy>> => {
  const client = useMemo(
    () => new SudojoClient(networkClient, baseUrl),
    [networkClient, baseUrl],
  );

  const queryFn = useCallback(async (): Promise<BaseResponse<Strategy>> => {
    return client.getStrategyByStub(token, stub);
  }, [client, token, stub]);

  const isEnabled =
    (options?.enabled !== undefined ? options.enabled : true) && !!stub;

  return useQuery({
    queryKey: queryKeys.sudojo.strategyByStub(stub),
    queryFn,
    staleTime: STALE_TIMES.STRATEGIES,
    ...options,
    enabled: isEnabled,
  });
};

/**
 * Hook to create a new strategy. Requires admin authentication.
 *
 * On success, invalidates all strategy list queries.
 */
export const useSudojoCreateStrategy = (
  networkClient: NetworkClient,
  baseUrl: string,
): UseMutationResult<
  BaseResponse<Strategy>,
  Error,
  { token: string; data: StrategyCreateRequest }
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
      data: StrategyCreateRequest;
    }) => {
      return client.createStrategy(token, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [...queryKeys.sudojo.all(), "strategies"],
      });
    },
  });
};

/**
 * Hook to update an existing strategy. Requires admin authentication.
 *
 * On success, invalidates all strategy list queries.
 */
export const useSudojoUpdateStrategy = (
  networkClient: NetworkClient,
  baseUrl: string,
): UseMutationResult<
  BaseResponse<Strategy>,
  Error,
  { token: string; strategy: number; data: StrategyUpdateRequest }
> => {
  const client = useMemo(
    () => new SudojoClient(networkClient, baseUrl),
    [networkClient, baseUrl],
  );
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      token,
      strategy,
      data,
    }: {
      token: string;
      strategy: number;
      data: StrategyUpdateRequest;
    }) => {
      return client.updateStrategy(token, strategy, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [...queryKeys.sudojo.all(), "strategies"],
      });
    },
  });
};

/**
 * Hook to delete a strategy. Requires admin authentication.
 *
 * On success, invalidates all strategy list queries.
 */
export const useSudojoDeleteStrategy = (
  networkClient: NetworkClient,
  baseUrl: string,
): UseMutationResult<
  BaseResponse<Strategy>,
  Error,
  { token: string; strategy: number }
> => {
  const client = useMemo(
    () => new SudojoClient(networkClient, baseUrl),
    [networkClient, baseUrl],
  );
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      token,
      strategy,
    }: {
      token: string;
      strategy: number;
    }) => {
      return client.deleteStrategy(token, strategy);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [...queryKeys.sudojo.all(), "strategies"],
      });
    },
  });
};
