/**
 * Hook for Sudojo dailies endpoints
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
  Daily,
  DailyCreateRequest,
  DailyUpdateRequest,
} from "@sudobility/sudojo_types";
import { queryKeys } from "./query-keys";
import { STALE_TIMES } from "./query-config";
import { SudojoClient } from "../network/sudojo-client";

/**
 * Hook to fetch all daily puzzles.
 *
 * Daily puzzles are boards assigned to specific dates. This is a public endpoint.
 *
 * Stale time: {@link STALE_TIMES.DAILIES} (5 minutes).
 *
 * @param networkClient - Network client for making HTTP requests
 * @param baseUrl - Base URL of the Sudojo API
 * @param token - Firebase access token (optional for this public endpoint)
 * @param options - Additional TanStack Query options
 * @returns A UseQueryResult containing an array of Daily objects
 */
export const useSudojoDailies = (
  networkClient: NetworkClient,
  baseUrl: string,
  token: string,
  options?: Omit<
    UseQueryOptions<BaseResponse<Daily[]>>,
    "queryKey" | "queryFn"
  >,
): UseQueryResult<BaseResponse<Daily[]>> => {
  const client = useMemo(
    () => new SudojoClient(networkClient, baseUrl),
    [networkClient, baseUrl],
  );

  const queryFn = useCallback(async (): Promise<BaseResponse<Daily[]>> => {
    return client.getDailies(token);
  }, [client, token]);

  // Public endpoint - no token required
  const isEnabled = options?.enabled !== undefined ? options.enabled : true;

  return useQuery({
    queryKey: queryKeys.sudojo.dailies(),
    queryFn,
    staleTime: STALE_TIMES.DAILIES,
    ...options,
    enabled: isEnabled,
  });
};

/**
 * Hook to fetch a random daily puzzle.
 *
 * Uses `staleTime: 0` to always fetch a fresh random daily on each access.
 *
 * @param networkClient - Network client for making HTTP requests
 * @param baseUrl - Base URL of the Sudojo API
 * @param token - Firebase access token (optional for this public endpoint)
 * @param options - Additional TanStack Query options
 * @returns A UseQueryResult containing a single Daily object
 */
export const useSudojoRandomDaily = (
  networkClient: NetworkClient,
  baseUrl: string,
  token: string,
  options?: Omit<UseQueryOptions<BaseResponse<Daily>>, "queryKey" | "queryFn">,
): UseQueryResult<BaseResponse<Daily>> => {
  const client = useMemo(
    () => new SudojoClient(networkClient, baseUrl),
    [networkClient, baseUrl],
  );

  const queryFn = useCallback(async (): Promise<BaseResponse<Daily>> => {
    return client.getRandomDaily(token);
  }, [client, token]);

  // Public endpoint - no token required
  const isEnabled = options?.enabled !== undefined ? options.enabled : true;

  return useQuery({
    queryKey: queryKeys.sudojo.dailyRandom(),
    queryFn,
    staleTime: 0, // Always fetch fresh for random
    ...options,
    enabled: isEnabled,
  });
};

/**
 * Hook to fetch today's daily puzzle.
 *
 * The server determines "today" based on its timezone configuration.
 * This is the primary hook for showing the daily puzzle to users.
 *
 * Stale time: {@link STALE_TIMES.DAILIES} (5 minutes).
 *
 * @param networkClient - Network client for making HTTP requests
 * @param baseUrl - Base URL of the Sudojo API
 * @param token - Firebase access token (optional for this public endpoint)
 * @param options - Additional TanStack Query options
 * @returns A UseQueryResult containing today's Daily object
 */
export const useSudojoTodayDaily = (
  networkClient: NetworkClient,
  baseUrl: string,
  token: string,
  options?: Omit<UseQueryOptions<BaseResponse<Daily>>, "queryKey" | "queryFn">,
): UseQueryResult<BaseResponse<Daily>> => {
  const client = useMemo(
    () => new SudojoClient(networkClient, baseUrl),
    [networkClient, baseUrl],
  );

  const queryFn = useCallback(async (): Promise<BaseResponse<Daily>> => {
    return client.getTodayDaily(token);
  }, [client, token]);

  // Public endpoint - no token required
  const isEnabled = options?.enabled !== undefined ? options.enabled : true;

  return useQuery({
    queryKey: queryKeys.sudojo.dailyToday(),
    queryFn,
    staleTime: STALE_TIMES.DAILIES,
    ...options,
    enabled: isEnabled,
  });
};

/**
 * Hook to fetch a daily puzzle for a specific date.
 *
 * The query is automatically disabled when no date is provided.
 * Date must be in YYYY-MM-DD format (validated by the SudojoClient).
 *
 * Stale time: {@link STALE_TIMES.DAILIES} (5 minutes).
 *
 * @param networkClient - Network client for making HTTP requests
 * @param baseUrl - Base URL of the Sudojo API
 * @param token - Firebase access token (optional for this public endpoint)
 * @param date - Date string in YYYY-MM-DD format. Query is disabled if empty.
 * @param options - Additional TanStack Query options
 * @returns A UseQueryResult containing the Daily object for the given date
 */
export const useSudojoDailyByDate = (
  networkClient: NetworkClient,
  baseUrl: string,
  token: string,
  date: string,
  options?: Omit<UseQueryOptions<BaseResponse<Daily>>, "queryKey" | "queryFn">,
): UseQueryResult<BaseResponse<Daily>> => {
  const client = useMemo(
    () => new SudojoClient(networkClient, baseUrl),
    [networkClient, baseUrl],
  );

  const queryFn = useCallback(async (): Promise<BaseResponse<Daily>> => {
    return client.getDailyByDate(token, date);
  }, [client, token, date]);

  // Public endpoint - no token required, but date is required
  const isEnabled =
    !!date && (options?.enabled !== undefined ? options.enabled : true);

  return useQuery({
    queryKey: queryKeys.sudojo.dailyByDate(date),
    queryFn,
    staleTime: STALE_TIMES.DAILIES,
    ...options,
    enabled: isEnabled,
  });
};

/**
 * Hook to fetch a specific daily puzzle by its UUID.
 *
 * The query is automatically disabled when no UUID is provided.
 *
 * Stale time: {@link STALE_TIMES.DAILIES} (5 minutes).
 *
 * @param networkClient - Network client for making HTTP requests
 * @param baseUrl - Base URL of the Sudojo API
 * @param token - Firebase access token (optional for this public endpoint)
 * @param uuid - Daily UUID. Query is disabled if empty.
 * @param options - Additional TanStack Query options
 * @returns A UseQueryResult containing a single Daily object
 */
export const useSudojoDaily = (
  networkClient: NetworkClient,
  baseUrl: string,
  token: string,
  uuid: string,
  options?: Omit<UseQueryOptions<BaseResponse<Daily>>, "queryKey" | "queryFn">,
): UseQueryResult<BaseResponse<Daily>> => {
  const client = useMemo(
    () => new SudojoClient(networkClient, baseUrl),
    [networkClient, baseUrl],
  );

  const queryFn = useCallback(async (): Promise<BaseResponse<Daily>> => {
    return client.getDaily(token, uuid);
  }, [client, token, uuid]);

  // Public endpoint - no token required, but uuid is required
  const isEnabled =
    !!uuid && (options?.enabled !== undefined ? options.enabled : true);

  return useQuery({
    queryKey: queryKeys.sudojo.daily(uuid),
    queryFn,
    staleTime: STALE_TIMES.DAILIES,
    ...options,
    enabled: isEnabled,
  });
};

/**
 * Hook to create a new daily puzzle. Requires admin authentication.
 *
 * On success, invalidates all daily list queries so the UI reflects the new daily.
 *
 * @param networkClient - Network client for making HTTP requests
 * @param baseUrl - Base URL of the Sudojo API
 * @returns A UseMutationResult. Call `mutate({ token, data })` to execute.
 */
export const useSudojoCreateDaily = (
  networkClient: NetworkClient,
  baseUrl: string,
): UseMutationResult<
  BaseResponse<Daily>,
  Error,
  { token: string; data: DailyCreateRequest }
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
      data: DailyCreateRequest;
    }) => {
      return client.createDaily(token, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [...queryKeys.sudojo.all(), "dailies"],
      });
    },
  });
};

/**
 * Hook to update an existing daily puzzle. Requires admin authentication.
 *
 * On success, invalidates all daily list queries and the specific daily query.
 *
 * @param networkClient - Network client for making HTTP requests
 * @param baseUrl - Base URL of the Sudojo API
 * @returns A UseMutationResult. Call `mutate({ token, uuid, data })` to execute.
 */
export const useSudojoUpdateDaily = (
  networkClient: NetworkClient,
  baseUrl: string,
): UseMutationResult<
  BaseResponse<Daily>,
  Error,
  { token: string; uuid: string; data: DailyUpdateRequest }
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
      data: DailyUpdateRequest;
    }) => {
      return client.updateDaily(token, uuid, data);
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: [...queryKeys.sudojo.all(), "dailies"],
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.sudojo.daily(variables.uuid),
      });
    },
  });
};

/**
 * Hook to delete a daily puzzle. Requires admin authentication.
 *
 * On success, invalidates all daily list queries and removes the specific
 * daily from the query cache.
 *
 * @param networkClient - Network client for making HTTP requests
 * @param baseUrl - Base URL of the Sudojo API
 * @returns A UseMutationResult. Call `mutate({ token, uuid })` to execute.
 */
export const useSudojoDeleteDaily = (
  networkClient: NetworkClient,
  baseUrl: string,
): UseMutationResult<
  BaseResponse<Daily>,
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
      return client.deleteDaily(token, uuid);
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: [...queryKeys.sudojo.all(), "dailies"],
      });
      queryClient.removeQueries({
        queryKey: queryKeys.sudojo.daily(variables.uuid),
      });
    },
  });
};
