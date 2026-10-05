import { describe, expect, it, vi } from "vitest";
import { createAuthenticatedFetchClient } from "../fetch-network-client";

function jsonResponse(status: number, body: unknown) {
  return new Response(JSON.stringify(body), {
    status,
    statusText: status === 200 ? "OK" : "Error",
    headers: { "Content-Type": "application/json" },
  });
}

describe("createAuthenticatedFetchClient", () => {
  it("injects the bearer token and returns the parsed body", async () => {
    const fetchMock = vi.fn(async () => jsonResponse(200, { success: true }));
    const client = createAuthenticatedFetchClient({
      getToken: () => "tok",
      fetch: fetchMock as unknown as typeof fetch,
    });

    const result = await client.post("https://api/x", { a: 1 });

    expect(result.ok).toBe(true);
    expect(result.data).toEqual({ success: true });
    const [url, init] = fetchMock.mock.calls[0] as unknown as [
      string,
      RequestInit,
    ];
    expect(url).toBe("https://api/x");
    expect(init.method).toBe("POST");
    expect(init.body).toBe('{"a":1}');
    expect((init.headers as Record<string, string>).Authorization).toBe(
      "Bearer tok",
    );
  });

  it("sends no Authorization header without a token", async () => {
    const fetchMock = vi.fn(async () => jsonResponse(200, {}));
    const client = createAuthenticatedFetchClient({
      getToken: () => null,
      fetch: fetchMock as unknown as typeof fetch,
    });
    await client.get("https://api/x");
    const init = (
      fetchMock.mock.calls[0] as unknown as [string, RequestInit]
    )[1];
    expect(
      (init.headers as Record<string, string>).Authorization,
    ).toBeUndefined();
  });

  it("refreshes the token and retries once on 401", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse(401, { error: "expired" }))
      .mockResolvedValueOnce(jsonResponse(200, { ok: 1 }));
    const refreshToken = vi.fn(async () => "fresh");
    const client = createAuthenticatedFetchClient({
      getToken: () => "stale",
      refreshToken,
      fetch: fetchMock as unknown as typeof fetch,
    });

    const result = await client.get("https://api/x");

    expect(refreshToken).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    const retry = (
      fetchMock.mock.calls[1] as unknown as [string, RequestInit]
    )[1];
    expect((retry.headers as Record<string, string>).Authorization).toBe(
      "Bearer fresh",
    );
    expect(result.status).toBe(200);
  });

  it("calls onForbidden on 403 and resolves with the error", async () => {
    const onForbidden = vi.fn();
    const client = createAuthenticatedFetchClient({
      getToken: () => "tok",
      onForbidden,
      fetch: vi.fn(async () =>
        jsonResponse(403, { error: "nope" }),
      ) as unknown as typeof fetch,
    });

    const result = await client.delete("https://api/x");

    expect(onForbidden).toHaveBeenCalledTimes(1);
    expect(result.ok).toBe(false);
    expect(result.error).toBe("nope");
  });
});
