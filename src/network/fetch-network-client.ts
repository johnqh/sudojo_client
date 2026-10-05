/**
 * A fetch-based NetworkClient with Firebase-style bearer auth.
 *
 * For hosts that have no NetworkClient of their own (the web app gets one from
 * building_blocks; sudojo_app_rn builds this one from its Firebase JS SDK
 * session). It injects the ID token, force-refreshes it and retries once on a
 * 401, and calls `onForbidden` (sign out) on a 403. Non-2xx responses resolve
 * with `ok: false` rather than throwing.
 */

import type {
  NetworkClient,
  NetworkRequestOptions,
  NetworkResponse,
  Optional,
} from "@sudobility/types";

export interface AuthenticatedFetchClientOptions {
  /** The current ID token, read at request time. */
  getToken: () => string | null | undefined;
  /** Force-refresh the token; null when there is no session. Used on a 401. */
  refreshToken?: () => Promise<string | null | undefined>;
  /** Called after a 403 response (e.g. sign out). */
  onForbidden?: () => Promise<void> | void;
  /** Override for tests or non-global fetch. Defaults to `globalThis.fetch`. */
  fetch?: typeof fetch;
}

async function send<T>(
  doFetch: typeof fetch,
  url: string,
  options: Optional<NetworkRequestOptions> | undefined,
  token: string | null | undefined,
): Promise<NetworkResponse<T>> {
  const authHeaders: Record<string, string> = {};
  if (token && !options?.headers?.Authorization) {
    authHeaders.Authorization = `Bearer ${token}`;
  }

  const response = await doFetch(url, {
    method: options?.method ?? "GET",
    headers: {
      "Content-Type": "application/json",
      ...authHeaders,
      ...options?.headers,
    },
    body: (options?.body as BodyInit | undefined) ?? null,
    signal: options?.signal ?? null,
  });

  const headers: Record<string, string> = {};
  response.headers.forEach((value, key) => {
    headers[key] = value;
  });

  let data: T | undefined;
  let error: string | undefined;
  try {
    const json = await response.json();
    if (response.ok) {
      data = json as T;
    } else {
      error = json.error || json.message || `HTTP ${response.status}`;
    }
  } catch {
    if (!response.ok) {
      error = `HTTP ${response.status}: ${response.statusText}`;
    }
  }

  return {
    success: response.ok,
    data,
    error,
    timestamp: new Date().toISOString(),
    ok: response.ok,
    status: response.status,
    statusText: response.statusText,
    headers,
  };
}

/** Build the client. Options are read on every request, so pass stable getters. */
export function createAuthenticatedFetchClient(
  options: AuthenticatedFetchClientOptions,
): NetworkClient {
  const request = async <T>(
    url: string,
    requestOptions?: Optional<NetworkRequestOptions>,
  ): Promise<NetworkResponse<T>> => {
    const doFetch = options.fetch ?? globalThis.fetch;
    let result = await send<T>(
      doFetch,
      url,
      requestOptions,
      options.getToken(),
    );

    if (result.status === 401 && options.refreshToken) {
      const freshToken = await options.refreshToken();
      if (freshToken) {
        result = await send<T>(
          doFetch,
          url,
          {
            ...requestOptions,
            headers: {
              ...requestOptions?.headers,
              Authorization: `Bearer ${freshToken}`,
            },
          },
          freshToken,
        );
      }
    }

    if (result.status === 403) {
      await options.onForbidden?.();
    }

    return result;
  };

  const withBody = (body?: Optional<unknown>) =>
    body ? JSON.stringify(body) : undefined;

  return {
    request,
    get: (url, opts) => request(url, { ...opts, method: "GET" }),
    post: (url, body, opts) =>
      request(url, { ...opts, method: "POST", body: withBody(body) }),
    put: (url, body, opts) =>
      request(url, { ...opts, method: "PUT", body: withBody(body) }),
    delete: (url, opts) => request(url, { ...opts, method: "DELETE" }),
  };
}
