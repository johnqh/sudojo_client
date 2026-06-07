/**
 * Hooks for Sudojo communities endpoints
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
  Community,
  CommunityCreateRequest,
  CommunityQueryParams,
  CommunityUpdateRequest,
} from "@sudobility/sudojo_types";
import { queryKeys } from "./query-keys";
import { STALE_TIMES } from "./query-config";
import { SudojoClient } from "../network/sudojo-client";

/**
 * Hook to fetch communities, optionally filtered by language.
 *
 * Communities are language-specific: different records per language.
 * The language filter is included in the query key so that switching
 * languages produces a separate cache entry and triggers a refetch.
 *
 * @param networkClient - Network client for making HTTP requests
 * @param baseUrl - Base URL of the Sudojo API
 * @param token - Firebase access token (optional for this public endpoint)
 * @param queryParams - Optional filter parameters (e.g., `{ language: "en" }`)
 * @param options - Additional TanStack Query options
 * @returns A UseQueryResult containing an array of Community objects
 */
export const useSudojoCommunities = (
  networkClient: NetworkClient,
  baseUrl: string,
  token: string,
  queryParams?: CommunityQueryParams,
  options?: Omit<
    UseQueryOptions<BaseResponse<Community[]>>,
    "queryKey" | "queryFn"
  >,
): UseQueryResult<BaseResponse<Community[]>> => {
  const client = useMemo(
    () => new SudojoClient(networkClient, baseUrl),
    [networkClient, baseUrl],
  );

  const queryFn = useCallback(async (): Promise<BaseResponse<Community[]>> => {
    return client.getCommunities(token, queryParams);
  }, [client, token, queryParams]);

  const isEnabled = options?.enabled !== undefined ? options.enabled : true;

  return useQuery({
    queryKey: queryKeys.sudojo.communities({
      language: queryParams?.language ?? undefined,
    }),
    queryFn,
    staleTime: STALE_TIMES.COMMUNITIES,
    ...options,
    enabled: isEnabled,
  });
};

/**
 * Hook to create a new community. Requires admin authentication.
 *
 * On success, invalidates all community list queries.
 */
export const useSudojoCreateCommunity = (
  networkClient: NetworkClient,
  baseUrl: string,
): UseMutationResult<
  BaseResponse<Community>,
  Error,
  { token: string; data: CommunityCreateRequest }
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
      data: CommunityCreateRequest;
    }) => {
      return client.createCommunity(token, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [...queryKeys.sudojo.all(), "communities"],
      });
    },
  });
};

/**
 * Hook to update an existing community. Requires admin authentication.
 *
 * On success, invalidates all community list queries.
 */
export const useSudojoUpdateCommunity = (
  networkClient: NetworkClient,
  baseUrl: string,
): UseMutationResult<
  BaseResponse<Community>,
  Error,
  { token: string; uuid: string; data: CommunityUpdateRequest }
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
      data: CommunityUpdateRequest;
    }) => {
      return client.updateCommunity(token, uuid, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [...queryKeys.sudojo.all(), "communities"],
      });
    },
  });
};

/**
 * Hook to delete a community. Requires admin authentication.
 *
 * On success, invalidates all community list queries.
 */
export const useSudojoDeleteCommunity = (
  networkClient: NetworkClient,
  baseUrl: string,
): UseMutationResult<
  BaseResponse<Community>,
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
      return client.deleteCommunity(token, uuid);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [...queryKeys.sudojo.all(), "communities"],
      });
    },
  });
};
