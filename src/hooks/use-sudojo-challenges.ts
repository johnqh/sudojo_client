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
 * Hook to get all challenges with optional filtering
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
 * Hook to get a random challenge with optional filtering
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
 * Hook to get a specific challenge by UUID
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
 * Hook to create a challenge
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
 * Hook to update a challenge
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
 * Hook to delete a challenge
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
