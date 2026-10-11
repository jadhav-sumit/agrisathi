export type WeatherSnapshot = {
  temperature: number;
  feelsLike: number;
  description: string;
  precipitationProbability: number;
  rainfall: number;
  humidity: number;
  windSpeed: number;
  location: string;
  source: string;
  updatedAt: string;
  isLive: boolean;
  sprayAdvisory?: {
    canSpray: boolean;
    reason: string;
  };
  irrigationAdvisory?: {
    needsIrrigation: boolean;
    recommendation: string;
  };
};

export const fallbackWeather: WeatherSnapshot = {
  temperature: 28,
  feelsLike: 29,
  description: "Partly cloudy",
  precipitationProbability: 35,
  rainfall: 0,
  humidity: 68,
  windSpeed: 12,
  location: "Niphad, Nashik",
  source: "Agromet Benchmark Model",
  updatedAt: "Regional Climatology",
  isLive: false,
  sprayAdvisory: {
    canSpray: true,
    reason: "Clear conditions suitable for preventive organic spray.",
  },
  irrigationAdvisory: {
    needsIrrigation: true,
    recommendation: "Regular morning drip cycle recommended.",
  },
};

export const weatherCodeText: Record<number, string> = {
  0: "Clear sky",
  1: "Mainly clear",
  2: "Partly cloudy",
  3: "Overcast",
  45: "Foggy",
  48: "Depositing rime fog",
  51: "Light drizzle",
  53: "Moderate drizzle",
  55: "Dense drizzle",
  61: "Slight rain",
  63: "Moderate rain",
  65: "Heavy rain",
  71: "Slight snowfall",
  80: "Slight rain showers",
  81: "Moderate rain showers",
  82: "Violent rain showers",
  95: "Thunderstorm",
  96: "Thunderstorm with slight hail",
  99: "Thunderstorm with heavy hail",
};

export function buildWeatherRequest(latitude: number, longitude: number): {
  url: string;
  provider: "Open-Meteo" | "OpenWeather";
} {
  const openMeteoUrl = new URL("https://api.open-meteo.com/v1/forecast");
  openMeteoUrl.searchParams.set("latitude", String(latitude));
  openMeteoUrl.searchParams.set("longitude", String(longitude));
  openMeteoUrl.searchParams.set(
    "current",
    "temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,rain,weather_code,wind_speed_10m"
  );
  openMeteoUrl.searchParams.set("hourly", "precipitation_probability,rain");
  openMeteoUrl.searchParams.set("forecast_days", "1");
  openMeteoUrl.searchParams.set("timezone", "Asia/Kolkata");
  return { url: openMeteoUrl.toString(), provider: "Open-Meteo" };
}

/**
 * Fetch live weather data using backend API or Open-Meteo
 */
export async function fetchWeather(
  latitude = 20.087,
  longitude = 73.95,
  locationLabel = "Niphad, Nashik",
  timeoutMs = 7000
): Promise<WeatherSnapshot> {
  // Try backend endpoint first if in browser environment
  if (typeof window !== "undefined") {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), timeoutMs);

      const res = await fetch(
        `/api/weather?lat=${latitude}&lon=${longitude}&location=${encodeURIComponent(locationLabel)}`,
        { signal: controller.signal }
      );
      clearTimeout(timeout);

      if (res.ok) {
        const data = await res.json();
        return {
          temperature: Number(data.temperature ?? fallbackWeather.temperature),
          feelsLike: Number(data.feelsLike ?? fallbackWeather.feelsLike),
          description: String(data.description ?? fallbackWeather.description),
          precipitationProbability: data.rainfallMm > 0 ? 80 : 25,
          rainfall: Number(data.rainfallMm ?? 0),
          humidity: Number(data.humidity ?? fallbackWeather.humidity),
          windSpeed: Number(data.windSpeedKmh ?? fallbackWeather.windSpeed),
          location: locationLabel,
          source: data.source || "OpenWeather Live Feed",
          updatedAt: "Updated Live",
          isLive: Boolean(data.isLive),
          sprayAdvisory: data.sprayAdvisory,
          irrigationAdvisory: data.irrigationAdvisory,
        };
      }
    } catch {
      // Fall through to Open-Meteo
    }
  }

  // Open-Meteo free direct API (Works in both Node/Vitest and browser)
  try {
    const { url } = buildWeatherRequest(latitude, longitude);
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timeout);

    if (res.ok) {
      const data = await res.json();
      const cur = data.current || {};
      const code = Number(cur.weather_code ?? 0);
      return {
        temperature: Math.round(Number(cur.temperature_2m ?? 28)),
        feelsLike: Math.round(Number(cur.apparent_temperature ?? 28)),
        description: weatherCodeText[code] || "Partly sunny",
        precipitationProbability: (cur.rain || 0) > 0 ? 85 : 20,
        rainfall: Math.round(Number(cur.rain || 0) * 10) / 10,
        humidity: Math.round(Number(cur.relative_humidity_2m ?? 65)),
        windSpeed: Math.round(Number(cur.wind_speed_10m ?? 12)),
        location: locationLabel,
        source: "Open-Meteo Agro Weather Service",
        updatedAt: "Live Direct",
        isLive: true,
      };
    }
  } catch {
    // Network failure recovery
  }

  return {
    ...fallbackWeather,
    location: locationLabel,
  };
}
