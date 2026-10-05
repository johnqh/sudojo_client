/**
 * Hook for Sudojo users endpoints
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
import type { NetworkClient, UserInfoResponse } from "@sudobility/types";
import type {
  BaseResponse,
  SubscriptionResult,
} from "@sudobility/sudojo_types";
import { queryKeys } from "./query-keys";
import { STALE_TIMES } from "./query-config";
import {
  type DeletedData,
  type DeleteUserRequest,
  SudojoClient,
} from "../network/sudojo-client";

/**
 * Hook to fetch user info including admin status.
 *
 * **Requires Firebase authentication.** The userId must match the
 * authenticated user's Firebase UID. The query is automatically disabled
 * when either token or userId is empty.
 *
 * Disables `refetchOnWindowFocus` to avoid unnecessary refetches since
 * admin status rarely changes.
 *
 * Stale time: {@link STALE_TIMES.USER} (5 minutes).
 *
 * @param networkClient - Network client for making HTTP requests
 * @param baseUrl - Base URL of the Sudojo API
 * @param token - Firebase access token (required)
 * @param userId - Firebase UID of the user to query
 * @param options - Additional TanStack Query options
 * @returns A UseQueryResult containing the UserInfoResponse
 */
export const useSudojoUser = (
  networkClient: NetworkClient,
  baseUrl: string,
  token: string,
  userId: string,
  options?: Omit<
    UseQueryOptions<BaseResponse<UserInfoResponse>>,
    "queryKey" | "queryFn"
  >,
): UseQueryResult<BaseResponse<UserInfoResponse>> => {
  const client = useMemo(
    () => new SudojoClient(networkClient, baseUrl),
    [networkClient, baseUrl],
  );

  const queryFn = useCallback(async (): Promise<
    BaseResponse<UserInfoResponse>
  > => {
    return client.getUser(token, userId);
  }, [client, token, userId]);

  const isEnabled =
    !!userId &&
    !!token &&
    (options?.enabled !== undefined ? options.enabled : true);

  return useQuery({
    queryKey: queryKeys.sudojo.user(userId),
    queryFn,
    staleTime: STALE_TIMES.USER,
    refetchOnWindowFocus: false,
    ...options,
    enabled: isEnabled,
  });
};

/**
 * Hook to fetch user subscription status (via RevenueCat integration).
 *
 * **Requires Firebase authentication.** The query is automatically disabled
 * when either token or userId is empty. Uses a shorter stale time since
 * subscription status may change via in-app purchase flows.
 *
 * Stale time: {@link STALE_TIMES.USER_SUBSCRIPTION} (2 minutes).
 *
 * @param networkClient - Network client for making HTTP requests
 * @param baseUrl - Base URL of the Sudojo API
 * @param token - Firebase access token (required)
 * @param userId - Firebase UID of the user to query
 * @param options - Additional TanStack Query options
 * @returns A UseQueryResult containing the SubscriptionResult
 */
export const useSudojoUserSubscription = (
  networkClient: NetworkClient,
  baseUrl: string,
  token: string,
  userId: string,
  testMode?: boolean,
  options?: Omit<
    UseQueryOptions<BaseResponse<SubscriptionResult>>,
    "queryKey" | "queryFn"
  >,
): UseQueryResult<BaseResponse<SubscriptionResult>> => {
  const client = useMemo(
    () => new SudojoClient(networkClient, baseUrl),
    [networkClient, baseUrl],
  );

  const queryFn = useCallback(async (): Promise<
    BaseResponse<SubscriptionResult>
  > => {
    return client.getUserSubscription(token, userId, testMode);
  }, [client, token, userId, testMode]);

  const isEnabled =
    !!userId &&
    !!token &&
    (options?.enabled !== undefined ? options.enabled : true);

  return useQuery({
    queryKey: queryKeys.sudojo.userSubscription(userId),
    queryFn,
    staleTime: STALE_TIMES.USER_SUBSCRIPTION,
    ...options,
    enabled: isEnabled,
  });
};

/** Arguments for one account deletion. */
export interface DeleteUserVariables {
  /** Firebase ID token of the user being deleted (required). */
  token: string;
  /** Firebase UID. Must match the token's user, or the API returns 403. */
  userId: string;
  /** Optional OAuth tokens for the API to revoke while deleting. */
  providerTokens?: DeleteUserRequest | undefined;
}

/**
 * Hook to delete the signed-in user's account (`DELETE /api/v1/users/:userId`).
 *
 * **Requires Firebase authentication.** The API refuses while a subscription
 * is active (409) and for an already deleted account (410); the mutation then
 * rejects with the API's message. On success the API has marked the account
 * deleted, revoked any `providerTokens`, and deleted the Firebase user
 * server-side (Firebase Admin), so no client-side Firebase deletion is needed.
 * This replaces `@sudobility/auth_lib`'s `deleteAccount`, which makes the same
 * request (it sends no token of its own and relies on an authenticated
 * `NetworkClient`) and does nothing else.
 *
 * Callers still need to sign out locally afterwards (e.g. auth_lib / Firebase
 * `signOut()`), because the local Firebase session is not cleared by the
 * server-side deletion.
 *
 * On success, removes every cached query for this user and the user's
 * gamification stats and point history.
 *
 * @param networkClient - Network client for making HTTP requests
 * @param baseUrl - Base URL of the Sudojo API
 * @returns A UseMutationResult. Call `mutateAsync({ token, userId })`.
 */
export const useSudojoDeleteUser = (
  networkClient: NetworkClient,
  baseUrl: string,
): UseMutationResult<BaseResponse<DeletedData>, Error, DeleteUserVariables> => {
  const client = useMemo(
    () => new SudojoClient(networkClient, baseUrl),
    [networkClient, baseUrl],
  );
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      token,
      userId,
      providerTokens,
    }: DeleteUserVariables) => client.deleteUser(token, userId, providerTokens),
    onSuccess: (_data, variables) => {
      queryClient.removeQueries({
        queryKey: [...queryKeys.sudojo.all(), "users", variables.userId],
      });
      queryClient.removeQueries({
        queryKey: queryKeys.sudojo.gamificationStats(),
      });
      queryClient.removeQueries({
        queryKey: [...queryKeys.sudojo.all(), "gamification", "history"],
      });
    },
  });
};
