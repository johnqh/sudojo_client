import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { MockNetworkClient } from "@sudobility/di/mocks";
import { SudojoClient } from "../sudojo-client";

const TEST_TOKEN = "test-token-123";
const BASE_URL = "https://test-sudojo.example.com";
const OCR_URL = `${BASE_URL}/api/v1/ocr/extract`;
const BASE64 = "iVBORw0KGgoAAAANSUhEUg==";

const okResponse = {
  success: true,
  data: {
    board: {
      original: "5".padEnd(81, "0"),
      user: "5".padEnd(81, "0"),
      pencilmark: { autopencil: false, numbers: "" },
    },
    confidence: 98.19,
    digitCount: 40,
  },
  timestamp: new Date().toISOString(),
};

describe("SudojoClient.extractOcr", () => {
  let client: SudojoClient;
  let mockNetworkClient: MockNetworkClient;

  beforeEach(() => {
    mockNetworkClient = new MockNetworkClient();
    client = new SudojoClient(mockNetworkClient, BASE_URL);
    mockNetworkClient.setMockResponse(OCR_URL, { data: okResponse }, "POST");
  });

  afterEach(() => {
    mockNetworkClient.reset();
  });

  it("posts the image to the OCR endpoint and returns the board", async () => {
    const result = await client.extractOcr(TEST_TOKEN, BASE64);

    expect(result.success).toBe(true);
    expect(result.data?.board.original).toHaveLength(81);
    expect(result.data?.confidence).toBe(98.19);
    expect(mockNetworkClient.wasUrlCalled(OCR_URL, "POST")).toBe(true);
  });

  it("sends the token as a bearer header", async () => {
    await client.extractOcr(TEST_TOKEN, BASE64);

    const request = mockNetworkClient.getLastRequest();
    expect(request?.options?.headers?.["Authorization"]).toBe(
      `Bearer ${TEST_TOKEN}`,
    );
  });

  // Callers hold images as canvas/file data URLs; the API wants raw base64.
  it("strips a data URL prefix", async () => {
    await client.extractOcr(TEST_TOKEN, `data:image/jpeg;base64,${BASE64}`);

    const body = JSON.parse(
      mockNetworkClient.getLastRequest()?.options?.body as string,
    );
    expect(body.image).toBe(BASE64);
  });

  it("passes plain base64 through unchanged", async () => {
    await client.extractOcr(TEST_TOKEN, BASE64);

    const body = JSON.parse(
      mockNetworkClient.getLastRequest()?.options?.body as string,
    );
    expect(body.image).toBe(BASE64);
  });

  // The API may try the ML service and then fall back to Tesseract, so the
  // default request timeout is too short for OCR.
  it("uses a long timeout by default and honours an override", async () => {
    await client.extractOcr(TEST_TOKEN, BASE64);
    expect(mockNetworkClient.getLastRequest()?.options?.timeout).toBe(60000);

    await client.extractOcr(TEST_TOKEN, BASE64, { timeout: 5000 });
    expect(mockNetworkClient.getLastRequest()?.options?.timeout).toBe(5000);
  });

  it("rejects an empty image", async () => {
    await expect(client.extractOcr(TEST_TOKEN, "")).rejects.toThrow(/image/i);
    await expect(
      client.extractOcr(TEST_TOKEN, "data:image/png;base64,"),
    ).rejects.toThrow(/image/i);
  });
});
