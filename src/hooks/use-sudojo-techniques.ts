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
import type { BaseResponse, NetworkClient } from "@sudobility/types";
import type {
  Technique,
  TechniqueCreateRequest,
  TechniqueQueryParams,
  TechniqueUpdateRequest,
} from "@sudobility/sudojo_types";
import { queryKeys } from "./query-keys";
import { STALE_TIMES } from "./query-config";
import { SudojoClient } from "../network/sudojo-client";
import type { SudojoAuth, SudojoConfig } from "../network/sudojo-client";

/**
 * Hook to get all techniques with optional filtering
 */
export const useSudojoTechniques = (
  networkClient: NetworkClient,
  config: SudojoConfig,
  queryParams?: TechniqueQueryParams,
  options?: Omit<
    UseQueryOptions<BaseResponse<Technique[]>>,
    "queryKey" | "queryFn"
  >,
): UseQueryResult<BaseResponse<Technique[]>> => {
  const client = useMemo(
    () => new SudojoClient(networkClient, config),
    [networkClient, config],
  );

  const queryFn = useCallback(async (): Promise<BaseResponse<Technique[]>> => {
    return client.getTechniques(queryParams);
  }, [client, queryParams]);

  return useQuery({
    queryKey: queryKeys.sudojo.techniques({
      level_uuid: queryParams?.level_uuid ?? undefined,
    }),
    queryFn,
    staleTime: STALE_TIMES.TECHNIQUES,
    ...options,
  });
};

/**
 * Hook to get a specific technique by UUID
 */
export const useSudojoTechnique = (
  networkClient: NetworkClient,
  config: SudojoConfig,
  uuid: string,
  options?: Omit<
    UseQueryOptions<BaseResponse<Technique>>,
    "queryKey" | "queryFn"
  >,
): UseQueryResult<BaseResponse<Technique>> => {
  const client = useMemo(
    () => new SudojoClient(networkClient, config),
    [networkClient, config],
  );

  const queryFn = useCallback(async (): Promise<BaseResponse<Technique>> => {
    return client.getTechnique(uuid);
  }, [client, uuid]);

  return useQuery({
    queryKey: queryKeys.sudojo.technique(uuid),
    queryFn,
    staleTime: STALE_TIMES.TECHNIQUES,
    enabled: !!uuid,
    ...options,
  });
};

/**
 * Hook to create a technique
 */
export const useSudojoCreateTechnique = (
  networkClient: NetworkClient,
  config: SudojoConfig,
): UseMutationResult<
  BaseResponse<Technique>,
  Error,
  { auth: SudojoAuth; data: TechniqueCreateRequest }
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
      data: TechniqueCreateRequest;
    }) => {
      return client.createTechnique(auth, data);
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
  config: SudojoConfig,
): UseMutationResult<
  BaseResponse<Technique>,
  Error,
  { auth: SudojoAuth; uuid: string; data: TechniqueUpdateRequest }
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
      data: TechniqueUpdateRequest;
    }) => {
      return client.updateTechnique(auth, uuid, data);
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
  config: SudojoConfig,
): UseMutationResult<
  BaseResponse<null>,
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
      return client.deleteTechnique(auth, uuid);
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
