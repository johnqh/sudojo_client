/**
 * Hooks for Sudojo technique example endpoints
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
  ExampleCountsData,
  TechniqueExample,
  TechniqueExampleCreateRequest,
  TechniqueExampleQueryParams,
  TechniqueExampleUpdateRequest,
} from "@sudobility/sudojo_types";
import { queryKeys } from "./query-keys";
import { STALE_TIMES } from "./query-config";
import { SudojoClient } from "../network/sudojo-client";

/**
 * Hook to fetch technique examples, optionally filtered by technique.
 *
 * Public endpoint. Stale time: {@link STALE_TIMES.EXAMPLES} (5 minutes).
 *
 * @param networkClient - Network client for making HTTP requests
 * @param baseUrl - Base URL of the Sudojo API
 * @param token - Firebase access token (optional for this public endpoint)
 * @param queryParams - Optional filter (e.g., `{ technique: 5 }`)
 * @param options - Additional TanStack Query options
 * @returns A UseQueryResult containing an array of TechniqueExample objects
 */
export const useSudojoExamples = (
  networkClient: NetworkClient,
  baseUrl: string,
  token: string,
  queryParams?: TechniqueExampleQueryParams,
  options?: Omit<
    UseQueryOptions<BaseResponse<TechniqueExample[]>>,
    "queryKey" | "queryFn"
  >,
): UseQueryResult<BaseResponse<TechniqueExample[]>> => {
  const client = useMemo(
    () => new SudojoClient(networkClient, baseUrl),
    [networkClient, baseUrl],
  );

  const technique = queryParams?.technique ?? undefined;

  const queryFn = useCallback(async (): Promise<
    BaseResponse<TechniqueExample[]>
  > => {
    return client.getExamples(
      token,
      technique !== undefined ? { technique } : undefined,
    );
  }, [client, token, technique]);

  const isEnabled = options?.enabled !== undefined ? options.enabled : true;

  return useQuery({
    queryKey: queryKeys.sudojo.examples({ technique }),
    queryFn,
    staleTime: STALE_TIMES.EXAMPLES,
    ...options,
    enabled: isEnabled,
  });
};

/**
 * Hook to fetch example counts per technique.
 *
 * Public endpoint. Uses `staleTime: 0` to always fetch fresh counts.
 *
 * @param networkClient - Network client for making HTTP requests
 * @param baseUrl - Base URL of the Sudojo API
 * @param token - Firebase access token (optional for this public endpoint)
 * @param options - Additional TanStack Query options
 * @returns A UseQueryResult containing a technique ID -> count map
 */
export const useSudojoExampleCounts = (
  networkClient: NetworkClient,
  baseUrl: string,
  token: string,
  options?: Omit<
    UseQueryOptions<BaseResponse<ExampleCountsData>>,
    "queryKey" | "queryFn"
  >,
): UseQueryResult<BaseResponse<ExampleCountsData>> => {
  const client = useMemo(
    () => new SudojoClient(networkClient, baseUrl),
    [networkClient, baseUrl],
  );

  const queryFn = useCallback(async (): Promise<
    BaseResponse<ExampleCountsData>
  > => {
    return client.getExampleCounts(token);
  }, [client, token]);

  const isEnabled = options?.enabled !== undefined ? options.enabled : true;

  return useQuery({
    queryKey: queryKeys.sudojo.exampleCounts(),
    queryFn,
    staleTime: 0, // Always fetch fresh for counts
    ...options,
    enabled: isEnabled,
  });
};

/**
 * Hook to fetch a random technique example, optionally filtered by technique.
 *
 * Public endpoint. Uses `staleTime: 0`; call `refetch()` for another example.
 *
 * @param networkClient - Network client for making HTTP requests
 * @param baseUrl - Base URL of the Sudojo API
 * @param token - Firebase access token (optional for this public endpoint)
 * @param queryParams - Optional filter (e.g., `{ technique: 5 }`)
 * @param options - Additional TanStack Query options
 * @returns A UseQueryResult containing a single TechniqueExample
 */
export const useSudojoRandomExample = (
  networkClient: NetworkClient,
  baseUrl: string,
  token: string,
  queryParams?: TechniqueExampleQueryParams,
  options?: Omit<
    UseQueryOptions<BaseResponse<TechniqueExample>>,
    "queryKey" | "queryFn"
  >,
): UseQueryResult<BaseResponse<TechniqueExample>> => {
  const client = useMemo(
    () => new SudojoClient(networkClient, baseUrl),
    [networkClient, baseUrl],
  );

  const technique = queryParams?.technique ?? undefined;

  const queryFn = useCallback(async (): Promise<
    BaseResponse<TechniqueExample>
  > => {
    return client.getRandomExample(
      token,
      technique !== undefined ? { technique } : undefined,
    );
  }, [client, token, technique]);

  const isEnabled = options?.enabled !== undefined ? options.enabled : true;

  return useQuery({
    queryKey: queryKeys.sudojo.exampleRandom({ technique }),
    queryFn,
    staleTime: 0, // Always fetch fresh for random
    ...options,
    enabled: isEnabled,
  });
};

/**
 * Hook to fetch a single technique example by UUID.
 *
 * Public endpoint. Disabled when `uuid` is empty.
 * Stale time: {@link STALE_TIMES.EXAMPLES} (5 minutes).
 *
 * @param networkClient - Network client for making HTTP requests
 * @param baseUrl - Base URL of the Sudojo API
 * @param token - Firebase access token (optional for this public endpoint)
 * @param uuid - Example UUID. Query is disabled if empty.
 * @param options - Additional TanStack Query options
 * @returns A UseQueryResult containing a single TechniqueExample
 */
export const useSudojoExample = (
  networkClient: NetworkClient,
  baseUrl: string,
  token: string,
  uuid: string,
  options?: Omit<
    UseQueryOptions<BaseResponse<TechniqueExample>>,
    "queryKey" | "queryFn"
  >,
): UseQueryResult<BaseResponse<TechniqueExample>> => {
  const client = useMemo(
    () => new SudojoClient(networkClient, baseUrl),
    [networkClient, baseUrl],
  );

  const queryFn = useCallback(async (): Promise<
    BaseResponse<TechniqueExample>
  > => {
    return client.getExample(token, uuid);
  }, [client, token, uuid]);

  const isEnabled =
    !!uuid && (options?.enabled !== undefined ? options.enabled : true);

  return useQuery({
    queryKey: queryKeys.sudojo.example(uuid),
    queryFn,
    staleTime: STALE_TIMES.EXAMPLES,
    ...options,
    enabled: isEnabled,
  });
};

/**
 * Hook to create a technique example. Requires admin authentication.
 *
 * On success, invalidates all example queries (lists, counts, random).
 *
 * @param networkClient - Network client for making HTTP requests
 * @param baseUrl - Base URL of the Sudojo API
 * @returns A UseMutationResult. Call `mutate({ token, data })` to execute.
 */
export const useSudojoCreateExample = (
  networkClient: NetworkClient,
  baseUrl: string,
): UseMutationResult<
  BaseResponse<TechniqueExample>,
  Error,
  { token: string; data: TechniqueExampleCreateRequest }
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
      data: TechniqueExampleCreateRequest;
    }) => {
      return client.createExample(token, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [...queryKeys.sudojo.all(), "examples"],
      });
    },
  });
};

/**
 * Hook to update a technique example. Requires admin authentication.
 *
 * On success, invalidates all example queries, including this example's.
 *
 * @param networkClient - Network client for making HTTP requests
 * @param baseUrl - Base URL of the Sudojo API
 * @returns A UseMutationResult. Call `mutate({ token, uuid, data })` to execute.
 */
export const useSudojoUpdateExample = (
  networkClient: NetworkClient,
  baseUrl: string,
): UseMutationResult<
  BaseResponse<TechniqueExample>,
  Error,
  { token: string; uuid: string; data: TechniqueExampleUpdateRequest }
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
      data: TechniqueExampleUpdateRequest;
    }) => {
      return client.updateExample(token, uuid, data);
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: [...queryKeys.sudojo.all(), "examples"],
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.sudojo.example(variables.uuid),
      });
    },
  });
};

/**
 * Hook to delete a technique example. Requires admin authentication.
 *
 * On success, invalidates all example queries and removes this example from
 * the cache.
 *
 * @param networkClient - Network client for making HTTP requests
 * @param baseUrl - Base URL of the Sudojo API
 * @returns A UseMutationResult. Call `mutate({ token, uuid })` to execute.
 */
export const useSudojoDeleteExample = (
  networkClient: NetworkClient,
  baseUrl: string,
): UseMutationResult<
  BaseResponse<TechniqueExample>,
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
      return client.deleteExample(token, uuid);
    },
    onSuccess: (_data, variables) => {
      queryClient.removeQueries({
        queryKey: queryKeys.sudojo.example(variables.uuid),
      });
      queryClient.invalidateQueries({
        queryKey: [...queryKeys.sudojo.all(), "examples"],
      });
    },
  });
};
