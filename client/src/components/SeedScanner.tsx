import { useState, useRef } from "react";
import {
  Camera,
  Upload,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  ShieldAlert,
  Loader2,
  RefreshCw,
  Volume2,
  Sprout,
  Award,
} from "lucide-react";
import type { Locale } from "@/lib/i18n";
import { CameraModal } from "./CameraModal";
import { useVoice } from "@/hooks/useVoice";

interface SeedScannerProps {
  locale: Locale;
  defaultCrop?: string;
}

interface SeedAnalysisResult {
  cropName: string;
  variety: string;
  qualityGrade: string;
  germinationEstimated: number;
  purityPercentage: number;
  isViable: boolean;
  physicalHealth: {
    uniformity: string;
    luster: string;
    moistureRisk: string;
    damageRatio: string;
  };
  symptoms: string[];
  treatments: string[];
  sowingAdvice: string;
  disclaimer: string;
}

export function SeedScanner({ locale, defaultCrop = "Onion" }: SeedScannerProps) {
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<SeedAnalysisResult | null>(null);
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
      setError("Image size exceeds 5MB limit. Please choose a smaller photo.");
      return;
    }

    setError(null);
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      setImagePreview(base64);
      analyzeSeed(base64);
    };
    reader.readAsDataURL(file);
  };

  const handleCameraCapture = (base64Image: string) => {
    setImagePreview(base64Image);
    analyzeSeed(base64Image);
  };

  const analyzeSeed = async (base64Image: string) => {
    setAnalyzing(true);
    setResult(null);
    setError(null);

    try {
      const response = await fetch("/api/analyze-seed", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          image: base64Image,
          cropName: defaultCrop,
        }),
      });

      if (!response.ok) {
        throw new Error(`Seed analysis service returned status ${response.status}`);
      }

      const data = await response.json();
      if (data.result) {
        setResult(data.result);
      } else {
        throw new Error(data.error || "No seed analysis returned");
      }
    } catch (err: any) {
      setError("Failed to complete seed quality analysis. Please try again.");
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
    const text = `Seed Quality Analysis for ${result.cropName}. Quality Grade: ${result.qualityGrade}. Estimated germination viability: ${result.germinationEstimated} percent. Purity: ${result.purityPercentage} percent. Seed treatment recommendations: ${result.treatments.join(". ")}`;
    voice.speak(text);
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden p-5">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-green-700 bg-green-50 px-2.5 py-1 rounded-md flex items-center gap-1.5 w-fit">
            <Sprout size={13} />
            Seed Quality AI Advisor
          </span>
          <h3 className="text-lg font-bold text-slate-800 mt-1">
            {locale === "hi"
              ? "बीज गुणवत्ता एवं अंकुरण परीक्षण"
              : locale === "mr"
                ? "बियाणे प्रत व उगवण क्षमता तपासणी"
                : "Seed Quality & Germination AI Inspection"}
          </h3>
          <p className="text-xs text-slate-500">
            {locale === "hi"
              ? "बीज के नमूने की फोटो खींचें या अपलोड करें और अंकुरण व उपचार सलाह पाएं"
              : locale === "mr"
                ? "बियाण्याचा फोटो काढा अथवा जोडा आणि अचूक उगवण व बीजप्रक्रिया सल्ला मिळवा"
                : "Capture or upload seed sample photo to get germination viability & treatment guide"}
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
                className="flex items-center gap-1.5 text-xs text-green-800 bg-green-50 hover:bg-green-100 border border-green-200 px-3 py-1.5 rounded-lg font-medium transition"
              >
                <Volume2 size={14} /> Listen
              </button>
            )}
            <button
              onClick={resetScanner}
              className="flex items-center gap-1 text-xs text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-lg font-medium transition"
            >
              <RefreshCw size={14} /> New Inspection
            </button>
          </div>
        )}
      </div>

      {/* Upload Drop Zone / Camera Trigger */}
      {!imagePreview && (
        <div className="border-2 border-dashed border-green-200 bg-green-50/30 rounded-xl p-6 sm:p-8 text-center flex flex-col items-center justify-center gap-4">
          <div className="w-14 h-14 rounded-full bg-green-600 text-white flex items-center justify-center shadow-md">
            <Camera size={26} />
          </div>
          <div>
            <strong className="text-sm font-semibold text-slate-800 block">
              Capture or upload seed sample photo
            </strong>
            <span className="text-xs text-slate-500">
              Spread 30-50 seeds on a plain surface and take a well-lit photo
            </span>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => setCameraOpen(true)}
              className="bg-green-700 hover:bg-green-800 text-white text-xs font-semibold px-4 py-2.5 rounded-xl shadow-sm flex items-center gap-2 transition"
            >
              <Camera size={16} /> 📸 Capture Seed Photo (Camera)
            </button>
            <button
              type="button"
              onClick={triggerUpload}
              className="bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold px-4 py-2.5 rounded-xl shadow-sm flex items-center gap-2 transition"
            >
              <Upload size={16} /> 📁 Upload Seed Image
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
              alt="Seed sample"
              className="w-28 h-28 object-cover rounded-xl border border-slate-200 shadow-sm shrink-0"
            />
            <div className="flex-1">
              {analyzing ? (
                <div className="h-28 flex flex-col items-center justify-center gap-2 text-slate-500 text-xs">
                  <Loader2 size={24} className="animate-spin text-green-600" />
                  <span>Inspecting seed physical purity, vigor, and germination viability...</span>
                </div>
              ) : result ? (
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-bold text-base text-slate-900 flex items-center gap-1.5">
                      <Award size={18} className="text-green-600" />
                      {result.qualityGrade}
                    </h4>
                    <span className="text-[11px] bg-green-100 text-green-800 font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                      <CheckCircle2 size={12} /> Certified Viable
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    <div className="bg-green-50 p-2 rounded-lg border border-green-200">
                      <span className="text-[10px] text-green-700 uppercase font-bold block">
                        Germination Viability
                      </span>
                      <strong className="text-base text-green-900">
                        {result.germinationEstimated}%
                      </strong>
                    </div>
                    <div className="bg-slate-50 p-2 rounded-lg border border-slate-200">
                      <span className="text-[10px] text-slate-600 uppercase font-bold block">
                        Physical Purity
                      </span>
                      <strong className="text-base text-slate-800">
                        {result.purityPercentage}%
                      </strong>
                    </div>
                  </div>
                </div>
              ) : null}
            </div>
          </div>

          {/* Physical Health Indicators & Treatments */}
          {result && (
            <div className="space-y-3 pt-2">
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5">
                <h5 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                  Physical Batch Metrics:
                </h5>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                  <div className="bg-white p-2 rounded-lg border border-slate-200">
                    <span className="text-slate-500 block text-[10px]">Uniformity</span>
                    <strong className="text-slate-800">{result.physicalHealth.uniformity}</strong>
                  </div>
                  <div className="bg-white p-2 rounded-lg border border-slate-200">
                    <span className="text-slate-500 block text-[10px]">Luster / Coat</span>
                    <strong className="text-slate-800">{result.physicalHealth.luster}</strong>
                  </div>
                  <div className="bg-white p-2 rounded-lg border border-slate-200">
                    <span className="text-slate-500 block text-[10px]">Moisture Risk</span>
                    <strong className="text-slate-800">{result.physicalHealth.moistureRisk}</strong>
                  </div>
                  <div className="bg-white p-2 rounded-lg border border-slate-200">
                    <span className="text-slate-500 block text-[10px]">Damaged Kernels</span>
                    <strong className="text-slate-800">{result.physicalHealth.damageRatio}</strong>
                  </div>
                </div>
              </div>

              {/* Seed Treatments */}
              <div className="bg-green-50/50 border border-green-200 rounded-xl p-3.5">
                <h5 className="text-xs font-bold uppercase tracking-wider text-green-900 mb-2 flex items-center gap-1.5">
                  <Sparkles size={14} className="text-green-700" />
                  Recommended Seed Treatment & Priming Protocol:
                </h5>
                <ul className="space-y-1.5 text-xs text-slate-700">
                  {result.treatments.map((step, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="w-4 h-4 rounded-full bg-green-200 text-green-900 font-bold flex items-center justify-center text-[10px] shrink-0 mt-0.5">
                        {idx + 1}
                      </span>
                      <span>{step}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Sowing Advice */}
              <div className="bg-slate-100 p-3 rounded-xl text-xs text-slate-700">
                <strong>Sowing & Agronomy Guide: </strong>
                {result.sowingAdvice}
              </div>

              {/* Disclaimer */}
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
        title="Capture Seed Sample Photo"
        subtitle="Spread seeds evenly on clean paper or hand and hold camera 10-15 cm above"
      />
    </div>
  );
}

export default SeedScanner;
