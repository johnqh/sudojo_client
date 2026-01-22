/**
 * Hook for Sudojo techniques endpoints
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
  Technique,
  TechniqueCreateRequest,
  TechniqueQueryParams,
  TechniqueUpdateRequest,
} from "@sudobility/sudojo_types";
import { queryKeys } from "./query-keys";
import { STALE_TIMES } from "./query-config";
import { SudojoClient } from "../network/sudojo-client";

/**
 * Hook to get all techniques with optional filtering
 */
export const useSudojoTechniques = (
  networkClient: NetworkClient,
  baseUrl: string,
  token: string,
  queryParams?: TechniqueQueryParams,
  options?: Omit<
    UseQueryOptions<BaseResponse<Technique[]>>,
    "queryKey" | "queryFn"
  >,
): UseQueryResult<BaseResponse<Technique[]>> => {
  const client = useMemo(
    () => new SudojoClient(networkClient, baseUrl),
    [networkClient, baseUrl],
  );

  const queryFn = useCallback(async (): Promise<BaseResponse<Technique[]>> => {
    return client.getTechniques(token, queryParams);
  }, [client, token, queryParams]);

  // Public endpoint - no token required
  const isEnabled = options?.enabled !== undefined ? options.enabled : true;

  return useQuery({
    queryKey: queryKeys.sudojo.techniques({
      level_uuid: queryParams?.level_uuid ?? undefined,
    }),
    queryFn,
    staleTime: STALE_TIMES.TECHNIQUES,
    ...options,
    enabled: isEnabled,
  });
};

/**
 * Hook to get a specific technique by UUID
 */
export const useSudojoTechnique = (
  networkClient: NetworkClient,
  baseUrl: string,
  token: string,
  uuid: string,
  options?: Omit<
    UseQueryOptions<BaseResponse<Technique>>,
    "queryKey" | "queryFn"
  >,
): UseQueryResult<BaseResponse<Technique>> => {
  const client = useMemo(
    () => new SudojoClient(networkClient, baseUrl),
    [networkClient, baseUrl],
  );

  const queryFn = useCallback(async (): Promise<BaseResponse<Technique>> => {
    return client.getTechnique(token, uuid);
  }, [client, token, uuid]);

  // Public endpoint - no token required, but uuid is required
  const isEnabled =
    !!uuid && (options?.enabled !== undefined ? options.enabled : true);

  return useQuery({
    queryKey: queryKeys.sudojo.technique(uuid),
    queryFn,
    staleTime: STALE_TIMES.TECHNIQUES,
    ...options,
    enabled: isEnabled,
  });
};

/**
 * Hook to create a technique
 */
export const useSudojoCreateTechnique = (
  networkClient: NetworkClient,
  baseUrl: string,
): UseMutationResult<
  BaseResponse<Technique>,
  Error,
  { token: string; data: TechniqueCreateRequest }
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
      data: TechniqueCreateRequest;
    }) => {
      return client.createTechnique(token, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [...queryKeys.sudojo.all(), "techniques"],
      });
    },
  });
};

/**
 * Hook to update a technique
 */
export const useSudojoUpdateTechnique = (
  networkClient: NetworkClient,
  baseUrl: string,
): UseMutationResult<
  BaseResponse<Technique>,
  Error,
  { token: string; uuid: string; data: TechniqueUpdateRequest }
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
      data: TechniqueUpdateRequest;
    }) => {
      return client.updateTechnique(token, uuid, data);
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: [...queryKeys.sudojo.all(), "techniques"],
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.sudojo.technique(variables.uuid),
      });
    },
  });
};

/**
 * Hook to delete a technique
 */
export const useSudojoDeleteTechnique = (
  networkClient: NetworkClient,
  baseUrl: string,
): UseMutationResult<
  BaseResponse<Technique>,
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
      return client.deleteTechnique(token, uuid);
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: [...queryKeys.sudojo.all(), "techniques"],
      });
      queryClient.removeQueries({
        queryKey: queryKeys.sudojo.technique(variables.uuid),
      });
    },
  });
};
