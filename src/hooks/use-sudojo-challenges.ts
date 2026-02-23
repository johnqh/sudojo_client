/**
 * Hook for Sudojo challenges endpoints
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
  Challenge,
  ChallengeCreateRequest,
  ChallengeQueryParams,
  ChallengeUpdateRequest,
} from "@sudobility/sudojo_types";
import { queryKeys } from "./query-keys";
import { STALE_TIMES } from "./query-config";
import { SudojoClient } from "../network/sudojo-client";

/**
 * Hook to fetch all challenges, optionally filtered by level and/or difficulty.
 *
 * Challenges are curated Sudoku puzzles with specific difficulty ratings.
 * This is a public endpoint.
 *
 * Stale time: {@link STALE_TIMES.CHALLENGES} (5 minutes).
 *
 * @param networkClient - Network client for making HTTP requests
 * @param baseUrl - Base URL of the Sudojo API
 * @param token - Firebase access token (optional for this public endpoint)
 * @param queryParams - Optional filter parameters (e.g., `{ level: 1, difficulty: 5 }`)
 * @param options - Additional TanStack Query options
 * @returns A UseQueryResult containing an array of Challenge objects
 */
export const useSudojoChallenges = (
  networkClient: NetworkClient,
  baseUrl: string,
  token: string,
  queryParams?: ChallengeQueryParams,
  options?: Omit<
    UseQueryOptions<BaseResponse<Challenge[]>>,
    "queryKey" | "queryFn"
  >,
): UseQueryResult<BaseResponse<Challenge[]>> => {
  const client = useMemo(
    () => new SudojoClient(networkClient, baseUrl),
    [networkClient, baseUrl],
  );

  const queryFn = useCallback(async (): Promise<BaseResponse<Challenge[]>> => {
    return client.getChallenges(token, queryParams);
  }, [client, token, queryParams]);

  // Public endpoint - no token required
  const isEnabled = options?.enabled !== undefined ? options.enabled : true;

  return useQuery({
    queryKey: queryKeys.sudojo.challenges({
      level: queryParams?.level ?? undefined,
      difficulty: queryParams?.difficulty ?? undefined,
    }),
    queryFn,
    staleTime: STALE_TIMES.CHALLENGES,
    ...options,
    enabled: isEnabled,
  });
};

/**
 * Hook to fetch a random challenge, optionally filtered by level and/or difficulty.
 *
 * Uses `staleTime: 0` to always fetch a fresh random challenge.
 *
 * @param networkClient - Network client for making HTTP requests
 * @param baseUrl - Base URL of the Sudojo API
 * @param token - Firebase access token (optional for this public endpoint)
 * @param queryParams - Optional filter parameters
 * @param options - Additional TanStack Query options
 * @returns A UseQueryResult containing a single Challenge object
 */
export const useSudojoRandomChallenge = (
  networkClient: NetworkClient,
  baseUrl: string,
  token: string,
  queryParams?: ChallengeQueryParams,
  options?: Omit<
    UseQueryOptions<BaseResponse<Challenge>>,
    "queryKey" | "queryFn"
  >,
): UseQueryResult<BaseResponse<Challenge>> => {
  const client = useMemo(
    () => new SudojoClient(networkClient, baseUrl),
    [networkClient, baseUrl],
  );

  const queryFn = useCallback(async (): Promise<BaseResponse<Challenge>> => {
    return client.getRandomChallenge(token, queryParams);
  }, [client, token, queryParams]);

  // Public endpoint - no token required
  const isEnabled = options?.enabled !== undefined ? options.enabled : true;

  return useQuery({
    queryKey: queryKeys.sudojo.challengeRandom({
      level: queryParams?.level ?? undefined,
      difficulty: queryParams?.difficulty ?? undefined,
    }),
    queryFn,
    staleTime: 0, // Always fetch fresh for random
    ...options,
    enabled: isEnabled,
  });
};

/**
 * Hook to fetch a specific challenge by its UUID.
 *
 * The query is automatically disabled when no UUID is provided.
 *
 * Stale time: {@link STALE_TIMES.CHALLENGES} (5 minutes).
 *
 * @param networkClient - Network client for making HTTP requests
 * @param baseUrl - Base URL of the Sudojo API
 * @param token - Firebase access token (optional for this public endpoint)
 * @param uuid - Challenge UUID. Query is disabled if empty.
 * @param options - Additional TanStack Query options
 * @returns A UseQueryResult containing a single Challenge object
 */
export const useSudojoChallenge = (
  networkClient: NetworkClient,
  baseUrl: string,
  token: string,
  uuid: string,
  options?: Omit<
    UseQueryOptions<BaseResponse<Challenge>>,
    "queryKey" | "queryFn"
  >,
): UseQueryResult<BaseResponse<Challenge>> => {
  const client = useMemo(
    () => new SudojoClient(networkClient, baseUrl),
    [networkClient, baseUrl],
  );

  const queryFn = useCallback(async (): Promise<BaseResponse<Challenge>> => {
    return client.getChallenge(token, uuid);
  }, [client, token, uuid]);

  // Public endpoint - no token required, but uuid is required
  const isEnabled =
    !!uuid && (options?.enabled !== undefined ? options.enabled : true);

  return useQuery({
    queryKey: queryKeys.sudojo.challenge(uuid),
    queryFn,
    staleTime: STALE_TIMES.CHALLENGES,
    ...options,
    enabled: isEnabled,
  });
};

/**
 * Hook to create a new challenge. Requires admin authentication.
 *
 * On success, invalidates all challenge list queries.
 *
 * @param networkClient - Network client for making HTTP requests
 * @param baseUrl - Base URL of the Sudojo API
 * @returns A UseMutationResult. Call `mutate({ token, data })` to execute.
 */
export const useSudojoCreateChallenge = (
  networkClient: NetworkClient,
  baseUrl: string,
): UseMutationResult<
  BaseResponse<Challenge>,
  Error,
  { token: string; data: ChallengeCreateRequest }
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
      data: ChallengeCreateRequest;
    }) => {
      return client.createChallenge(token, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [...queryKeys.sudojo.all(), "challenges"],
      });
    },
  });
};

/**
 * Hook to update an existing challenge. Requires admin authentication.
 *
 * On success, invalidates all challenge list queries and the specific challenge query.
 *
 * @param networkClient - Network client for making HTTP requests
 * @param baseUrl - Base URL of the Sudojo API
 * @returns A UseMutationResult. Call `mutate({ token, uuid, data })` to execute.
 */
export const useSudojoUpdateChallenge = (
  networkClient: NetworkClient,
  baseUrl: string,
): UseMutationResult<
  BaseResponse<Challenge>,
  Error,
  { token: string; uuid: string; data: ChallengeUpdateRequest }
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
      data: ChallengeUpdateRequest;
    }) => {
      return client.updateChallenge(token, uuid, data);
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: [...queryKeys.sudojo.all(), "challenges"],
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.sudojo.challenge(variables.uuid),
      });
    },
  });
};

/**
 * Hook to delete a challenge. Requires admin authentication.
 *
 * On success, invalidates all challenge list queries and removes the specific
 * challenge from the query cache.
 *
 * @param networkClient - Network client for making HTTP requests
 * @param baseUrl - Base URL of the Sudojo API
 * @returns A UseMutationResult. Call `mutate({ token, uuid })` to execute.
 */
export const useSudojoDeleteChallenge = (
  networkClient: NetworkClient,
  baseUrl: string,
): UseMutationResult<
  BaseResponse<Challenge>,
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
      return client.deleteChallenge(token, uuid);
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: [...queryKeys.sudojo.all(), "challenges"],
      });
      queryClient.removeQueries({
        queryKey: queryKeys.sudojo.challenge(variables.uuid),
      });
    },
  });
};
