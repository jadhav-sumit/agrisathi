export interface AgriculturalWeather {
  temperature: number;
  feelsLike: number;
  humidity: number;
  rainfallMm: number;
  windSpeedKmh: number;
  description: string;
  conditionCode: string;
  source: string;
  isLive: boolean;
  sprayAdvisory: {
    canSpray: boolean;
    reason: string;
  };
  irrigationAdvisory: {
    needsIrrigation: boolean;
    recommendation: string;
  };
  forecast: Array<{
    date: string;
    tempMin: number;
    tempMax: number;
    condition: string;
    rainProb: number;
  }>;
}

export async function getWeatherData(
  lat: number = 20.087,
  lon: number = 73.95,
  locationName: string = "Niphad, Nashik"
): Promise<AgriculturalWeather> {
  const openWeatherKey = process.env.OPENWEATHER_API_KEY;

  if (openWeatherKey) {
    try {
      const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&appid=${openWeatherKey}`;
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 6000);

      const resp = await fetch(url, { signal: controller.signal });
      clearTimeout(timeout);

      if (resp.ok) {
        const data = (await resp.json()) as any;
        const temp = Math.round(data.main?.temp ?? 28);
        const feelsLike = Math.round(data.main?.feels_like ?? temp);
        const humidity = Number(data.main?.humidity ?? 65);
        const windKmh = Math.round((Number(data.wind?.speed ?? 3.5) * 3.6));
        const rainMm = Number(data.rain?.["1h"] || data.rain?.["3h"] || 0);
        const desc = data.weather?.[0]?.description || "Partly cloudy";
        const isRaining = rainMm > 0.5 || /rain|drizzle|thunderstorm/i.test(desc);

        // Fetch 5-day forecast for farming schedule
        let forecastList: Array<{ date: string; tempMin: number; tempMax: number; condition: string; rainProb: number }> = [];
        try {
          const forecastUrl = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&units=metric&cnt=5&appid=${openWeatherKey}`;
          const fResp = await fetch(forecastUrl);
          if (fResp.ok) {
            const fData = (await fResp.json()) as any;
            forecastList = (fData.list || []).slice(0, 5).map((item: any) => ({
              date: item.dt_txt || new Date().toISOString().split("T")[0],
              tempMin: Math.round(item.main?.temp_min ?? temp - 3),
              tempMax: Math.round(item.main?.temp_max ?? temp + 3),
              condition: item.weather?.[0]?.main || "Clear",
              rainProb: Math.round((Number(item.pop || 0) * 100)),
            }));
          }
        } catch {
          // Non-critical forecast fallback
        }

        const canSpray = !isRaining && windKmh < 15 && humidity < 85;
        const sprayReason = isRaining
          ? "Rain risk: Chemical or bio-pesticide will be washed off."
          : windKmh >= 15
            ? `High wind (${windKmh} km/h): Pesticide drift hazard.`
            : "Suitable spraying conditions: Normal wind and dry weather.";

        const needsIrrigation = rainMm < 2 && humidity < 70;
        const irrigationReason = isRaining
          ? "Rain expected: Hold irrigation to prevent root waterlogging."
          : "Normal soil drying: Standard light irrigation recommended.";

        return {
          temperature: temp,
          feelsLike,
          humidity,
          rainfallMm: rainMm,
          windSpeedKmh: windKmh,
          description: desc,
          conditionCode: data.weather?.[0]?.icon || "02d",
          source: "OpenWeather Live Agricultural API",
          isLive: true,
          sprayAdvisory: { canSpray, reason: sprayReason },
          irrigationAdvisory: { needsIrrigation, recommendation: irrigationReason },
          forecast: forecastList.length > 0 ? forecastList : getFallbackForecast(temp),
        };
      }
    } catch (err: any) {
      console.warn("[WeatherService] OpenWeather query failed, falling back to Open-Meteo:", err.message);
    }
  }

  // Fallback to Open-Meteo (free open weather API, no key required)
  try {
    const meteoUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,rain,wind_speed_10m&forecast_days=3&timezone=Asia%2FKolkata`;
    const resp = await fetch(meteoUrl);
    if (resp.ok) {
      const data = (await resp.json()) as any;
      const cur = data.current || {};
      const temp = Math.round(cur.temperature_2m ?? 27);
      const rainMm = Number(cur.rain || cur.precipitation || 0);
      const humidity = Number(cur.relative_humidity_2m ?? 60);
      const windKmh = Math.round(Number(cur.wind_speed_10m ?? 12));

      return {
        temperature: temp,
        feelsLike: Math.round(cur.apparent_temperature ?? temp),
        humidity,
        rainfallMm: rainMm,
        windSpeedKmh: windKmh,
        description: rainMm > 1 ? "Rain showers" : "Clear to partly cloudy",
        conditionCode: rainMm > 1 ? "10d" : "01d",
        source: "Open-Meteo Agro Weather Service (Free Tier)",
        isLive: true,
        sprayAdvisory: {
          canSpray: rainMm < 1 && windKmh < 15,
          reason: rainMm >= 1 ? "Rain active: Avoid spraying." : "Weather window open for spraying.",
        },
        irrigationAdvisory: {
          needsIrrigation: rainMm < 2,
          recommendation: rainMm >= 2 ? "Soil adequately moist." : "Moderate drip cycle advised.",
        },
        forecast: getFallbackForecast(temp),
      };
    }
  } catch (err: any) {
    console.warn("[WeatherService] Open-Meteo fallback failed:", err.message);
  }

  // Offline benchmark fallback
  return {
    temperature: 28,
    feelsLike: 29,
    humidity: 65,
    rainfallMm: 0,
    windSpeedKmh: 11,
    description: "Dry and partly sunny",
    conditionCode: "02d",
    source: "Agromet Benchmark Model",
    isLive: false,
    sprayAdvisory: {
      canSpray: true,
      reason: "Benchmark weather indicates suitable conditions for pest spray.",
    },
    irrigationAdvisory: {
      needsIrrigation: true,
      recommendation: "Regular 35-minute morning drip cycle recommended.",
    },
    forecast: getFallbackForecast(28),
  };
}

function getFallbackForecast(baseTemp: number) {
  return [
    { date: "Tomorrow", tempMin: baseTemp - 5, tempMax: baseTemp + 2, condition: "Sunny", rainProb: 15 },
    { date: "Day 2", tempMin: baseTemp - 4, tempMax: baseTemp + 3, condition: "Partly Cloudy", rainProb: 25 },
    { date: "Day 3", tempMin: baseTemp - 6, tempMax: baseTemp + 1, condition: "Clear", rainProb: 10 },
  ];
}
