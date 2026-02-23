/**
 * Hook for Sudojo users endpoints
 */

import { useCallback, useMemo } from "react";
import {
  useQuery,
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
import { SudojoClient } from "../network/sudojo-client";

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
    return client.getUserSubscription(token, userId);
  }, [client, token, userId]);

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
