import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { LocateFixed, MapPin, Search, Navigation } from "lucide-react";
import { cn } from "@/lib/utils";

// Leaflet default icon SVG
const farmMarkerSvg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="36" height="36" fill="#1c6b48">
  <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
</svg>
`;

const farmIcon = L.divIcon({
  html: `<div style="display:flex;align-items:center;justify-content:center;filter:drop-shadow(0 2px 4px rgba(0,0,0,0.3));">${farmMarkerSvg}</div>`,
  className: "custom-farm-marker",
  iconSize: [36, 36],
  iconAnchor: [18, 36],
  popupAnchor: [0, -36],
});

export interface MapViewProps {
  className?: string;
  initialCenter?: { lat: number; lng: number };
  initialZoom?: number;
  markerTitle?: string;
  markerDescription?: string;
  onLocationSelect?: (coords: { lat: number; lng: number; address?: string }) => void;
  onMapReady?: (map: L.Map) => void;
}

export function MapView({
  className,
  initialCenter = { lat: 20.087, lng: 73.95 }, // Niphad, Nashik
  initialZoom = 13,
  markerTitle = "Farm Location",
  markerDescription = "Niphad, Nashik (2.4 acres)",
  onLocationSelect,
  onMapReady,
}: MapViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);

  const [locating, setLocating] = useState(false);
  const [coords, setCoords] = useState<{ lat: number; lng: number }>(initialCenter);
  const [geoError, setGeoError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<any[]>([]);

  useEffect(() => {
    if (!containerRef.current || mapInstanceRef.current) return;

    // Initialize Leaflet map
    const map = L.map(containerRef.current, {
      center: [initialCenter.lat, initialCenter.lng],
      zoom: initialZoom,
      zoomControl: true,
    });

    // Fetch Geoapify tile config from backend
    fetch("/api/geo/tile-config")
      .then((r) => r.json())
      .then((cfg) => {
        L.tileLayer(cfg.tileUrl || "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          attribution: cfg.attribution || '&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a>',
          maxZoom: 19,
        }).addTo(map);
      })
      .catch(() => {
        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          attribution: '&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a>',
          maxZoom: 19,
        }).addTo(map);
      });

    // Add marker
    const marker = L.marker([initialCenter.lat, initialCenter.lng], {
      icon: farmIcon,
      draggable: true,
    }).addTo(map);

    marker.bindPopup(
      `<strong>${markerTitle}</strong><br/>${markerDescription}<br/><small>Lat: ${initialCenter.lat.toFixed(
        4
      )}, Lon: ${initialCenter.lng.toFixed(4)}</small>`
    );

    marker.on("dragend", () => {
      const pos = marker.getLatLng();
      setCoords({ lat: pos.lat, lng: pos.lng });
      marker.setPopupContent(
        `<strong>${markerTitle}</strong><br/>${markerDescription}<br/><small>Lat: ${pos.lat.toFixed(
          4
        )}, Lon: ${pos.lng.toFixed(4)}</small>`
      );
      if (onLocationSelect) {
        onLocationSelect({ lat: pos.lat, lng: pos.lng });
      }
    });

    map.on("click", (e: L.LeafletMouseEvent) => {
      marker.setLatLng(e.latlng);
      setCoords({ lat: e.latlng.lat, lng: e.latlng.lng });
      marker.setPopupContent(
        `<strong>${markerTitle}</strong><br/>${markerDescription}<br/><small>Lat: ${e.latlng.lat.toFixed(
          4
        )}, Lon: ${e.latlng.lng.toFixed(4)}</small>`
      );
      marker.openPopup();
      if (onLocationSelect) {
        onLocationSelect({ lat: e.latlng.lat, lng: e.latlng.lng });
      }
    });

    mapInstanceRef.current = map;
    markerRef.current = marker;

    if (onMapReady) {
      onMapReady(map);
    }

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, [initialCenter.lat, initialCenter.lng, initialZoom, markerTitle, markerDescription, onLocationSelect, onMapReady]);

  const requestCurrentLocation = () => {
    if (!navigator.geolocation) {
      setGeoError("Geolocation is not supported by your browser");
      return;
    }

    setLocating(true);
    setGeoError(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setCoords({ lat: latitude, lng: longitude });
        setLocating(false);

        if (mapInstanceRef.current && markerRef.current) {
          mapInstanceRef.current.setView([latitude, longitude], 15);
          markerRef.current.setLatLng([latitude, longitude]);
          markerRef.current.setPopupContent(
            `<strong>My Farm (GPS)</strong><br/><small>Lat: ${latitude.toFixed(
              4
            )}, Lon: ${longitude.toFixed(4)}</small>`
          );
          markerRef.current.openPopup();
        }

        if (onLocationSelect) {
          onLocationSelect({ lat: latitude, lng: longitude });
        }
      },
      (err) => {
        setLocating(false);
        setGeoError(
          err.code === 1
            ? "Location permission denied. Please search or tap your village on the map."
            : "Could not retrieve GPS coordinates. Tap the map manually."
        );
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    );
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    try {
      const res = await fetch(`/api/geo/search?q=${encodeURIComponent(searchQuery.trim())}`);
      const data = await res.json();
      setSearchResults(data.results || []);
    } catch {
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const selectSearchResult = (item: any) => {
    if (mapInstanceRef.current && markerRef.current) {
      mapInstanceRef.current.setView([item.lat, item.lon], 14);
      markerRef.current.setLatLng([item.lat, item.lon]);
      markerRef.current.setPopupContent(
        `<strong>${item.name || item.formatted}</strong><br/><small>${item.formatted}</small>`
      );
      markerRef.current.openPopup();
      setCoords({ lat: item.lat, lng: item.lon });
      setSearchResults([]);
      setSearchQuery(item.name || item.formatted);
      if (onLocationSelect) {
        onLocationSelect({ lat: item.lat, lng: item.lon, address: item.formatted });
      }
    }
  };

  return (
    <div
      className={cn(
        "relative w-full rounded-2xl overflow-hidden border border-slate-200 shadow-sm bg-slate-50",
        className
      )}
    >
      {/* Search Bar Overlay */}
      <div className="absolute top-3 left-3 z-[1000] w-64 sm:w-80">
        <form onSubmit={handleSearch} className="flex items-center bg-white/95 backdrop-blur-sm rounded-xl shadow-md border border-slate-200 overflow-hidden">
          <input
            type="text"
            placeholder="Search village (e.g. Niphad, Baramati)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full text-xs px-3 py-2 bg-transparent outline-none"
          />
          <button
            type="submit"
            disabled={isSearching}
            className="px-2.5 text-emerald-800 hover:text-emerald-950"
            aria-label="Search village"
          >
            <Search size={15} />
          </button>
        </form>

        {searchResults.length > 0 && (
          <div className="mt-1 bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden max-h-48 overflow-y-auto">
            {searchResults.map((r, i) => (
              <button
                key={i}
                type="button"
                onClick={() => selectSearchResult(r)}
                className="w-full text-left px-3 py-2 text-xs hover:bg-emerald-50 border-b border-slate-100 last:border-0 block"
              >
                <div className="font-semibold text-slate-800">{r.name || r.village || "Location"}</div>
                <div className="text-[10px] text-slate-500 truncate">{r.formatted}</div>
              </button>
            ))}
          </div>
        )}
      </div>

      <div ref={containerRef} className="w-full h-[420px] z-0" />

      {/* Geolocation Trigger */}
      <div className="absolute top-3 right-3 z-[1000]">
        <button
          type="button"
          onClick={requestCurrentLocation}
          disabled={locating}
          className="flex items-center gap-1.5 bg-white/95 backdrop-blur-sm hover:bg-white text-emerald-800 text-xs font-semibold px-3 py-2 rounded-xl shadow-md border border-emerald-200 transition disabled:opacity-50"
          title="Detect GPS coordinates of field"
        >
          <LocateFixed size={15} className={cn(locating && "animate-spin text-emerald-600")} />
          <span>{locating ? "Locating..." : "My Farm GPS"}</span>
        </button>
      </div>

      {/* Coordinates status badge */}
      <div className="absolute bottom-2 left-2 z-[1000] bg-white/90 backdrop-blur-sm text-[11px] text-slate-700 px-3 py-1.5 rounded-xl shadow border border-slate-200 flex items-center gap-2">
        <MapPin size={13} className="text-emerald-700" />
        <span>
          Lat: <strong>{coords.lat.toFixed(4)}</strong>, Lon: <strong>{coords.lng.toFixed(4)}</strong>
        </span>
        <span className="text-slate-400">|</span>
        <span className="text-slate-500">Tap map or drag pin to adjust plot boundary</span>
      </div>

      {geoError && (
        <div className="absolute bottom-12 left-2 right-2 z-[1000] bg-amber-50 text-amber-900 border border-amber-300 text-xs p-2 rounded-xl shadow">
          {geoError}
        </div>
      )}
    </div>
  );
}
export default MapView;
