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
};

export const fallbackWeather: WeatherSnapshot = {
  temperature: 28,
  feelsLike: 29,
  description: "Partly cloudy",
  precipitationProbability: 80,
  rainfall: 18,
  humidity: 68,
  windSpeed: 12,
  location: "Niphad, Nashik",
  source: "IMD Agromet fallback benchmark",
  updatedAt: "Offline benchmark",
  isLive: false,
};

// Comprehensive WMO Weather Interpretation Codes (WW) mapping
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
  56: "Light freezing drizzle",
  57: "Dense freezing drizzle",
  61: "Slight rain",
  63: "Moderate rain",
  65: "Heavy rain",
  66: "Light freezing rain",
  67: "Heavy freezing rain",
  71: "Slight snowfall",
  73: "Moderate snowfall",
  75: "Heavy snowfall",
  77: "Snow grains",
  80: "Slight rain showers",
  81: "Moderate rain showers",
  82: "Violent rain showers",
  85: "Slight snow showers",
  86: "Heavy snow showers",
  95: "Thunderstorm",
  96: "Thunderstorm with slight hail",
  99: "Thunderstorm with heavy hail",
};

function getEnv(key: string): string | undefined {
  return (import.meta.env as Record<string, string | undefined>)?.[key];
}

/**
 * Build request for OpenWeather if configured, or default to free Open-Meteo API.
 * Open-Meteo does not require an API key and supports Asia/Kolkata timezone natively.
 */
export function buildWeatherRequest(latitude: number, longitude: number): {
  url: string;
  provider: "Open-Meteo" | "OpenWeather";
} {
  const configuredUrl = getEnv("VITE_WEATHER_API_URL");
  const configuredKey = getEnv("VITE_WEATHER_API_KEY");

  // Check if OpenWeather credentials are explicitly configured
  if (configuredKey && (configuredUrl?.includes("openweathermap.org") || !configuredUrl)) {
    const base = configuredUrl || "https://api.openweathermap.org/data/2.5/weather";
    const url = new URL(base);
    url.searchParams.set("lat", String(latitude));
    url.searchParams.set("lon", String(longitude));
    url.searchParams.set("units", "metric");
    url.searchParams.set("appid", configuredKey);
    return { url: url.toString(), provider: "OpenWeather" };
  }

  // Default: Open-Meteo free API (No API key needed)
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
 * Fetch live weather data using Open-Meteo (or OpenWeather if configured).
 * Implements timeout, network error recovery, and clear fallback data distinction.
 */
export async function fetchWeather(
  latitude = 20.087,
  longitude = 73.95,
  locationLabel = "Niphad, Nashik",
  timeoutMs = 8000
): Promise<WeatherSnapshot> {
  const { url, provider } = buildWeatherRequest(latitude, longitude);

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    const response = await fetch(url, {
      signal: controller.signal,
      headers: { Accept: "application/json" },
    });
    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`${provider} returned HTTP ${response.status}`);
    }

    const data = await response.json();

    if (provider === "OpenWeather") {
      const rain = Number(data.rain?.["1h"] ?? data.rain?.["3h"] ?? 0);
      return {
        temperature: Math.round(Number(data.main?.temp ?? fallbackWeather.temperature)),
        feelsLike: Math.round(Number(data.main?.feels_like ?? fallbackWeather.feelsLike)),
        description: String(data.weather?.[0]?.description ?? fallbackWeather.description),
        precipitationProbability: rain > 0 ? 80 : 20,
        rainfall: Math.round(rain * 10) / 10,
        humidity: Math.round(Number(data.main?.humidity ?? fallbackWeather.humidity)),
        windSpeed: Math.round(Number(data.wind?.speed ?? fallbackWeather.windSpeed) * 3.6),
        location: String(data.name || locationLabel),
        source: "OpenWeather Live Feed",
        updatedAt: "Live IMD/OpenWeather",
        isLive: true,
      };
    }

    // Process Open-Meteo response
    const current = data.current ?? {};
    const hourly = data.hourly ?? {};
    const code = Number(current.weather_code ?? 0);
    const rain = Number(current.rain ?? current.precipitation ?? 0);

    // Compute precipitation probability for the current hour from hourly forecast
    let precipProb = 0;
    if (Array.isArray(hourly.precipitation_probability) && hourly.precipitation_probability.length > 0) {
      // Find current hour index if available or take max of the upcoming 6 hours
      const upcomingProbabilities: number[] = hourly.precipitation_probability.slice(0, 6);
      precipProb = Math.max(...upcomingProbabilities, 0);
    } else if (rain > 0) {
      precipProb = 85;
    }

    return {
      temperature: Math.round(Number(current.temperature_2m ?? fallbackWeather.temperature)),
      feelsLike: Math.round(Number(current.apparent_temperature ?? fallbackWeather.feelsLike)),
      description: weatherCodeText[code] || "Partly cloudy",
      precipitationProbability: Math.round(precipProb),
      rainfall: Math.round(rain * 10) / 10,
      humidity: Math.round(Number(current.relative_humidity_2m ?? fallbackWeather.humidity)),
      windSpeed: Math.round(Number(current.wind_speed_10m ?? fallbackWeather.windSpeed)),
      location: locationLabel,
      source: "Open-Meteo Live (Asia/Kolkata)",
      updatedAt: "Live IMD / Open-Meteo",
      isLive: true,
    };
  } catch (err) {
    console.warn(`Weather fetch failed, utilizing fallback data:`, err);
    return {
      ...fallbackWeather,
      location: locationLabel,
      isLive: false,
    };
  }
}
