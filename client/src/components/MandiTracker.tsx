import { useState, useEffect } from "react";
import { TrendingUp, RefreshCw, Store, Calendar, ShieldCheck, Info } from "lucide-react";
import type { Locale } from "@/lib/i18n";

interface MandiPriceRecord {
  commodity: string;
  market: string;
  district: string;
  state: string;
  minPrice: number;
  maxPrice: number;
  modalPrice: number;
  unit: string;
  arrivalDate: string;
}

interface MandiResponse {
  isLive: boolean;
  source: string;
  records: MandiPriceRecord[];
  note?: string;
}

const commodities = [
  { id: "Onion", labelEn: "Onion (कांदा)", labelHi: "प्याज़", labelMr: "कांदा" },
  { id: "Tomato", labelEn: "Tomato (टोमॅटो)", labelHi: "टमाटर", labelMr: "टोमॅटो" },
  { id: "Soybean", labelEn: "Soybean (सोयाबीन)", labelHi: "सोयाबीन", labelMr: "सोयाबीन" },
  { id: "Cotton", labelEn: "Cotton (कापूस)", labelHi: "कपास", labelMr: "कापूस" },
  { id: "Wheat", labelEn: "Wheat (गहू)", labelHi: "गेहूं", labelMr: "गहू" },
];

export function MandiTracker({ locale }: { locale: Locale }) {
  const [selectedCommodity, setSelectedCommodity] = useState("Onion");
  const [data, setData] = useState<MandiResponse | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchPrices = async (commodity: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/mandi-prices?commodity=${encodeURIComponent(commodity)}`);
      if (res.ok) {
        const json = (await res.json()) as MandiResponse;
        setData(json);
      }
    } catch (e) {
      console.warn("Failed to fetch mandi prices:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPrices(selectedCommodity);
  }, [selectedCommodity]);

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md">
            Agmarknet APMC Rates
          </span>
          <h3 className="text-lg font-bold text-slate-800 mt-1">
            {locale === "hi"
              ? "मंडी दैनिक बाजार भाव"
              : locale === "mr"
                ? "कृषी उत्पन्न बाजार समिती (APMC) दर"
                : "Mandi Agricultural Market Prices"}
          </h3>
          <p className="text-xs text-slate-500">
            {data?.source || "APMC Agmarknet Verified Feed"}
          </p>
        </div>

        <button
          onClick={() => fetchPrices(selectedCommodity)}
          disabled={loading}
          className="flex items-center gap-1 text-xs text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-lg font-medium transition disabled:opacity-50"
        >
          <RefreshCw size={13} className={loading ? "animate-spin" : ""} /> Refresh
        </button>
      </div>

      {/* Commodity selection tabs */}
      <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
        {commodities.map((c) => (
          <button
            key={c.id}
            onClick={() => setSelectedCommodity(c.id)}
            className={`text-xs px-3 py-1.5 rounded-xl font-medium border transition ${
              selectedCommodity === c.id
                ? "bg-emerald-700 text-white border-emerald-700 shadow-sm"
                : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
            }`}
          >
            {locale === "hi" ? c.labelHi : locale === "mr" ? c.labelMr : c.labelEn}
          </button>
        ))}
      </div>

      {/* Mandi Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {data?.records.map((r, idx) => (
          <div
            key={idx}
            className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 flex flex-col justify-between hover:border-emerald-300 transition"
          >
            <div>
              <div className="flex items-center justify-between">
                <span className="font-semibold text-xs text-slate-900 flex items-center gap-1">
                  <Store size={14} className="text-emerald-700" />
                  {r.market}
                </span>
                <span className="text-[10px] text-slate-500 bg-white px-2 py-0.5 rounded border border-slate-200">
                  {r.district}
                </span>
              </div>
              <div className="mt-2 text-xl font-bold text-emerald-800">
                ₹{r.modalPrice.toLocaleString("en-IN")}{" "}
                <small className="text-xs font-normal text-slate-500">{r.unit}</small>
              </div>
            </div>

            <div className="mt-3 pt-2 border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-500">
              <span>
                Range: ₹{r.minPrice} - ₹{r.maxPrice}
              </span>
              <span className="flex items-center gap-0.5">
                <Calendar size={11} /> {r.arrivalDate}
              </span>
            </div>
          </div>
        ))}
      </div>

      {data?.note && (
        <div className="bg-slate-50 border border-slate-200 text-slate-600 text-[11px] p-2.5 rounded-xl flex items-center gap-2">
          <Info size={14} className="text-slate-400 shrink-0" />
          <span>{data.note}</span>
        </div>
      )}
    </div>
  );
}
export default MandiTracker;
