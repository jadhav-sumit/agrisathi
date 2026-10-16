export interface GeoLocationResult {
  formatted: string;
  name?: string;
  village?: string;
  district?: string;
  state?: string;
  country?: string;
  lat: number;
  lon: number;
}

export function getGeoapifyApiKey(): string | undefined {
  return process.env.GEOAPIFY_API_KEY || process.env.GEOAPIFY_KEY;
}

export async function searchAddress(query: string): Promise<GeoLocationResult[]> {
  const clean = query.trim();
  if (!clean || clean.length < 2) return [];

  const key = getGeoapifyApiKey();

  if (key) {
    try {
      const url = `https://api.geoapify.com/v1/geocode/search?text=${encodeURIComponent(
        clean
      )}&country=in&limit=5&apiKey=${key}`;

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 6000);

      const resp = await fetch(url, { signal: controller.signal });
      clearTimeout(timeout);

      if (resp.ok) {
        const data = (await resp.json()) as any;
        const features = data.features || [];
        return features.map((f: any) => {
          const p = f.properties || {};
          return {
            formatted: p.formatted || `${p.name || ""}, ${p.state || "India"}`,
            name: p.name || p.suburb || p.village,
            village: p.village || p.suburb || p.city,
            district: p.county || p.district || p.state_district,
            state: p.state || "Maharashtra",
            country: p.country || "India",
            lat: Number(p.lat || f.geometry?.coordinates?.[1] || 0),
            lon: Number(p.lon || f.geometry?.coordinates?.[0] || 0),
          };
        });
      }
    } catch (err: any) {
      console.warn("[GeoService] Geoapify search failed, trying fallback:", err.message);
    }
  }

  // Fallback to Nominatim OpenStreetMap
  try {
    const nomUrl = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
      clean + ", India"
    )}&format=json&addressdetails=1&limit=5`;
    const resp = await fetch(nomUrl, {
      headers: { "User-Agent": "AgriSathi-FarmerAdvisory/2.0" },
    });
    if (resp.ok) {
      const items = (await resp.json()) as any[];
      return items.map((item) => ({
        formatted: item.display_name,
        village: item.address?.village || item.address?.suburb || item.address?.town,
        district: item.address?.county || item.address?.state_district,
        state: item.address?.state || "Maharashtra",
        country: item.address?.country || "India",
        lat: parseFloat(item.lat),
        lon: parseFloat(item.lon),
      }));
    }
  } catch {
    // Ignore fallback errors
  }

  return [];
}

export async function reverseGeocode(lat: number, lon: number): Promise<GeoLocationResult | null> {
  const key = getGeoapifyApiKey();

  if (key) {
    try {
      const url = `https://api.geoapify.com/v1/geocode/reverse?lat=${lat}&lon=${lon}&apiKey=${key}`;
      const resp = await fetch(url);
      if (resp.ok) {
        const data = (await resp.json()) as any;
        const p = data.features?.[0]?.properties;
        if (p) {
          return {
            formatted: p.formatted,
            village: p.village || p.suburb || p.city || "Field Plot",
            district: p.county || p.district,
            state: p.state || "Maharashtra",
            country: p.country || "India",
            lat,
            lon,
          };
        }
      }
    } catch (err: any) {
      console.warn("[GeoService] Reverse geocode error:", err.message);
    }
  }

  return {
    formatted: `Field Location (${lat.toFixed(4)}, ${lon.toFixed(4)})`,
    village: "Niphad",
    district: "Nashik",
    state: "Maharashtra",
    lat,
    lon,
  };
}
