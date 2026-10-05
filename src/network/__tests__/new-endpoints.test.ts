import { beforeEach, describe, expect, it } from "vitest";
import { MockNetworkClient } from "@sudobility/di/mocks";
import { SudojoClient } from "../sudojo-client";

const TOKEN = "test-token-123";
const BASE_URL = "https://test-sudojo.example.com";
const UUID = "12345678-1234-1234-1234-123456789abc";
const OK = { success: true, data: {}, timestamp: "2026-01-01T00:00:00Z" };

describe("SudojoClient endpoints added for hook coverage", () => {
  let net: MockNetworkClient;
  let client: SudojoClient;

  const last = () => {
    const req = net.getLastRequest();
    expect(req).toBeDefined();
    return req!;
  };
  const lastBody = (): unknown => {
    const body = last().body;
    expect(typeof body).toBe("string");
    return JSON.parse(body as string);
  };
  const lastAuth = () =>
    (last().options?.headers as Record<string, string> | undefined)?.[
      "Authorization"
    ];

  beforeEach(() => {
    net = new MockNetworkClient();
    net.setDefaultResponse({ data: OK });
    client = new SudojoClient(net, BASE_URL);
  });

  describe("techniques", () => {
    it("getTechniqueByPath GETs /techniques/path/:path", async () => {
      await client.getTechniqueByPath(TOKEN, "naked-single");
      expect(last().method).toBe("GET");
      expect(last().url).toBe(
        `${BASE_URL}/api/v1/techniques/path/naked-single`,
      );
    });

    it("getTechniqueByPath encodes the path and rejects an empty one", async () => {
      await client.getTechniqueByPath(TOKEN, "a/b c");
      expect(last().url).toBe(`${BASE_URL}/api/v1/techniques/path/a%2Fb%20c`);
      await expect(client.getTechniqueByPath(TOKEN, "")).rejects.toThrow(
        "Invalid technique path",
      );
    });
  });

  describe("users", () => {
    it("deleteUser DELETEs /users/:userId with the provider tokens", async () => {
      net.setDefaultResponse({
        data: { success: true, data: { deleted: true }, timestamp: "t" },
      });
      const result = await client.deleteUser(TOKEN, "uid-1", {
        googleAccessToken: "g-token",
      });
      expect(last().method).toBe("DELETE");
      expect(last().url).toBe(`${BASE_URL}/api/v1/users/uid-1`);
      expect(lastBody()).toEqual({ googleAccessToken: "g-token" });
      expect(lastAuth()).toBe(`Bearer ${TOKEN}`);
      expect(result.data).toEqual({ deleted: true });
    });

    it("deleteUser sends an empty JSON body without provider tokens", async () => {
      await client.deleteUser(TOKEN, "uid-1");
      expect(lastBody()).toEqual({});
    });

    it("deleteUser throws the API error when success is false", async () => {
      net.setDefaultResponse({
        status: 409,
        ok: false,
        data: {
          success: false,
          error: "Please cancel your subscription before deleting your account",
          timestamp: "t",
        },
      });
      await expect(client.deleteUser(TOKEN, "uid-1")).rejects.toThrow(
        "Please cancel your subscription",
      );
    });

    it("deleteUser validates userId", async () => {
      await expect(client.deleteUser(TOKEN, "")).rejects.toThrow(
        "Invalid userId",
      );
    });
  });

  describe("examples", () => {
    it("getRandomExample GETs /examples/random with an optional technique", async () => {
      await client.getRandomExample(TOKEN);
      expect(last().method).toBe("GET");
      expect(last().url).toBe(`${BASE_URL}/api/v1/examples/random`);

      await client.getRandomExample(TOKEN, { technique: 5 });
      expect(last().url).toBe(`${BASE_URL}/api/v1/examples/random?technique=5`);
    });

    it("getExample GETs /examples/:uuid", async () => {
      await client.getExample(TOKEN, UUID);
      expect(last().method).toBe("GET");
      expect(last().url).toBe(`${BASE_URL}/api/v1/examples/${UUID}`);
    });

    it("updateExample PUTs /examples/:uuid with the body", async () => {
      await client.updateExample(TOKEN, UUID, {
        board: undefined,
        pencilmarks: undefined,
        solution: undefined,
        techniques_bitfield: "1152921504606846978",
        primary_technique: 60,
        hint_data: undefined,
        source_board_uuid: undefined,
      });
      expect(last().method).toBe("PUT");
      expect(last().url).toBe(`${BASE_URL}/api/v1/examples/${UUID}`);
      expect(lastBody()).toEqual({
        techniques_bitfield: "1152921504606846978",
        primary_technique: 60,
      });
    });

    it("deleteExample DELETEs /examples/:uuid", async () => {
      await client.deleteExample(TOKEN, UUID);
      expect(last().method).toBe("DELETE");
      expect(last().url).toBe(`${BASE_URL}/api/v1/examples/${UUID}`);
    });

    it("example methods validate the UUID", async () => {
      await expect(client.getExample(TOKEN, "bad")).rejects.toThrow();
      await expect(client.deleteExample(TOKEN, "bad")).rejects.toThrow();
    });
  });

  describe("practices", () => {
    it("getPractice GETs /practices/:uuid", async () => {
      await client.getPractice(TOKEN, UUID);
      expect(last().method).toBe("GET");
      expect(last().url).toBe(`${BASE_URL}/api/v1/practices/${UUID}`);
    });

    it("deletePractice DELETEs /practices/:uuid", async () => {
      await client.deletePractice(TOKEN, UUID);
      expect(last().method).toBe("DELETE");
      expect(last().url).toBe(`${BASE_URL}/api/v1/practices/${UUID}`);
    });

    it("practice methods validate the UUID", async () => {
      await expect(client.getPractice(TOKEN, "bad")).rejects.toThrow();
      await expect(client.deletePractice(TOKEN, "bad")).rejects.toThrow();
    });
  });

  describe("badges", () => {
    it("createBadge POSTs /gamification/badges with the body", async () => {
      const data = {
        badgeType: "level",
        badgeKey: "level_13",
        title: "Level 13",
      };
      await client.createBadge(TOKEN, data);
      expect(last().method).toBe("POST");
      expect(last().url).toBe(`${BASE_URL}/api/v1/gamification/badges`);
      expect(lastBody()).toEqual(data);
    });

    it("updateBadge PUTs /gamification/badges/:badgeKey", async () => {
      await client.updateBadge(TOKEN, "games_5", { title: "Five" });
      expect(last().method).toBe("PUT");
      expect(last().url).toBe(`${BASE_URL}/api/v1/gamification/badges/games_5`);
      expect(lastBody()).toEqual({ title: "Five" });
    });

    it("deleteBadge DELETEs /gamification/badges/:badgeKey", async () => {
      await client.deleteBadge(TOKEN, "games_5");
      expect(last().method).toBe("DELETE");
      expect(last().url).toBe(`${BASE_URL}/api/v1/gamification/badges/games_5`);
    });

    it("badge methods reject an empty key", async () => {
      await expect(client.updateBadge(TOKEN, "", {})).rejects.toThrow(
        "Invalid badgeKey",
      );
      await expect(client.deleteBadge(TOKEN, "")).rejects.toThrow(
        "Invalid badgeKey",
      );
    });
  });

  describe("solverValidate brutalForce", () => {
    const original = "0".repeat(81);

    it("omits brutalForce when unset", async () => {
      await client.solverValidate(TOKEN, { original });
      expect(last().url).toBe(
        `${BASE_URL}/api/v1/solver/validate?original=${original}`,
      );
    });

    it("passes brutalForce through when set", async () => {
      await client.solverValidate(TOKEN, { original, brutalForce: false });
      expect(last().url).toBe(
        `${BASE_URL}/api/v1/solver/validate?brutalForce=false&original=${original}`,
      );
    });
  });

  describe("level range from sudojo_types", () => {
    it("accepts MIN_LEVEL..MAX_LEVEL and rejects anything else", async () => {
      await client.getLevel(TOKEN, 1);
      await client.getLevel(TOKEN, 12);
      await expect(client.getLevel(TOKEN, 0)).rejects.toThrow(
        "Invalid level: 0. Expected 1-12",
      );
      await expect(client.getLevel(TOKEN, 13)).rejects.toThrow("Expected 1-12");
      await expect(client.getLevel(TOKEN, 1.5)).rejects.toThrow(
        "Invalid level",
      );
      await expect(client.updateLevel(TOKEN, 13, {} as never)).rejects.toThrow(
        "Invalid level",
      );
      await expect(client.deleteLevel(TOKEN, 0)).rejects.toThrow(
        "Invalid level",
      );
    });
  });
});
