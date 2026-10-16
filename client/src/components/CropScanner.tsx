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
  Volume2,
} from "lucide-react";
import type { Locale } from "@/lib/i18n";
import { CameraModal } from "./CameraModal";
import { useVoice } from "@/hooks/useVoice";

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
  const [cameraOpen, setCameraOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const voice = useVoice(locale);

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

  const handleCameraCapture = (base64Image: string) => {
    setImagePreview(base64Image);
    analyzeLeaf(base64Image);
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

  const speakResult = () => {
    if (!result) return;
    const text = `${result.diseaseName}. ${result.description || ""}. Recommended treatments: ${result.treatments.join(". ")}`;
    voice.speak(text);
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden p-5">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-amber-700 bg-amber-50 px-2.5 py-1 rounded-md">
            Pest Detection AI Advisor
          </span>
          <h3 className="text-lg font-bold text-slate-800 mt-1">
            {locale === "hi"
              ? "कीट एवं फसल रोग पहचान"
              : locale === "mr"
                ? "कीड व पीक रोग ओळख व उपाय"
                : "Pest & Crop Disease AI Identification"}
          </h3>
          <p className="text-xs text-slate-500">
            {locale === "hi"
              ? "प्रभावित पत्ती या पौधे की फोटो खींचें या अपलोड करें"
              : locale === "mr"
                ? "बाधित पान किंवा पिकाचा फोटो काढा अथवा अपलोड करा"
                : "Capture a photo with camera or upload image of affected plant"}
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
          <div className="flex items-center gap-2">
            {result && (
              <button
                type="button"
                onClick={speakResult}
                className="flex items-center gap-1.5 text-xs text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-3 py-1.5 rounded-lg font-medium transition"
              >
                <Volume2 size={14} /> Listen
              </button>
            )}
            <button
              onClick={resetScanner}
              className="flex items-center gap-1 text-xs text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-lg font-medium transition"
            >
              <RefreshCw size={14} /> New Scan
            </button>
          </div>
        )}
      </div>

      {/* Upload Drop Zone / Camera Trigger */}
      {!imagePreview && (
        <div className="border-2 border-dashed border-amber-200 bg-amber-50/30 rounded-xl p-6 sm:p-8 text-center flex flex-col items-center justify-center gap-4">
          <div className="w-14 h-14 rounded-full bg-amber-600 text-white flex items-center justify-center shadow-md">
            <Camera size={26} />
          </div>
          <div>
            <strong className="text-sm font-semibold text-slate-800 block">
              Capture or upload crop & pest photo
            </strong>
            <span className="text-xs text-slate-500">
              High-resolution photo of affected leaves, stems, or pests
            </span>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => setCameraOpen(true)}
              className="bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold px-4 py-2.5 rounded-xl shadow-sm flex items-center gap-2 transition"
            >
              <Camera size={16} /> 📸 Capture Photo (Camera)
            </button>
            <button
              type="button"
              onClick={triggerUpload}
              className="bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold px-4 py-2.5 rounded-xl shadow-sm flex items-center gap-2 transition"
            >
              <Upload size={16} /> 📁 Upload from Gallery
            </button>
          </div>
        </div>
      )}

      {/* Analysis Preview & Result */}
      {imagePreview && (
        <div className="space-y-4">
          <div className="flex gap-4 items-start">
            <img
              src={imagePreview}
              alt="Uploaded leaf or pest"
              className="w-28 h-28 object-cover rounded-xl border border-slate-200 shadow-sm shrink-0"
            />
            <div className="flex-1">
              {analyzing ? (
                <div className="h-28 flex flex-col items-center justify-center gap-2 text-slate-500 text-xs">
                  <Loader2 size={24} className="animate-spin text-amber-600" />
                  <span>Sending photo to Pest AI Advisor for diagnosis...</span>
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
                        <AlertTriangle size={12} /> Infestation / Stress
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-600 mt-1">
                    Crop: <strong>{result.plantName}</strong> | AI Confidence:{" "}
                    <strong>{Math.round(result.confidence * 100)}%</strong>
                  </p>
                  <div className="w-full bg-slate-100 rounded-full h-1.5 mt-2 overflow-hidden">
                    <div
                      className="bg-amber-600 h-full rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(100, Math.round(result.confidence * 100))}%` }}
                    />
                  </div>
                  {result.description && (
                    <p className="text-xs text-slate-600 mt-2">{result.description}</p>
                  )}
                </div>
              ) : null}
            </div>
          </div>

          {/* Recommendations & Action Steps */}
          {result && (
            <div className="space-y-3 pt-2">
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5">
                <h5 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-2 flex items-center gap-1.5">
                  <Sparkles size={14} className="text-amber-600" />
                  Recommended Treatment & Control Steps:
                </h5>
                <ul className="space-y-1.5 text-xs text-slate-700">
                  {result.treatments.map((step, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="w-4 h-4 rounded-full bg-amber-100 text-amber-900 font-bold flex items-center justify-center text-[10px] shrink-0 mt-0.5">
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

      {/* Live Camera Viewfinder Modal */}
      <CameraModal
        isOpen={cameraOpen}
        onClose={() => setCameraOpen(false)}
        onCapture={handleCameraCapture}
        title="Capture Pest / Leaf Photo"
        subtitle="Hold steady and align the damaged leaf or insect within the frame"
      />
    </div>
  );
}

export default CropScanner;
