import { describe, expect, it, beforeAll, afterAll } from "vitest";
import { createApp } from "../../server/index";
import { createServer } from "http";

describe("AgriSathi Full-Stack Integration & Security Tests", { timeout: 15000 }, () => {
  let server: any;
  let baseUrl: string;
  let farmerToken: string = "";
  let adminToken: string = "";

  beforeAll(async () => {
    const app = createApp();
    server = createServer(app);
    await new Promise<void>((resolve) => {
      server.listen(0, () => {
        const address = server.address() as any;
        baseUrl = `http://localhost:${address.port}`;
        resolve();
      });
    });
  });

  afterAll(async () => {
    if (server) {
      await new Promise<void>((resolve) => server.close(resolve));
    }
  });

  // 1. Health & Configuration
  it("GET /api/health returns system and service statuses", async () => {
    const res = await fetch(`${baseUrl}/api/health`);
    expect(res.status).toBe(200);
    const json = (await res.json()) as any;
    expect(json.status).toBe("ok");
    expect(json.database).toBeDefined();
    expect(json.services).toBeDefined();
  });

  // 2. Authentication: Registration Validation & Duplicate Prevention
  describe("Authentication: Registration", () => {
    const testPhone = `9822${Math.floor(100000 + Math.random() * 900000)}`;

    it("rejects registration with invalid phone", async () => {
      const res = await fetch(`${baseUrl}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "Test Farmer",
          phone: "123", // too short
          password: "password123",
          confirmPassword: "password123",
        }),
      });
      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.error).toContain("valid 10-digit mobile");
    });

    it("rejects registration when passwords mismatch", async () => {
      const res = await fetch(`${baseUrl}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "Test Farmer",
          phone: testPhone,
          password: "password123",
          confirmPassword: "mismatchedPassword",
        }),
      });
      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.error).toContain("Passwords do not match");
    });

    it("registers a new farmer account successfully with default role 'farmer'", async () => {
      const res = await fetch(`${baseUrl}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "Ramesh Pawar",
          phone: testPhone,
          email: `ramesh.${testPhone}@example.com`,
          password: "farmerPass@123",
          confirmPassword: "farmerPass@123",
          village: "Pimpalgaon",
          district: "Nashik",
          state: "Maharashtra",
          crop: "Tomato",
          farmSize: "3.5 acres",
          tenure: "Owner cultivator",
        }),
      });
      expect(res.status).toBe(201);
      const json = await res.json();
      expect(json.user).toBeDefined();
      expect(json.user.role).toBe("farmer");
      expect(json.user.password_hash).toBeUndefined(); // ensure hash not leaked!
      expect(json.token).toBeDefined();
      farmerToken = json.token;
    });

    it("prevents duplicate account creation for the same phone number", async () => {
      const res = await fetch(`${baseUrl}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "Duplicate Ramesh",
          phone: testPhone,
          password: "farmerPass@123",
          confirmPassword: "farmerPass@123",
        }),
      });
      expect(res.status).toBe(409);
      const json = await res.json();
      expect(json.error).toContain("already exists");
    });
  });

  // 3. Authentication: Login & Password Verification
  describe("Authentication: Login", () => {
    it("rejects login with wrong password without leaking account existence", async () => {
      const res = await fetch(`${baseUrl}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          identifier: "9876543210",
          password: "completelyWrongPassword",
        }),
      });
      expect(res.status).toBe(401);
      const json = await res.json();
      expect(json.error).toContain("Invalid mobile number/email or password");
    });

    it("successfully logs in demo farmer (Om Atole) and returns token", async () => {
      const res = await fetch(`${baseUrl}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          identifier: "9876543210",
          password: "kisan123",
        }),
      });
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.user.name).toContain("Om");
      expect(json.user.role).toBe("farmer");
      expect(json.token).toBeDefined();
      farmerToken = json.token;
    });

    it("successfully logs in administrator (9999999999) with admin privileges", async () => {
      const res = await fetch(`${baseUrl}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          identifier: "9999999999",
          password: "Admin@agrisathi2026",
        }),
      });
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.user.role).toBe("admin");
      expect(json.token).toBeDefined();
      adminToken = json.token;
    });
  });

  // 4. Role Authorization & Protected Routes
  describe("Authorization & Role Guards", () => {
    it("GET /api/auth/me returns authenticated user details", async () => {
      const res = await fetch(`${baseUrl}/api/auth/me`, {
        headers: { Authorization: `Bearer ${farmerToken}` },
      });
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.user.phone).toBe("9876543210");
    });

    it("denies farmer access to admin overview with 403 Forbidden", async () => {
      const res = await fetch(`${baseUrl}/api/admin/overview`, {
        headers: { Authorization: `Bearer ${farmerToken}` },
      });
      expect(res.status).toBe(403);
    });

    it("grants admin access to admin overview with system metrics", async () => {
      const res = await fetch(`${baseUrl}/api/admin/overview`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.system).toBeDefined();
      expect(json.metrics.totalUsers).toBeGreaterThanOrEqual(1);
      expect(json.apiStatus).toBeDefined();
    });

    it("grants admin access to user management list", async () => {
      const res = await fetch(`${baseUrl}/api/admin/users`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.users).toBeInstanceOf(Array);
      expect(json.users.length).toBeGreaterThanOrEqual(1);
    });
  });

  // 5. Password Reset Workflow
  describe("Password Reset Workflow", () => {
    let token: string = "";

    it("generates single-use expiring token on forgot password", async () => {
      const res = await fetch(`${baseUrl}/api/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier: "9876543210" }),
      });
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.resetToken).toBeDefined();
      token = json.resetToken;
    });

    it("updates password successfully with valid reset token", async () => {
      const res = await fetch(`${baseUrl}/api/auth/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          newPassword: "kisan123Updated",
        }),
      });
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.message).toContain("successfully updated");

      // Verify new password works
      const loginRes = await fetch(`${baseUrl}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          identifier: "9876543210",
          password: "kisan123Updated",
        }),
      });
      expect(loginRes.status).toBe(200);

      // Revert password back for test consistency
      const revertReq = await fetch(`${baseUrl}/api/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier: "9876543210" }),
      });
      const revertJson = await revertReq.json();
      await fetch(`${baseUrl}/api/auth/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token: revertJson.resetToken,
          newPassword: "kisan123",
        }),
      });
    });
  });

  // 6. All 8 Agricultural Assistant Modes Integration
  describe("8-Mode Agricultural Advisory Assistant", () => {
    const modes: Array<"soil" | "weather" | "pest" | "seed" | "fertilizer" | "resources" | "practice" | "irrigation"> = [
      "soil",
      "weather",
      "pest",
      "seed",
      "fertilizer",
      "resources",
      "practice",
      "irrigation",
    ];

    for (const mode of modes) {
      it(`POST /api/advisory responds for specialized '${mode}' mode`, async () => {
        const res = await fetch(`${baseUrl}/api/advisory`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${farmerToken}`,
          },
          body: JSON.stringify({
            category: mode,
            message: `Provide guidance for ${mode} in 2 acres onion field.`,
            language: "en",
          }),
        });

        expect(res.status).toBe(200);
        const json = await res.json();
        expect(json.reply).toBeDefined();
        expect(json.category).toBe(mode);
        expect(json.disclaimer).toBeDefined();
        expect(typeof json.reply).toBe("string");
        expect(json.reply.length).toBeGreaterThan(20);
      });
    }

    it("supports Marathi and Hindi responses for agricultural advice", async () => {
      const resHi = await fetch(`${baseUrl}/api/advisory`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category: "soil",
          message: "मिट्टी की जांच और नाइट्रोजन की मात्रा",
          language: "hi",
        }),
      });
      expect(resHi.status).toBe(200);
      const jsonHi = await resHi.json();
      expect(jsonHi.disclaimer).toContain("KVK");

      const resMr = await fetch(`${baseUrl}/api/advisory`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category: "irrigation",
          message: "कांदा पिकासाठी सिंचन कसे करावे?",
          language: "mr",
        }),
      });
      expect(resMr.status).toBe(200);
      const jsonMr = await resMr.json();
      expect(jsonMr.disclaimer).toContain("KVK");
    });

    it("GET /api/advisory/services returns integrated API services with credentials status", async () => {
      const res = await fetch(`${baseUrl}/api/advisory/services`);
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.services).toBeInstanceOf(Array);
      expect(json.services.length).toBeGreaterThanOrEqual(6);
      const ids = json.services.map((s: any) => s.id);
      expect(ids).toContain("openrouter");
      expect(ids).toContain("openweather");
      expect(ids).toContain("groq");
      expect(ids).toContain("mistral");
      expect(ids).toContain("nasa");
      expect(ids).toContain("geoapify");
    });

    it("POST /api/advisory routes to OpenRouter AI with user's OpenRouter API key", async () => {
      const res = await fetch(`${baseUrl}/api/advisory`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category: "soil",
          message: "What is the best soil pH for onion?",
          serviceTarget: "openrouter",
          apiKey: process.env.OPENROUTER_API_KEY || "dummy_openrouter_key",
        }),
      });
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.reply).toBeDefined();
      expect(json.provider).toContain("OpenRouter");
    }, 25000);

    it("POST /api/advisory routes to OpenWeather API when serviceTarget='openweather'", async () => {
      const res = await fetch(`${baseUrl}/api/advisory`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category: "weather",
          serviceTarget: "openweather",
          message: "Check current weather and irrigation alert",
          language: "en",
        }),
      });
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.serviceTarget).toBe("openweather");
      expect(json.provider).toContain("OpenWeather");
      expect(json.metrics).toBeDefined();
      expect(typeof json.metrics.temperature).toBe("number");
      expect(json.reply).toContain("OpenWeather");
    });

    it("POST /api/advisory routes to NASA Satellite API when serviceTarget='nasa'", async () => {
      const res = await fetch(`${baseUrl}/api/advisory`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category: "weather",
          serviceTarget: "nasa",
          message: "Analyze satellite solar radiation for crop photosynthesis",
          language: "en",
        }),
      });
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.serviceTarget).toBe("nasa");
      expect(json.provider).toContain("NASA");
      expect(json.metrics).toBeDefined();
      expect(typeof json.metrics.solarRadiationMj).toBe("number");
      expect(json.reply).toContain("NASA");
    });

    it("POST /api/advisory routes to Geoapify API when serviceTarget='geoapify'", async () => {
      const res = await fetch(`${baseUrl}/api/advisory`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category: "resources",
          serviceTarget: "geoapify",
          message: "Locate Nashik agricultural district coordinates and KVK",
          language: "en",
        }),
      });
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.serviceTarget).toBe("geoapify");
      expect(json.provider).toContain("Geoapify");
      expect(json.metrics).toBeDefined();
      expect(typeof json.metrics.latitude).toBe("number");
    });

    it("POST /api/advisory auto-detects natural language intent for weather query", async () => {
      const res = await fetch(`${baseUrl}/api/advisory`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category: "general",
          serviceTarget: "auto",
          message: "Will it rain tomorrow in my village? Should I spray?",
          language: "en",
        }),
      });
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.serviceTarget).toBe("openweather");
      expect(json.provider).toContain("OpenWeather");
    });
  });

  // 7. Live Weather & NASA Agroclimatology APIs
  describe("Weather & NASA Agroclimatology APIs", () => {
    it("GET /api/weather returns live agricultural weather with spray & irrigation advisories", async () => {
      const res = await fetch(`${baseUrl}/api/weather?lat=20.087&lon=73.95&location=Niphad`);
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(typeof json.temperature).toBe("number");
      expect(typeof json.humidity).toBe("number");
      expect(json.sprayAdvisory).toBeDefined();
      expect(typeof json.sprayAdvisory.canSpray).toBe("boolean");
      expect(json.irrigationAdvisory).toBeDefined();
      expect(json.forecast).toBeInstanceOf(Array);
    });

    it("GET /api/nasa-agro returns NASA satellite solar irradiance and agroclimatology", async () => {
      const res = await fetch(`${baseUrl}/api/nasa-agro?lat=20.087&lon=73.95`);
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(typeof json.solarRadiationMj).toBe("number");
      expect(json.solarRadiationMj).toBeGreaterThan(0);
      expect(typeof json.avgTemperatureC).toBe("number");
      expect(json.source).toContain("NASA");
      expect(json.agroInsight).toBeDefined();
    });
  });

  // 8. Geoapify Geocoding & Tile Configuration
  describe("Geoapify Geocoding & Mapping", () => {
    it("GET /api/geo/tile-config returns configured map tile URL", async () => {
      const res = await fetch(`${baseUrl}/api/geo/tile-config`);
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.tileUrl).toBeDefined();
      expect(json.attribution).toBeDefined();
    });

    it("GET /api/geo/search returns geocoded results for Indian agricultural centers", async () => {
      const res = await fetch(`${baseUrl}/api/geo/search?q=Nashik`);
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.results).toBeInstanceOf(Array);
    });
  });

  // 10. Strict Agricultural Vision Diagnostics: Pest Detection (Leaves) & Seed Quality (Seeds)
  describe("Agricultural Vision Diagnostics (Strict Leaf & Seed Enforcement)", () => {
    // 1x1 base64 mock image
    const mockImage = "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////wgALCAABAAEBAREA/8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABPxA=";

    it("POST /api/pest/detect accepts a valid plant leaf photo and returns diagnostic details", async () => {
      const res = await fetch(`${baseUrl}/api/pest/detect`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          image: mockImage,
          cropName: "Onion",
          language: "en",
          clientMetrics: { isLeafCandidate: true, detectedType: "leaf" },
        }),
      });
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.isLeaf).toBe(true);
      expect(json.result).toBeDefined();
      expect(json.result.diseaseName).toBeDefined();
      expect(json.result.treatments.biological).toBeInstanceOf(Array);
      expect(json.result.treatments.chemical).toBeInstanceOf(Array);
    });

    it("POST /api/pest/detect rejects seed photos and non-leaf uploads with clear error", async () => {
      const res = await fetch(`${baseUrl}/api/pest/detect`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          image: mockImage,
          cropName: "Onion",
          language: "en",
          clientMetrics: { isLeafCandidate: false, detectedType: "seed" },
        }),
      });
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.isLeaf).toBe(false);
      expect(json.error).toContain("Seed photo detected");
    });

    it("POST /api/seed/analyze accepts valid crop seeds photo and returns quality report", async () => {
      const res = await fetch(`${baseUrl}/api/seed/analyze`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          image: mockImage,
          cropName: "Onion",
          language: "en",
          clientMetrics: { isSeedCandidate: true, detectedType: "seed" },
        }),
      });
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.isSeeds).toBe(true);
      expect(json.result).toBeDefined();
      expect(typeof json.result.purityPercentage).toBe("number");
      expect(typeof json.result.germinationPotential).toBe("number");
      expect(json.result.recommendedTreatment).toBeInstanceOf(Array);
    });

    it("POST /api/seed/analyze rejects plant leaf uploads with clear error directing to pest detection", async () => {
      const res = await fetch(`${baseUrl}/api/seed/analyze`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          image: mockImage,
          cropName: "Onion",
          language: "en",
          clientMetrics: { isSeedCandidate: false, detectedType: "leaf" },
        }),
      });
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.isSeeds).toBe(false);
      expect(json.error).toContain("Plant leaf photo detected");
    });
  });
});

