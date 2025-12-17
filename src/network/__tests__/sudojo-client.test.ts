import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { MockNetworkClient } from "@sudobility/di/mocks";
import { SudojoClient } from "../sudojo-client";
import type { SudojoAuth, SudojoConfig } from "../sudojo-client";

const TEST_AUTH: SudojoAuth = { accessToken: "test-token-123" };
const VALID_UUID = "12345678-1234-1234-1234-123456789abc";

describe("SudojoClient", () => {
  let client: SudojoClient;
  let mockNetworkClient: MockNetworkClient;
  let mockConfig: SudojoConfig;

  beforeEach(() => {
    mockNetworkClient = new MockNetworkClient();

    mockConfig = {
      baseUrl: "https://test-sudojo.example.com",
      apiToken: "api-token-123",
    };

    client = new SudojoClient(mockNetworkClient, mockConfig);
  });

  afterEach(() => {
    mockNetworkClient.reset();
  });

  describe("initialization", () => {
    it("should create instance successfully", () => {
      expect(client).toBeDefined();
      expect(client).toBeInstanceOf(SudojoClient);
    });

    it("should initialize without apiToken", () => {
      const configWithoutToken: SudojoConfig = {
        baseUrl: "https://test-sudojo.example.com",
      };

      const clientWithoutToken = new SudojoClient(
        mockNetworkClient,
        configWithoutToken,
      );
      expect(clientWithoutToken).toBeDefined();
      expect(clientWithoutToken).toBeInstanceOf(SudojoClient);
    });
  });

  describe("health check", () => {
    it("should get health status successfully", async () => {
      const mockResponse = {
        success: true,
        data: {
          name: "sudojo_api",
          version: "1.0.0",
          status: "ok",
        },
        timestamp: new Date().toISOString(),
      };

      mockNetworkClient.setMockResponse(
        "https://test-sudojo.example.com/",
        { data: mockResponse },
        "GET",
      );

      const result = await client.getHealth();

      expect(result.success).toBe(true);
      expect(result.data?.status).toBe("ok");
      expect(
        mockNetworkClient.wasUrlCalled("https://test-sudojo.example.com/"),
      ).toBe(true);
    });
  });

  describe("levels", () => {
    it("should get all levels successfully", async () => {
      const mockResponse = {
        success: true,
        data: [
          {
            uuid: VALID_UUID,
            index: 1,
            title: "Beginner",
            text: "Basic techniques",
            requires_subscription: false,
            created_at: new Date(),
            updated_at: new Date(),
          },
        ],
        timestamp: new Date().toISOString(),
      };

      mockNetworkClient.setMockResponse(
        "https://test-sudojo.example.com/api/v1/levels",
        { data: mockResponse },
        "GET",
      );

      const result = await client.getLevels(TEST_AUTH);

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(1);
      expect(
        mockNetworkClient.wasUrlCalled(
          "https://test-sudojo.example.com/api/v1/levels",
        ),
      ).toBe(true);
    });

    it("should get a specific level by UUID", async () => {
      const mockResponse = {
        success: true,
        data: {
          uuid: VALID_UUID,
          index: 1,
          title: "Beginner",
          text: "Basic techniques",
          requires_subscription: false,
          created_at: new Date(),
          updated_at: new Date(),
        },
        timestamp: new Date().toISOString(),
      };

      mockNetworkClient.setMockResponse(
        `https://test-sudojo.example.com/api/v1/levels/${VALID_UUID}`,
        { data: mockResponse },
        "GET",
      );

      const result = await client.getLevel(TEST_AUTH, VALID_UUID);

      expect(result.success).toBe(true);
      expect(result.data?.uuid).toBe(VALID_UUID);
    });

    it("should throw error for invalid UUID format", async () => {
      await expect(client.getLevel(TEST_AUTH, "invalid-uuid")).rejects.toThrow(
        "Invalid Level UUID format",
      );
    });

    it("should create a level with authentication", async () => {
      const mockResponse = {
        success: true,
        data: {
          uuid: VALID_UUID,
          index: 1,
          title: "New Level",
          text: null,
          requires_subscription: false,
          created_at: new Date(),
          updated_at: new Date(),
        },
        timestamp: new Date().toISOString(),
      };

      mockNetworkClient.setMockResponse(
        "https://test-sudojo.example.com/api/v1/levels",
        { data: mockResponse },
        "POST",
      );

      const result = await client.createLevel(TEST_AUTH, {
        index: 1,
        title: "New Level",
        text: null,
        requires_subscription: false,
      });

      expect(result.success).toBe(true);
      expect(result.data?.title).toBe("New Level");
      expect(
        mockNetworkClient.wasUrlCalled(
          "https://test-sudojo.example.com/api/v1/levels",
          "POST",
        ),
      ).toBe(true);
    });

    it("should update a level with authentication", async () => {
      const mockResponse = {
        success: true,
        data: {
          uuid: VALID_UUID,
          index: 1,
          title: "Updated Level",
          text: "Updated description",
          requires_subscription: true,
          created_at: new Date(),
          updated_at: new Date(),
        },
        timestamp: new Date().toISOString(),
      };

      mockNetworkClient.setMockResponse(
        `https://test-sudojo.example.com/api/v1/levels/${VALID_UUID}`,
        { data: mockResponse },
        "PUT",
      );

      const result = await client.updateLevel(TEST_AUTH, VALID_UUID, {
        title: "Updated Level",
        text: "Updated description",
      });

      expect(result.success).toBe(true);
      expect(result.data?.title).toBe("Updated Level");
    });

    it("should delete a level with authentication", async () => {
      const mockResponse = {
        success: true,
        data: {
          uuid: VALID_UUID,
          index: 1,
          title: "Deleted Level",
          text: null,
          requires_subscription: false,
          created_at: new Date(),
          updated_at: new Date(),
        },
        timestamp: new Date().toISOString(),
      };

      mockNetworkClient.setMockResponse(
        `https://test-sudojo.example.com/api/v1/levels/${VALID_UUID}`,
        { data: mockResponse },
        "DELETE",
      );

      const result = await client.deleteLevel(TEST_AUTH, VALID_UUID);

      expect(result.success).toBe(true);
      expect(result.data?.uuid).toBe(VALID_UUID);
      expect(
        mockNetworkClient.wasUrlCalled(
          `https://test-sudojo.example.com/api/v1/levels/${VALID_UUID}`,
          "DELETE",
        ),
      ).toBe(true);
    });
  });

  describe("techniques", () => {
    it("should get all techniques", async () => {
      const mockResponse = {
        success: true,
        data: [
          {
            uuid: VALID_UUID,
            level_uuid: VALID_UUID,
            index: 1,
            title: "Naked Single",
            text: "Find cells with only one candidate",
            created_at: new Date(),
            updated_at: new Date(),
          },
        ],
        timestamp: new Date().toISOString(),
      };

      mockNetworkClient.setMockResponse(
        "https://test-sudojo.example.com/api/v1/techniques",
        { data: mockResponse },
        "GET",
      );

      const result = await client.getTechniques(TEST_AUTH);

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(1);
    });

    it("should filter techniques by level_uuid", async () => {
      const mockResponse = {
        success: true,
        data: [],
        timestamp: new Date().toISOString(),
      };

      mockNetworkClient.setMockResponse(
        `https://test-sudojo.example.com/api/v1/techniques?level_uuid=${VALID_UUID}`,
        { data: mockResponse },
        "GET",
      );

      const result = await client.getTechniques(TEST_AUTH, {
        level_uuid: VALID_UUID,
      });

      expect(result.success).toBe(true);
      expect(
        mockNetworkClient.wasUrlCalled(
          `https://test-sudojo.example.com/api/v1/techniques?level_uuid=${VALID_UUID}`,
        ),
      ).toBe(true);
    });

    it("should create a technique", async () => {
      const mockResponse = {
        success: true,
        data: {
          uuid: VALID_UUID,
          level_uuid: VALID_UUID,
          index: 1,
          title: "New Technique",
          text: null,
          created_at: new Date(),
          updated_at: new Date(),
        },
        timestamp: new Date().toISOString(),
      };

      mockNetworkClient.setMockResponse(
        "https://test-sudojo.example.com/api/v1/techniques",
        { data: mockResponse },
        "POST",
      );

      const result = await client.createTechnique(TEST_AUTH, {
        level_uuid: VALID_UUID,
        index: 1,
        title: "New Technique",
        text: null,
      });

      expect(result.success).toBe(true);
      expect(result.data?.title).toBe("New Technique");
    });
  });

  describe("learning", () => {
    it("should get all learning entries", async () => {
      const mockResponse = {
        success: true,
        data: [
          {
            uuid: VALID_UUID,
            technique_uuid: VALID_UUID,
            index: 1,
            language_code: "en",
            text: "Learning content",
            image_url: null,
            created_at: new Date(),
            updated_at: new Date(),
          },
        ],
        timestamp: new Date().toISOString(),
      };

      mockNetworkClient.setMockResponse(
        "https://test-sudojo.example.com/api/v1/learning",
        { data: mockResponse },
        "GET",
      );

      const result = await client.getLearning(TEST_AUTH);

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(1);
    });

    it("should filter learning by technique_uuid and language_code", async () => {
      const mockResponse = {
        success: true,
        data: [],
        timestamp: new Date().toISOString(),
      };

      mockNetworkClient.setMockResponse(
        `https://test-sudojo.example.com/api/v1/learning?technique_uuid=${VALID_UUID}&language_code=en`,
        { data: mockResponse },
        "GET",
      );

      const result = await client.getLearning(TEST_AUTH, {
        technique_uuid: VALID_UUID,
        language_code: "en",
      });

      expect(result.success).toBe(true);
    });
  });

  describe("boards", () => {
    const SAMPLE_BOARD =
      "530070000600195000098000060800060003400803001700020006060000280000419005000080079";
    const SAMPLE_SOLUTION =
      "534678912672195348198342567859761423426853791713924856961537284287419635345286179";

    it("should get all boards", async () => {
      const mockResponse = {
        success: true,
        data: [
          {
            uuid: VALID_UUID,
            level_uuid: VALID_UUID,
            symmetrical: true,
            board: SAMPLE_BOARD,
            solution: SAMPLE_SOLUTION,
            techniques: 3,
            created_at: new Date(),
            updated_at: new Date(),
          },
        ],
        timestamp: new Date().toISOString(),
      };

      mockNetworkClient.setMockResponse(
        "https://test-sudojo.example.com/api/v1/boards",
        { data: mockResponse },
        "GET",
      );

      const result = await client.getBoards(TEST_AUTH);

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(1);
      expect(result.data?.[0]?.board).toBe(SAMPLE_BOARD);
    });

    it("should get a random board", async () => {
      const mockResponse = {
        success: true,
        data: {
          uuid: VALID_UUID,
          level_uuid: VALID_UUID,
          symmetrical: true,
          board: SAMPLE_BOARD,
          solution: SAMPLE_SOLUTION,
          techniques: 3,
          created_at: new Date(),
          updated_at: new Date(),
        },
        timestamp: new Date().toISOString(),
      };

      mockNetworkClient.setMockResponse(
        "https://test-sudojo.example.com/api/v1/boards/random",
        { data: mockResponse },
        "GET",
      );

      const result = await client.getRandomBoard(TEST_AUTH);

      expect(result.success).toBe(true);
      expect(result.data?.uuid).toBe(VALID_UUID);
    });

    it("should get random board filtered by level_uuid", async () => {
      const mockResponse = {
        success: true,
        data: {
          uuid: VALID_UUID,
          level_uuid: VALID_UUID,
          symmetrical: true,
          board: SAMPLE_BOARD,
          solution: SAMPLE_SOLUTION,
          techniques: 3,
          created_at: new Date(),
          updated_at: new Date(),
        },
        timestamp: new Date().toISOString(),
      };

      mockNetworkClient.setMockResponse(
        `https://test-sudojo.example.com/api/v1/boards/random?level_uuid=${VALID_UUID}`,
        { data: mockResponse },
        "GET",
      );

      const result = await client.getRandomBoard(TEST_AUTH, {
        level_uuid: VALID_UUID,
      });

      expect(result.success).toBe(true);
    });

    it("should create a board", async () => {
      const mockResponse = {
        success: true,
        data: {
          uuid: VALID_UUID,
          level_uuid: null,
          symmetrical: false,
          board: SAMPLE_BOARD,
          solution: SAMPLE_SOLUTION,
          techniques: null,
          created_at: new Date(),
          updated_at: new Date(),
        },
        timestamp: new Date().toISOString(),
      };

      mockNetworkClient.setMockResponse(
        "https://test-sudojo.example.com/api/v1/boards",
        { data: mockResponse },
        "POST",
      );

      const result = await client.createBoard(TEST_AUTH, {
        board: SAMPLE_BOARD,
        solution: SAMPLE_SOLUTION,
        level_uuid: null,
        symmetrical: false,
        techniques: null,
      });

      expect(result.success).toBe(true);
      expect(result.data?.board).toBe(SAMPLE_BOARD);
    });
  });

  describe("dailies", () => {
    const SAMPLE_BOARD =
      "530070000600195000098000060800060003400803001700020006060000280000419005000080079";
    const SAMPLE_SOLUTION =
      "534678912672195348198342567859761423426853791713924856961537284287419635345286179";

    it("should get all dailies", async () => {
      const mockResponse = {
        success: true,
        data: [
          {
            uuid: VALID_UUID,
            date: "2025-01-15",
            board_uuid: VALID_UUID,
            level_uuid: VALID_UUID,
            techniques: 5,
            board: SAMPLE_BOARD,
            solution: SAMPLE_SOLUTION,
            created_at: new Date(),
            updated_at: new Date(),
          },
        ],
        timestamp: new Date().toISOString(),
      };

      mockNetworkClient.setMockResponse(
        "https://test-sudojo.example.com/api/v1/dailies",
        { data: mockResponse },
        "GET",
      );

      const result = await client.getDailies(TEST_AUTH);

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(1);
    });

    it("should get a random daily", async () => {
      const mockResponse = {
        success: true,
        data: {
          uuid: VALID_UUID,
          date: "2025-01-15",
          board_uuid: VALID_UUID,
          level_uuid: VALID_UUID,
          techniques: 5,
          board: SAMPLE_BOARD,
          solution: SAMPLE_SOLUTION,
          created_at: new Date(),
          updated_at: new Date(),
        },
        timestamp: new Date().toISOString(),
      };

      mockNetworkClient.setMockResponse(
        "https://test-sudojo.example.com/api/v1/dailies/random",
        { data: mockResponse },
        "GET",
      );

      const result = await client.getRandomDaily(TEST_AUTH);

      expect(result.success).toBe(true);
    });

    it("should get today's daily", async () => {
      const mockResponse = {
        success: true,
        data: {
          uuid: VALID_UUID,
          date: "2025-01-15",
          board_uuid: VALID_UUID,
          level_uuid: VALID_UUID,
          techniques: 5,
          board: SAMPLE_BOARD,
          solution: SAMPLE_SOLUTION,
          created_at: new Date(),
          updated_at: new Date(),
        },
        timestamp: new Date().toISOString(),
      };

      mockNetworkClient.setMockResponse(
        "https://test-sudojo.example.com/api/v1/dailies/today",
        { data: mockResponse },
        "GET",
      );

      const result = await client.getTodayDaily(TEST_AUTH);

      expect(result.success).toBe(true);
    });

    it("should get daily by date", async () => {
      const mockResponse = {
        success: true,
        data: {
          uuid: VALID_UUID,
          date: "2025-01-15",
          board_uuid: VALID_UUID,
          level_uuid: VALID_UUID,
          techniques: 5,
          board: SAMPLE_BOARD,
          solution: SAMPLE_SOLUTION,
          created_at: new Date(),
          updated_at: new Date(),
        },
        timestamp: new Date().toISOString(),
      };

      mockNetworkClient.setMockResponse(
        "https://test-sudojo.example.com/api/v1/dailies/date/2025-01-15",
        { data: mockResponse },
        "GET",
      );

      const result = await client.getDailyByDate(TEST_AUTH, "2025-01-15");

      expect(result.success).toBe(true);
      expect(result.data?.date).toBe("2025-01-15");
    });

    it("should throw error for invalid date format", async () => {
      await expect(
        client.getDailyByDate(TEST_AUTH, "01-15-2025"),
      ).rejects.toThrow("Invalid date format");

      await expect(
        client.getDailyByDate(TEST_AUTH, "2025/01/15"),
      ).rejects.toThrow("Invalid date format");
    });
  });

  describe("challenges", () => {
    const SAMPLE_BOARD =
      "530070000600195000098000060800060003400803001700020006060000280000419005000080079";
    const SAMPLE_SOLUTION =
      "534678912672195348198342567859761423426853791713924856961537284287419635345286179";

    it("should get all challenges", async () => {
      const mockResponse = {
        success: true,
        data: [
          {
            uuid: VALID_UUID,
            board_uuid: VALID_UUID,
            level_uuid: VALID_UUID,
            difficulty: 5,
            board: SAMPLE_BOARD,
            solution: SAMPLE_SOLUTION,
            created_at: new Date(),
            updated_at: new Date(),
          },
        ],
        timestamp: new Date().toISOString(),
      };

      mockNetworkClient.setMockResponse(
        "https://test-sudojo.example.com/api/v1/challenges",
        { data: mockResponse },
        "GET",
      );

      const result = await client.getChallenges(TEST_AUTH);

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(1);
    });

    it("should filter challenges by level_uuid and difficulty", async () => {
      const mockResponse = {
        success: true,
        data: [],
        timestamp: new Date().toISOString(),
      };

      mockNetworkClient.setMockResponse(
        `https://test-sudojo.example.com/api/v1/challenges?level_uuid=${VALID_UUID}&difficulty=5`,
        { data: mockResponse },
        "GET",
      );

      const result = await client.getChallenges(TEST_AUTH, {
        level_uuid: VALID_UUID,
        difficulty: "5",
      });

      expect(result.success).toBe(true);
    });

    it("should get a random challenge", async () => {
      const mockResponse = {
        success: true,
        data: {
          uuid: VALID_UUID,
          board_uuid: VALID_UUID,
          level_uuid: VALID_UUID,
          difficulty: 5,
          board: SAMPLE_BOARD,
          solution: SAMPLE_SOLUTION,
          created_at: new Date(),
          updated_at: new Date(),
        },
        timestamp: new Date().toISOString(),
      };

      mockNetworkClient.setMockResponse(
        "https://test-sudojo.example.com/api/v1/challenges/random",
        { data: mockResponse },
        "GET",
      );

      const result = await client.getRandomChallenge(TEST_AUTH);

      expect(result.success).toBe(true);
    });

    it("should create a challenge", async () => {
      const mockResponse = {
        success: true,
        data: {
          uuid: VALID_UUID,
          board_uuid: null,
          level_uuid: null,
          difficulty: 3,
          board: SAMPLE_BOARD,
          solution: SAMPLE_SOLUTION,
          created_at: new Date(),
          updated_at: new Date(),
        },
        timestamp: new Date().toISOString(),
      };

      mockNetworkClient.setMockResponse(
        "https://test-sudojo.example.com/api/v1/challenges",
        { data: mockResponse },
        "POST",
      );

      const result = await client.createChallenge(TEST_AUTH, {
        board: SAMPLE_BOARD,
        solution: SAMPLE_SOLUTION,
        difficulty: 3,
        board_uuid: null,
        level_uuid: null,
      });

      expect(result.success).toBe(true);
      expect(result.data?.difficulty).toBe(3);
    });
  });

  describe("users", () => {
    it("should get user subscription with authentication", async () => {
      const mockResponse = {
        success: true,
        data: {
          hasSubscription: true,
          entitlement: {
            expires_date: "2025-12-31T23:59:59Z",
            grace_period_expires_date: null,
            product_identifier: "sudojo_premium_monthly",
            purchase_date: "2025-01-01T00:00:00Z",
          },
        },
        timestamp: new Date().toISOString(),
      };

      const userId = "firebase-user-123";

      mockNetworkClient.setMockResponse(
        `https://test-sudojo.example.com/api/v1/users/${userId}/subscriptions`,
        { data: mockResponse },
        "GET",
      );

      const result = await client.getUserSubscription(TEST_AUTH, userId);

      expect(result.success).toBe(true);
      expect(result.data?.hasSubscription).toBe(true);
      expect(result.data?.entitlement?.product_identifier).toBe(
        "sudojo_premium_monthly",
      );
      expect(
        mockNetworkClient.wasUrlCalled(
          `https://test-sudojo.example.com/api/v1/users/${userId}/subscriptions`,
        ),
      ).toBe(true);
    });

    it("should get user subscription without active subscription", async () => {
      const mockResponse = {
        success: true,
        data: {
          hasSubscription: false,
          entitlement: null,
        },
        timestamp: new Date().toISOString(),
      };

      const userId = "firebase-user-456";

      mockNetworkClient.setMockResponse(
        `https://test-sudojo.example.com/api/v1/users/${userId}/subscriptions`,
        { data: mockResponse },
        "GET",
      );

      const result = await client.getUserSubscription(TEST_AUTH, userId);

      expect(result.success).toBe(true);
      expect(result.data?.hasSubscription).toBe(false);
      expect(result.data?.entitlement).toBeNull();
    });

    it("should throw error for empty userId", async () => {
      await expect(client.getUserSubscription(TEST_AUTH, "")).rejects.toThrow(
        "Invalid userId",
      );
    });

    it("should throw error for userId exceeding max length", async () => {
      const longUserId = "a".repeat(129);
      await expect(
        client.getUserSubscription(TEST_AUTH, longUserId),
      ).rejects.toThrow("Invalid userId");
    });
  });

  describe("UUID validation", () => {
    it("should accept valid UUIDs", async () => {
      const mockResponse = {
        success: true,
        data: {
          uuid: VALID_UUID,
          index: 1,
          title: "Test Level",
          text: null,
          requires_subscription: false,
          created_at: new Date(),
          updated_at: new Date(),
        },
        timestamp: new Date().toISOString(),
      };

      mockNetworkClient.setMockResponse(
        `https://test-sudojo.example.com/api/v1/levels/${VALID_UUID}`,
        { data: mockResponse },
        "GET",
      );

      // Should not throw
      await expect(client.getLevel(TEST_AUTH, VALID_UUID)).resolves.toBeDefined();
    });

    it("should reject invalid UUIDs", async () => {
      // Too short
      await expect(client.getLevel(TEST_AUTH, "123")).rejects.toThrow(
        "Invalid Level UUID format",
      );

      // Wrong format
      await expect(client.getLevel(TEST_AUTH, "not-a-uuid")).rejects.toThrow(
        "Invalid Level UUID format",
      );

      // Empty
      await expect(client.getLevel(TEST_AUTH, "")).rejects.toThrow(
        "Level UUID is required",
      );
    });
  });
});
