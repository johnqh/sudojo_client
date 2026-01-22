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
 * Hook to get all dailies
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
 * Hook to get a random daily
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
 * Hook to get today's daily puzzle
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
 * Hook to get daily puzzle by date
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
 * Hook to get a specific daily by UUID
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
 * Hook to create a daily puzzle
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
 * Hook to update a daily puzzle
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
 * Hook to delete a daily puzzle
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
