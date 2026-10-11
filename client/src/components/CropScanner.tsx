import { useState, useRef } from "react";
import {
  Camera,
  Upload,
  AlertTriangle,
  CheckCircle2,
  Sparkles,
  ShieldAlert,
  Loader2,
  RefreshCw,
  Info,
} from "lucide-react";
import type { Locale } from "@/lib/i18n";
import { cn } from "@/lib/utils";

interface CropScannerProps {
  locale: Locale;
  defaultCrop?: string;
}

interface DiagnosisResult {
  plantName: string;
  isHealthy: boolean;
  diseaseName: string;
  confidence: number;
  description?: string;
  symptoms?: string;
  treatments: string[];
  disclaimer: string;
}

export function CropScanner({ locale, defaultCrop = "Onion" }: CropScannerProps) {
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<DiagnosisResult | null>(null);
  const [configured, setConfigured] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Please select a valid image file (JPEG, PNG, or WebP).");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError("Image size exceeds 5MB limit. Please take or choose a smaller photo.");
      return;
    }

    setError(null);
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      setImagePreview(base64);
      analyzeLeaf(base64);
    };
    reader.readAsDataURL(file);
  };

  const analyzeLeaf = async (base64Image: string) => {
    setAnalyzing(true);
    setResult(null);
    setError(null);

    try {
      const response = await fetch("/api/identify-disease", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          image: base64Image,
          cropName: defaultCrop,
        }),
      });

      if (!response.ok) {
        throw new Error(`Diagnosis service returned status ${response.status}`);
      }

      const data = await response.json();
      setConfigured(data.configured ?? false);
      if (data.result) {
        setResult(data.result);
      } else {
        throw new Error(data.error || "No diagnosis result returned");
      }
    } catch (err: any) {
      setError("Failed to complete plant scan. Please check network connection or try again.");
    } finally {
      setAnalyzing(false);
    }
  };

  const triggerUpload = () => {
    fileInputRef.current?.click();
  };

  const resetScanner = () => {
    setImagePreview(null);
    setResult(null);
    setError(null);
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md">
            ICAR / Plant.id Diagnostic
          </span>
          <h3 className="text-lg font-bold text-slate-800 mt-1">
            {locale === "hi"
              ? "फसल रोग पहचान एवं निदान"
              : locale === "mr"
                ? "पीक रोग ओळख आणि उपाय"
                : "Crop Disease Identification & Care"}
          </h3>
          <p className="text-xs text-slate-500">
            {locale === "hi"
              ? "पत्ती या पौधे की स्पष्ट फोटो अपलोड करें"
              : locale === "mr"
                ? "पानाची किंवा पिकाची स्पष्ट फोटो जोडा"
                : "Upload or capture a clear photo of an affected leaf or plant"}
          </p>
        </div>

        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept="image/*"
          capture="environment"
          className="hidden"
        />

        {imagePreview && (
          <button
            onClick={resetScanner}
            className="flex items-center gap-1 text-xs text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-lg font-medium transition"
          >
            <RefreshCw size={14} /> New Scan
          </button>
        )}
      </div>

      {/* Upload Drop Zone / Camera Trigger */}
      {!imagePreview && (
        <div
          onClick={triggerUpload}
          className="border-2 border-dashed border-emerald-200 hover:border-emerald-500 bg-emerald-50/40 hover:bg-emerald-50/70 rounded-xl p-8 text-center cursor-pointer transition flex flex-col items-center justify-center gap-3"
        >
          <div className="w-14 h-14 rounded-full bg-emerald-600 text-white flex items-center justify-center shadow-md">
            <Camera size={26} />
          </div>
          <div>
            <strong className="text-sm font-semibold text-slate-800 block">
              Tap to take photo or choose image
            </strong>
            <span className="text-xs text-slate-500">
              Supports JPEG, PNG, WebP up to 5MB
            </span>
          </div>
          <button
            type="button"
            className="mt-1 bg-white border border-emerald-300 text-emerald-800 text-xs font-semibold px-4 py-2 rounded-lg shadow-sm flex items-center gap-1.5"
          >
            <Upload size={14} /> Select Crop Photo
          </button>
        </div>
      )}

      {/* Analysis Preview & Result */}
      {imagePreview && (
        <div className="space-y-4">
          <div className="flex gap-4 items-start">
            <img
              src={imagePreview}
              alt="Uploaded leaf"
              className="w-28 h-28 object-cover rounded-xl border border-slate-200 shadow-sm shrink-0"
            />
            <div className="flex-1">
              {analyzing ? (
                <div className="h-28 flex flex-col items-center justify-center gap-2 text-slate-500 text-xs">
                  <Loader2 size={24} className="animate-spin text-emerald-600" />
                  <span>Scanning leaf pathology and symptom patterns...</span>
                </div>
              ) : result ? (
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-bold text-base text-slate-900">
                      {result.diseaseName}
                    </h4>
                    {result.isHealthy ? (
                      <span className="text-[11px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                        <CheckCircle2 size={12} /> Healthy
                      </span>
                    ) : (
                      <span className="text-[11px] bg-amber-100 text-amber-800 font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                        <AlertTriangle size={12} /> Stress Detected
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-600 mt-1">
                    Plant: <strong>{result.plantName}</strong> | Confidence:{" "}
                    <strong>{Math.round(result.confidence * 100)}%</strong>
                  </p>
                  <div className="w-full bg-slate-100 rounded-full h-1.5 mt-2 overflow-hidden">
                    <div
                      className="bg-emerald-600 h-full rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(100, Math.round(result.confidence * 100))}%` }}
                    />
                  </div>
                </div>
              ) : null}
            </div>
          </div>

          {/* Configuration notice if live API key is missing */}
          {!configured && (
            <div className="bg-blue-50 border border-blue-200 text-blue-900 text-xs p-3 rounded-xl flex items-start gap-2">
              <Info size={16} className="text-blue-600 shrink-0 mt-0.5" />
              <div>
                <strong>Reference Guide Mode:</strong> Showing verified crop symptom benchmark. To activate real-time neural vision diagnosis, add <code className="bg-blue-100 px-1 py-0.5 rounded text-[11px]">PLANT_ID_API_KEY</code> from <a href="https://plant.id/" target="_blank" rel="noreferrer" className="underline font-bold">Plant.id</a> to your server <code className="bg-blue-100 px-1 py-0.5 rounded text-[11px]">.env</code> file.
              </div>
            </div>
          )}

          {/* Recommendations & Action Steps */}
          {result && (
            <div className="space-y-3 pt-2">
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5">
                <h5 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                  Recommended Action Steps:
                </h5>
                <ul className="space-y-1.5 text-xs text-slate-700">
                  {result.treatments.map((step, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center text-[10px] shrink-0 mt-0.5">
                        {idx + 1}
                      </span>
                      <span>{step}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Safety Advisory Disclaimer */}
              <div className="bg-amber-50 border border-amber-200 text-amber-900 text-[11px] p-2.5 rounded-xl flex items-center gap-2">
                <ShieldAlert size={15} className="text-amber-700 shrink-0" />
                <span>{result.disclaimer}</span>
              </div>
            </div>
          )}

          {error && (
            <div className="bg-rose-50 border border-rose-200 text-rose-800 text-xs p-3 rounded-xl">
              {error}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
export default CropScanner;
