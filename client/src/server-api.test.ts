import { describe, expect, it } from "vitest";
import { createApp } from "../../server/index";
import { createServer } from "http";

describe("Server API Endpoints Integration", () => {
  let server: any;
  let baseUrl: string;

  it("starts test server and responds to /api/health", async () => {
    const app = createApp();
    server = createServer(app);
    await new Promise<void>((resolve) => {
      server.listen(0, () => {
        const address = server.address();
        baseUrl = `http://localhost:${address.port}`;
        resolve();
      });
    });

    const res = await fetch(`${baseUrl}/api/health`);
    expect(res.status).toBe(200);
    const json = (await res.json()) as any;
    expect(json.status).toBe("ok");
    expect(json.services).toBeDefined();
    expect(json.services.openMeteo).toContain("free");
    expect(json.services.nominatim).toContain("free");
  });

  it("handles /api/chat validation and missing key gracefully", async () => {
    // 1. Missing message validation
    const emptyRes = await fetch(`${baseUrl}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    expect(emptyRes.status).toBe(400);

    // 2. Valid message but without GEMINI_API_KEY
    const chatRes = await fetch(`${baseUrl}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: "How much water does onion need in vegetative stage?",
        language: "en",
      }),
    });
    expect(chatRes.status).toBe(200);
    const chatJson = (await chatRes.json()) as any;
    expect(chatJson.disclaimer).toBeDefined();
    expect(typeof chatJson.reply).toBe("string");
    if (!process.env.GEMINI_API_KEY) {
      expect(chatJson.configured).toBe(false);
      expect(chatJson.reply).toContain("GEMINI_API_KEY");
    }
  });

  it("handles /api/identify-disease validation and graceful fallback", async () => {
    // 1. Missing image
    const missingRes = await fetch(`${baseUrl}/api/identify-disease`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    expect(missingRes.status).toBe(400);

    // 2. Dummy image data
    const diseaseRes = await fetch(`${baseUrl}/api/identify-disease`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        image: "data:image/jpeg;base64,/9j/4AAQSkZJRg==",
        cropName: "Onion",
      }),
    });
    expect(diseaseRes.status).toBe(200);
    const diseaseJson = (await diseaseRes.json()) as any;
    expect(diseaseJson.result).toBeDefined();
    expect(diseaseJson.result.plantName).toBeDefined();
    expect(diseaseJson.result.treatments).toBeInstanceOf(Array);
    expect(diseaseJson.result.disclaimer).toBeDefined();
  });

  it("retrieves agricultural mandi prices from /api/mandi-prices", async () => {
    const res = await fetch(`${baseUrl}/api/mandi-prices?commodity=Onion`);
    expect(res.status).toBe(200);
    const data = (await res.json()) as any;
    expect(data.records).toBeInstanceOf(Array);
    expect(data.records.length).toBeGreaterThan(0);
    const onionRecord = data.records[0];
    expect(onionRecord.commodity).toContain("Onion");
    expect(typeof onionRecord.modalPrice).toBe("number");
    expect(onionRecord.unit).toContain("Quintal");
  });

  it("shuts down test server cleanly", async () => {
    if (server) {
      await new Promise<void>((resolve) => server.close(resolve));
    }
  });
});
