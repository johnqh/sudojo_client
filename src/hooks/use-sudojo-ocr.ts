/**
 * Hook for the Sudojo OCR endpoint
 */

import { useMemo } from "react";
import { useMutation, UseMutationResult } from "@tanstack/react-query";
import type { NetworkClient } from "@sudobility/types";
import type { BaseResponse, OCRExtractData } from "@sudobility/sudojo_types";
import { SudojoClient } from "../network/sudojo-client";

/** Arguments for one OCR extraction. */
export interface OcrExtractVariables {
  token: string;
  /** The image as base64, with or without a `data:` URL prefix. */
  image: string;
  /** Request timeout in ms (default 60000). */
  timeout?: number;
}

/**
 * Hook to read a Sudoku board from a photo or screenshot.
 *
 * Recognition happens server-side: `sudojo_api` calls the sudojo_ocr_ml model
 * service and falls back to its own Tesseract pipeline, so no client bundles an
 * OCR engine. A board with too few digits comes back as a 422 rather than a
 * guess.
 *
 * There is nothing to cache or invalidate - each call reads a different image -
 * so this is a mutation.
 *
 * @param networkClient - Network client for making HTTP requests
 * @param baseUrl - Base URL of the Sudojo API (e.g. "https://api.sudojo.com")
 * @returns A UseMutationResult whose data is the recognized board
 *
 * @example
 * ```tsx
 * const ocr = useSudojoOcrExtract(networkClient, baseUrl);
 * const result = await ocr.mutateAsync({ token, image: dataUrl });
 * setBoard(result.data.board.original);
 * ```
 */
export const useSudojoOcrExtract = (
  networkClient: NetworkClient,
  baseUrl: string,
): UseMutationResult<
  BaseResponse<OCRExtractData>,
  Error,
  OcrExtractVariables
> => {
  const client = useMemo(
    () => new SudojoClient(networkClient, baseUrl),
    [networkClient, baseUrl],
  );

  return useMutation({
    mutationFn: async ({ token, image, timeout }: OcrExtractVariables) =>
      client.extractOcr(token, image, { timeout }),
  });
};
