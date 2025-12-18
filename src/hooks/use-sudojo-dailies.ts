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
import type { SudojoAuth, SudojoConfig } from "../network/sudojo-client";

/**
 * Hook to get all dailies
 */
export const useSudojoDailies = (
  networkClient: NetworkClient,
  config: SudojoConfig,
  auth: SudojoAuth,
  options?: Omit<
    UseQueryOptions<BaseResponse<Daily[]>>,
    "queryKey" | "queryFn"
  >,
): UseQueryResult<BaseResponse<Daily[]>> => {
  const client = useMemo(
    () => new SudojoClient(networkClient, config),
    [networkClient, config],
  );

  const accessToken = auth?.accessToken;

  const queryFn = useCallback(async (): Promise<BaseResponse<Daily[]>> => {
    return client.getDailies({ accessToken: accessToken ?? "" });
  }, [client, accessToken]);

  const isEnabled =
    !!accessToken && (options?.enabled !== undefined ? options.enabled : true);

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
  config: SudojoConfig,
  auth: SudojoAuth,
  options?: Omit<UseQueryOptions<BaseResponse<Daily>>, "queryKey" | "queryFn">,
): UseQueryResult<BaseResponse<Daily>> => {
  const client = useMemo(
    () => new SudojoClient(networkClient, config),
    [networkClient, config],
  );

  const accessToken = auth?.accessToken;

  const queryFn = useCallback(async (): Promise<BaseResponse<Daily>> => {
    return client.getRandomDaily({ accessToken: accessToken ?? "" });
  }, [client, accessToken]);

  const isEnabled =
    !!accessToken && (options?.enabled !== undefined ? options.enabled : true);

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
  config: SudojoConfig,
  auth: SudojoAuth,
  options?: Omit<UseQueryOptions<BaseResponse<Daily>>, "queryKey" | "queryFn">,
): UseQueryResult<BaseResponse<Daily>> => {
  const client = useMemo(
    () => new SudojoClient(networkClient, config),
    [networkClient, config],
  );

  const accessToken = auth?.accessToken;

  const queryFn = useCallback(async (): Promise<BaseResponse<Daily>> => {
    return client.getTodayDaily({ accessToken: accessToken ?? "" });
  }, [client, accessToken]);

  const isEnabled =
    !!accessToken && (options?.enabled !== undefined ? options.enabled : true);

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
  config: SudojoConfig,
  auth: SudojoAuth,
  date: string,
  options?: Omit<UseQueryOptions<BaseResponse<Daily>>, "queryKey" | "queryFn">,
): UseQueryResult<BaseResponse<Daily>> => {
  const client = useMemo(
    () => new SudojoClient(networkClient, config),
    [networkClient, config],
  );

  const accessToken = auth?.accessToken;

  const queryFn = useCallback(async (): Promise<BaseResponse<Daily>> => {
    return client.getDailyByDate({ accessToken: accessToken ?? "" }, date);
  }, [client, accessToken, date]);

  const isEnabled =
    !!date &&
    !!accessToken &&
    (options?.enabled !== undefined ? options.enabled : true);

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
  config: SudojoConfig,
  auth: SudojoAuth,
  uuid: string,
  options?: Omit<UseQueryOptions<BaseResponse<Daily>>, "queryKey" | "queryFn">,
): UseQueryResult<BaseResponse<Daily>> => {
  const client = useMemo(
    () => new SudojoClient(networkClient, config),
    [networkClient, config],
  );

  const accessToken = auth?.accessToken;

  const queryFn = useCallback(async (): Promise<BaseResponse<Daily>> => {
    return client.getDaily({ accessToken: accessToken ?? "" }, uuid);
  }, [client, accessToken, uuid]);

  const isEnabled =
    !!uuid &&
    !!accessToken &&
    (options?.enabled !== undefined ? options.enabled : true);

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
  config: SudojoConfig,
): UseMutationResult<
  BaseResponse<Daily>,
  Error,
  { auth: SudojoAuth; data: DailyCreateRequest }
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
      data: DailyCreateRequest;
    }) => {
      return client.createDaily(auth, data);
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
  config: SudojoConfig,
): UseMutationResult<
  BaseResponse<Daily>,
  Error,
  { auth: SudojoAuth; uuid: string; data: DailyUpdateRequest }
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
      data: DailyUpdateRequest;
    }) => {
      return client.updateDaily(auth, uuid, data);
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
  config: SudojoConfig,
): UseMutationResult<
  BaseResponse<Daily>,
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
      return client.deleteDaily(auth, uuid);
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
