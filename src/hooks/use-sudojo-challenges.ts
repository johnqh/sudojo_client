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
import type { SudojoAuth, SudojoConfig } from "../network/sudojo-client";

/**
 * Hook to get all challenges with optional filtering
 */
export const useSudojoChallenges = (
  networkClient: NetworkClient,
  config: SudojoConfig,
  auth: SudojoAuth,
  queryParams?: ChallengeQueryParams,
  options?: Omit<
    UseQueryOptions<BaseResponse<Challenge[]>>,
    "queryKey" | "queryFn"
  >,
): UseQueryResult<BaseResponse<Challenge[]>> => {
  const client = useMemo(
    () => new SudojoClient(networkClient, config),
    [networkClient, config],
  );

  const queryFn = useCallback(async (): Promise<BaseResponse<Challenge[]>> => {
    return client.getChallenges(auth, queryParams);
  }, [client, auth, queryParams]);

  return useQuery({
    queryKey: queryKeys.sudojo.challenges({
      level_uuid: queryParams?.level_uuid ?? undefined,
      difficulty: queryParams?.difficulty ?? undefined,
    }),
    queryFn,
    staleTime: STALE_TIMES.CHALLENGES,
    enabled: !!auth?.accessToken,
    ...options,
  });
};

/**
 * Hook to get a random challenge with optional filtering
 */
export const useSudojoRandomChallenge = (
  networkClient: NetworkClient,
  config: SudojoConfig,
  auth: SudojoAuth,
  queryParams?: ChallengeQueryParams,
  options?: Omit<
    UseQueryOptions<BaseResponse<Challenge>>,
    "queryKey" | "queryFn"
  >,
): UseQueryResult<BaseResponse<Challenge>> => {
  const client = useMemo(
    () => new SudojoClient(networkClient, config),
    [networkClient, config],
  );

  const queryFn = useCallback(async (): Promise<BaseResponse<Challenge>> => {
    return client.getRandomChallenge(auth, queryParams);
  }, [client, auth, queryParams]);

  return useQuery({
    queryKey: queryKeys.sudojo.challengeRandom({
      level_uuid: queryParams?.level_uuid ?? undefined,
      difficulty: queryParams?.difficulty ?? undefined,
    }),
    queryFn,
    staleTime: 0, // Always fetch fresh for random
    enabled: !!auth?.accessToken,
    ...options,
  });
};

/**
 * Hook to get a specific challenge by UUID
 */
export const useSudojoChallenge = (
  networkClient: NetworkClient,
  config: SudojoConfig,
  auth: SudojoAuth,
  uuid: string,
  options?: Omit<
    UseQueryOptions<BaseResponse<Challenge>>,
    "queryKey" | "queryFn"
  >,
): UseQueryResult<BaseResponse<Challenge>> => {
  const client = useMemo(
    () => new SudojoClient(networkClient, config),
    [networkClient, config],
  );

  const queryFn = useCallback(async (): Promise<BaseResponse<Challenge>> => {
    return client.getChallenge(auth, uuid);
  }, [client, auth, uuid]);

  return useQuery({
    queryKey: queryKeys.sudojo.challenge(uuid),
    queryFn,
    staleTime: STALE_TIMES.CHALLENGES,
    enabled: !!uuid && !!auth?.accessToken,
    ...options,
  });
};

/**
 * Hook to create a challenge
 */
export const useSudojoCreateChallenge = (
  networkClient: NetworkClient,
  config: SudojoConfig,
): UseMutationResult<
  BaseResponse<Challenge>,
  Error,
  { auth: SudojoAuth; data: ChallengeCreateRequest }
> => {
  const client = useMemo(
    () => new SudojoClient(networkClient, config),
    [networkClient, config],
  );
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      auth,
      data,
    }: {
      auth: SudojoAuth;
      data: ChallengeCreateRequest;
    }) => {
      return client.createChallenge(auth, data);
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
  config: SudojoConfig,
): UseMutationResult<
  BaseResponse<Challenge>,
  Error,
  { auth: SudojoAuth; uuid: string; data: ChallengeUpdateRequest }
> => {
  const client = useMemo(
    () => new SudojoClient(networkClient, config),
    [networkClient, config],
  );
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      auth,
      uuid,
      data,
    }: {
      auth: SudojoAuth;
      uuid: string;
      data: ChallengeUpdateRequest;
    }) => {
      return client.updateChallenge(auth, uuid, data);
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
  config: SudojoConfig,
): UseMutationResult<
  BaseResponse<Challenge>,
  Error,
  { auth: SudojoAuth; uuid: string }
> => {
  const client = useMemo(
    () => new SudojoClient(networkClient, config),
    [networkClient, config],
  );
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ auth, uuid }: { auth: SudojoAuth; uuid: string }) => {
      return client.deleteChallenge(auth, uuid);
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
