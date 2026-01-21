/**
 * Hook for Sudojo users endpoints
 */

import { useCallback, useMemo } from "react";
import {
  useQuery,
  UseQueryOptions,
  UseQueryResult,
} from "@tanstack/react-query";
import type { NetworkClient } from "@sudobility/types";
import type {
  BaseResponse,
  SubscriptionResult,
} from "@sudobility/sudojo_types";
import { queryKeys } from "./query-keys";
import { STALE_TIMES } from "./query-config";
import { SudojoClient } from "../network/sudojo-client";

/**
 * Hook to get user subscription status
 *
 * Note: This endpoint requires Firebase authentication.
 * The userId must match the authenticated user's Firebase UID.
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
