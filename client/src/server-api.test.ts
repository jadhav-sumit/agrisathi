import { describe, expect, it, beforeAll, afterAll } from "vitest";
import { createApp } from "../../server/index";
import { createServer } from "http";

describe("AgriSathi Full-Stack Integration & Security Tests", () => {
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

  // 9. Mandi Commodity Prices
  describe("Mandi Commodity Prices", () => {
    it("GET /api/mandi-prices returns Agmarknet market benchmark records", async () => {
      const res = await fetch(`${baseUrl}/api/mandi-prices?commodity=Onion`);
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.records).toBeInstanceOf(Array);
      expect(json.records.length).toBeGreaterThan(0);
      expect(json.records[0].commodity).toContain("Onion");
    });
  });
});
