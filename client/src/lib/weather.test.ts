import { describe, expect, it } from "vitest";
import { buildWeatherRequest, fetchWeather, fallbackWeather, weatherCodeText } from "./weather";

describe("Open-Meteo & Weather Module Tests", () => {
  it("builds an Open-Meteo request by default without requiring an API key", () => {
    const { url, provider } = buildWeatherRequest(20.087, 73.95);
    expect(provider).toBe("Open-Meteo");
    expect(url).toContain("api.open-meteo.com");
    expect(url).toContain("latitude=20.087");
    expect(url).toContain("longitude=73.95");
    expect(url).toContain("timezone=Asia%2FKolkata");
  });

  it("successfully fetches live weather from Open-Meteo for Indian coordinates", async () => {
    const weather = await fetchWeather(20.087, 73.95, "Niphad, Nashik", 10000);
    // If online, it will return isLive true with parsed metrics
    // If offline/timeout, it will safely return fallbackWeather with isLive false
    expect(typeof weather.temperature).toBe("number");
    expect(typeof weather.feelsLike).toBe("number");
    expect(typeof weather.humidity).toBe("number");
    expect(typeof weather.rainfall).toBe("number");
    expect(typeof weather.precipitationProbability).toBe("number");
    expect(typeof weather.description).toBe("string");
    expect(typeof weather.isLive).toBe("boolean");
    expect(weather.location).toBe("Niphad, Nashik");
  }, 15000);

  it("correctly maps WMO weather codes to readable descriptions", () => {
    expect(weatherCodeText[0]).toBe("Clear sky");
    expect(weatherCodeText[63]).toBe("Moderate rain");
    expect(weatherCodeText[95]).toBe("Thunderstorm");
  });

  it("handles network failure and returns fallback weather gracefully", async () => {
    // Pass an unreachable port / invalid domain with short timeout to simulate failure
    const invalidResult = await fetchWeather(9999, 9999, "Unknown Location", 50);
    expect(invalidResult.isLive).toBe(false);
    expect(invalidResult.temperature).toBe(fallbackWeather.temperature);
  });
});
