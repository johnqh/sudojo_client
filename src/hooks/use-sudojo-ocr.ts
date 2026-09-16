/**
 * Hook for the Sudojo OCR endpoint
 */

import { useMemo } from "react";
import { useMutation, UseMutationResult } from "@tanstack/react-query";
import type { NetworkClient } from "@sudobility/types";
import type {
  BaseResponse,
  OCRExtractData,
  OcrSource,
} from "@sudobility/sudojo_types";
import { SudojoClient } from "../network/sudojo-client";

/** Arguments for one OCR extraction. */
export interface OcrExtractVariables {
  token: string;
  /** The image as base64, with or without a `data:` URL prefix. */
  image: string;
  /**
   * Where the image came from. Camera captures go straight to paddle_ocr;
   * everything else prefers the whole-board model. Defaults to "library".
   */
  source?: OcrSource;
  /** Request timeout in ms (default 60000). */
  timeout?: number;
}

/**
 * Hook to read a Sudoku board from a photo or screenshot.
 *
 * Recognition happens server-side: `sudojo_api` dispatches to the sudojo_ocr_ml
 * model service or paddle_ocr by image source, so no client bundles an OCR
 * engine. A board with too few digits comes back as an error rather than a
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
    mutationFn: async ({
      token,
      image,
      source,
      timeout,
    }: OcrExtractVariables) =>
      client.extractOcr(token, image, { source, timeout }),
  });
};
