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
  VolumeX,
  Leaf,
  Bug,
  ShieldCheck,
  FlaskConical,
  XCircle,
} from "lucide-react";
import type { Locale } from "@/lib/i18n";
import { useVoice } from "@/hooks/useVoice";
import { analyzeImagePixels } from "@/lib/imageValidator";

interface LeafPestScannerProps {
  locale: Locale;
  defaultCrop?: string;
  className?: string;
}

interface PestDiagnosisData {
  plantName: string;
  isHealthy: boolean;
  diseaseName: string;
  confidence: number;
  severity: "Low" | "Moderate" | "High" | "None";
  description: string;
  symptoms: string[];
  treatments: {
    biological: string[];
    chemical: string[];
  };
  prevention: string[];
  disclaimer: string;
}

/**
 * Client-Side Image Compressor & Botanical Canvas Analyzer
 */
function processLeafImage(
  file: File,
  maxDim = 1280,
  quality = 0.82
): Promise<{ base64: string; canvas: HTMLCanvasElement }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          resolve({ base64: e.target?.result as string, canvas });
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        const base64 = canvas.toDataURL("image/jpeg", quality);
        resolve({ base64, canvas });
      };
      img.onerror = reject;
      img.src = e.target?.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export function LeafPestScanner({ locale, defaultCrop = "Onion", className = "" }: LeafPestScannerProps) {
  const voice = useVoice(locale);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<PestDiagnosisData | null>(null);
  const [provider, setProvider] = useState<string>("");
  const [validationError, setValidationError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const t = {
    en: {
      badge: "🍃 Plant Leaf Only",
      title: "Crop Leaf Pest & Disease Detector",
      subTitle: "Upload a clear photo of an affected plant leaf to identify pests and diseases.",
      strictNotice: "Strict Validation: Accepts ONLY plant leaves. Photos of seeds, faces, animals, or objects will be rejected.",
      tapToCapture: "Tap to capture or choose plant leaf photo",
      cameraOrGallery: "Camera or Gallery (auto-compressed for rural 2G/3G)",
      selectBtn: "Select Leaf Photo",
      analyzingText: "Analyzing leaf tissue & checking for pests / diseases...",
      newScan: "New Leaf Scan",
      listenBtn: "Listen Diagnosis",
      confidence: "Confidence",
      severity: "Severity",
      symptomsTitle: "Observed Leaf Symptoms",
      bioTitle: "Biological & Organic Remedies",
      chemTitle: "Chemical Treatments & Dosage (ICAR Standard)",
      prevTitle: "Preventive Care & Field Practices",
      healthyTitle: "Leaf Appears Healthy & Vigorous!",
    },
    hi: {
      badge: "🍃 केवल पौधों की पत्ती",
      title: "फसल पत्ती कीट एवं रोग पहचान",
      subTitle: "कीट व रोगों की पहचान के लिए प्रभावित पौधे की पत्ती की स्पष्ट फोटो अपलोड करें।",
      strictNotice: "सख्त नियम: केवल पत्तियों की फोटो स्वीकार की जाती है। बीज, चेहरा, जानवर या अन्य फोटो खारिज कर दिए जाएंगे।",
      tapToCapture: "पत्ती की फोटो खींचने या चुनने के लिए टैप करें",
      cameraOrGallery: "कैमरा या गैलरी (धीमे 2G/3G नेटवर्क हेतु स्व-कंप्रेस्ड)",
      selectBtn: "पत्ती की फोटो चुनें",
      analyzingText: "पत्ती के ऊतकों की जांच व कीट/रोग विश्लेषण जारी है...",
      newScan: "नई पत्ती जांचें",
      listenBtn: "निदान सुनें",
      confidence: "सटीकता (Confidence)",
      severity: "गंभीरता (Severity)",
      symptomsTitle: "पत्ती पर देखे गए लक्षण",
      bioTitle: "जैविक एवं प्राकृतिक उपचार",
      chemTitle: "रासायनिक उपचार एवं सुरक्षित मात्रा (ICAR मानक)",
      prevTitle: "रोकथाम एवं खेत प्रबंधन",
      healthyTitle: "पत्ती पूरी तरह स्वस्थ और हरी-भरी है!",
    },
    mr: {
      badge: "🍃 केवळ झाडाचे पान",
      title: "पीक पान कीड व रोग अचूक निदान",
      subTitle: "कीड व बुरशीजन्य रोगांच्या अचूक निदानासाठी पिकाच्या बाधित पानाचा स्पष्ट फोटो अपलोड करा.",
      strictNotice: "सक्त अट: येथे केवळ वनस्पतींच्या पानांचाच फोटो स्वीकारला जातो. बियाणे, चेहरा किंवा इतर वस्तूंचा फोटो नाकारला जाईल.",
      tapToCapture: "पानाचा फोटो काढण्यासाठी किंवा निवडण्यासाठी टॅप करा",
      cameraOrGallery: "कॅमेरा किंवा गॅलरी (ग्रामीण 2G/3G साठी स्वयंचलित कंप्रेस्ड)",
      selectBtn: "पानाचा फोटो निवडा",
      analyzingText: "पानाचे विश्लेषण आणि कीड व रोगाचा शोध सुरू आहे...",
      newScan: "नवीन पान तपासा",
      listenBtn: "सल्ला ऐका",
      confidence: "अचूकता (Confidence)",
      severity: "तीव्रता (Severity)",
      symptomsTitle: "पानावर आढळलेली लक्षणे",
      bioTitle: "जैविक व सेंद्रिय नियंत्रण पद्धती",
      chemTitle: "रासायनिक औषध फवारणी व प्रमाण (ICAR शिफारस)",
      prevTitle: "प्रतिबंधात्मक उपाय व शेत नियोजन",
      healthyTitle: "पान निरोगी व उत्तम स्थितीत आहे!",
    },
  }[locale];

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setValidationError("Please select a valid image file (JPEG, PNG, or WebP).");
      return;
    }

    setValidationError(null);
    setResult(null);
    setAnalyzing(true);

    try {
      const { base64, canvas } = await processLeafImage(file);
      setImagePreview(base64);

      // 1. Run local client-side pre-validation
      const clientMetrics = analyzeImagePixels(canvas, "leaf");

      if (clientMetrics.rejectionReason) {
        setValidationError(clientMetrics.rejectionReason[locale]);
        setAnalyzing(false);
        return;
      }

      // 2. Query backend /api/pest/detect with strict leaf enforcement
      const singleApiKey =
        typeof window !== "undefined"
          ? localStorage.getItem("agrisathi_single_ai_key") ||
            localStorage.getItem("agrisathi_custom_api_key") ||
            ""
          : "";

      const res = await fetch("/api/pest/detect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          image: base64,
          cropName: defaultCrop,
          apiKey: singleApiKey.trim() || undefined,
          language: locale,
          clientMetrics,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.isLeaf) {
        setValidationError(
          data.error ||
            "❌ Invalid image: Only plant leaves are accepted for pest detection. Please upload a clear photo of a plant leaf."
        );
        return;
      }

      setResult(data.result);
      setProvider(data.provider || "AgriSathi ICAR Pest Expert System");
    } catch (err: any) {
      setValidationError(err.message || "Failed to complete leaf scan. Please try a clearer leaf photo.");
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
    setValidationError(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const speakResult = () => {
    if (!result) return;
    const bioText = result.treatments?.biological?.slice(0, 2).join(". ") || "";
    const chemText = result.treatments?.chemical?.slice(0, 2).join(". ") || "";

    const text =
      locale === "mr"
        ? `पिकाचे नाव: ${result.plantName}. रोग किंवा कीड: ${result.diseaseName}. तीव्रता: ${result.severity}. जैविक उपाय: ${bioText}. रासायनिक फवारणी: ${chemText}.`
        : locale === "hi"
        ? `फसल: ${result.plantName}। कीट या रोग: ${result.diseaseName}। तीव्रता: ${result.severity}। जैविक उपाय: ${bioText}। रासायनिक उपचार: ${chemText}।`
        : `Crop: ${result.plantName}. Pest or Disease: ${result.diseaseName}. Severity: ${result.severity}. Biological remedy: ${bioText}. Chemical treatment: ${chemText}.`;

    voice.speak(text);
  };

  return (
    <div className={`bg-white rounded-2xl border border-emerald-200/90 shadow-sm overflow-hidden p-5 ${className}`}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 text-xs font-bold uppercase tracking-wider text-emerald-800 bg-emerald-100/80 px-2.5 py-1 rounded-md">
              <Leaf size={13} className="text-emerald-700" />
              {t.badge}
            </span>
            <span className="text-xs text-slate-500 font-medium bg-slate-100 px-2 py-0.5 rounded">
              ICAR Plant Pathology
            </span>
          </div>
          <h3 className="text-lg font-bold text-slate-800 mt-1 flex items-center gap-2">
            <Bug size={20} className="text-emerald-700" />
            {t.title}
          </h3>
          <p className="text-xs text-slate-600 mt-0.5">{t.subTitle}</p>
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
          <div className="flex items-center gap-2 self-start sm:self-auto">
            {result && (
              <button
                onClick={speakResult}
                className="flex items-center gap-1 text-xs bg-emerald-50 hover:bg-emerald-100 text-emerald-800 px-3 py-1.5 rounded-lg font-semibold transition border border-emerald-200"
              >
                <Volume2 size={14} /> {t.listenBtn}
              </button>
            )}
            <button
              onClick={resetScanner}
              className="flex items-center gap-1 text-xs text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-lg font-medium transition"
            >
              <RefreshCw size={14} /> {t.newScan}
            </button>
          </div>
        )}
      </div>

      {/* Strict Leaf Requirement Alert Banner */}
      {!imagePreview && (
        <div className="mb-4 bg-emerald-50/70 border border-emerald-200 text-emerald-900 rounded-xl p-3 text-xs flex items-start gap-2.5">
          <Info size={16} className="text-emerald-700 shrink-0 mt-0.5" />
          <div>
            <strong className="font-semibold block">{t.strictNotice}</strong>
            <span className="text-emerald-800/80 text-[11px]">
              {locale === "mr"
                ? "पानांवर दिसणारे पांढरे डाग, पिवळेपणा, सुरकुत्या किंवा किडींचे अचूक निदान करण्यासाठी कॅमेरा पानाच्या जवळ धरून फोटो काढा."
                : locale === "hi"
                ? "पत्तियों पर दिखने वाले सफेद धब्बे, पीलापन, मुड़ाव अथवा कीड़ों की पहचान हेतु कैमरा पत्ती के पास रखकर स्पष्ट फोटो लें।"
                : "Hold camera 10-15 cm away from the leaf in daylight for optimal pest & disease diagnosis."}
            </span>
          </div>
        </div>
      )}

      {/* Upload Drop Zone / Camera Trigger */}
      {!imagePreview && (
        <div
          onClick={triggerUpload}
          className="border-2 border-dashed border-emerald-300 hover:border-emerald-600 bg-emerald-50/30 hover:bg-emerald-50/60 rounded-xl p-8 text-center cursor-pointer transition flex flex-col items-center justify-center gap-3"
        >
          <div className="w-14 h-14 rounded-full bg-emerald-700 text-white flex items-center justify-center shadow-md">
            <Camera size={26} />
          </div>
          <div>
            <strong className="text-sm font-semibold text-slate-800 block">{t.tapToCapture}</strong>
            <span className="text-xs text-slate-500">{t.cameraOrGallery}</span>
          </div>
          <button
            type="button"
            className="mt-1 bg-white border border-emerald-300 text-emerald-800 text-xs font-semibold px-4 py-2 rounded-lg shadow-xs flex items-center gap-1.5"
          >
            <Upload size={14} /> {t.selectBtn}
          </button>
        </div>
      )}

      {/* Analyzing Spinner */}
      {analyzing && (
        <div className="py-12 flex flex-col items-center justify-center gap-3">
          <Loader2 className="animate-spin text-emerald-700" size={36} />
          <p className="text-sm font-semibold text-slate-700">{t.analyzingText}</p>
          <span className="text-xs text-slate-500">Checking botanical leaf markers & pathology patterns</span>
        </div>
      )}

      {/* Strict Non-Leaf Rejection Alert Box */}
      {validationError && (
        <div className="my-4 bg-rose-50 border-2 border-rose-300 rounded-xl p-4 text-rose-900 animate-in fade-in">
          <div className="flex items-start gap-3">
            <XCircle size={22} className="text-rose-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h4 className="font-bold text-sm text-rose-950">
                {locale === "mr" ? "अमान्य फोटो नाकारण्यात आला" : locale === "hi" ? "अमान्य फोटो खारिज किया गया" : "Invalid Photo Rejected"}
              </h4>
              <p className="text-xs text-rose-800 font-medium leading-relaxed">{validationError}</p>
              <div className="pt-2">
                <button
                  onClick={resetScanner}
                  className="text-xs bg-rose-600 hover:bg-rose-700 text-white font-semibold px-3 py-1.5 rounded-lg transition inline-flex items-center gap-1.5 shadow-xs"
                >
                  <RefreshCw size={13} /> {locale === "mr" ? "पानाचा दुसरा फोटो काढा" : locale === "hi" ? "पत्ती का दूसरा फोटो लें" : "Upload A Plant Leaf Photo"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Valid Diagnosis Results Display */}
      {result && !analyzing && (
        <div className="mt-4 space-y-4 animate-in fade-in">
          {/* Top Leaf Status Card */}
          <div className="flex flex-col md:flex-row gap-4 bg-slate-50 rounded-xl p-4 border border-slate-200">
            {imagePreview && (
              <div className="w-full md:w-36 h-36 rounded-lg overflow-hidden border border-slate-300 shrink-0 relative bg-black">
                <img src={imagePreview} alt="Leaf Preview" className="w-full h-full object-cover" />
                <span className="absolute bottom-1 right-1 bg-black/75 text-white text-[10px] px-1.5 py-0.5 rounded font-mono">
                  🍃 Leaf Verified
                </span>
              </div>
            )}

            <div className="flex-1 space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h4 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <span className="text-emerald-700">🌱 {result.plantName}</span>
                </h4>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-200 text-slate-800">
                    {t.confidence}: {Math.round(result.confidence * 100)}%
                  </span>
                  <span
                    className={`text-xs font-bold px-2 py-0.5 rounded ${
                      result.severity === "High"
                        ? "bg-rose-100 text-rose-800 border border-rose-300"
                        : result.severity === "Moderate"
                        ? "bg-amber-100 text-amber-800 border border-amber-300"
                        : "bg-emerald-100 text-emerald-800 border border-emerald-300"
                    }`}
                  >
                    {t.severity}: {result.severity}
                  </span>
                </div>
              </div>

              <div className="p-2.5 rounded-lg bg-white border border-slate-200/80">
                <div className="flex items-center gap-2 text-rose-800 font-bold text-sm">
                  <AlertTriangle size={16} />
                  <span>{result.diseaseName}</span>
                </div>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">{result.description}</p>
              </div>

              <div className="text-[11px] text-slate-500 flex items-center justify-between">
                <span>Diagnostic Engine: <strong className="text-slate-700">{provider}</strong></span>
              </div>
            </div>
          </div>

          {/* Symptoms List */}
          {result.symptoms && result.symptoms.length > 0 && (
            <div className="bg-amber-50/50 border border-amber-200 rounded-xl p-3.5">
              <h5 className="text-xs font-bold text-amber-900 uppercase tracking-wide flex items-center gap-1.5 mb-2">
                <Info size={14} className="text-amber-700" />
                {t.symptomsTitle}
              </h5>
              <ul className="space-y-1.5 text-xs text-amber-950">
                {result.symptoms.map((s, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-amber-600 font-bold">•</span>
                    <span>{s}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Biological & Chemical Treatments Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {/* Biological Remedies */}
            <div className="bg-emerald-50/60 border border-emerald-200 rounded-xl p-3.5 space-y-2">
              <h5 className="text-xs font-bold text-emerald-900 uppercase tracking-wide flex items-center gap-1.5">
                <ShieldCheck size={14} className="text-emerald-700" />
                {t.bioTitle}
              </h5>
              <ul className="space-y-2 text-xs text-emerald-950">
                {result.treatments?.biological?.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-emerald-600 font-bold">✓</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Chemical Treatments */}
            <div className="bg-sky-50/60 border border-sky-200 rounded-xl p-3.5 space-y-2">
              <h5 className="text-xs font-bold text-sky-900 uppercase tracking-wide flex items-center gap-1.5">
                <FlaskConical size={14} className="text-sky-700" />
                {t.chemTitle}
              </h5>
              <ul className="space-y-2 text-xs text-sky-950">
                {result.treatments?.chemical?.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-sky-600 font-bold">⚡</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Preventive Care */}
          {result.prevention && result.prevention.length > 0 && (
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5">
              <h5 className="text-xs font-bold text-slate-800 uppercase tracking-wide flex items-center gap-1.5 mb-2">
                <ShieldAlert size={14} className="text-slate-600" />
                {t.prevTitle}
              </h5>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {result.prevention.map((item, idx) => (
                  <div key={idx} className="text-xs text-slate-700 bg-white p-2 rounded-lg border border-slate-200">
                    {item}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Disclaimer */}
          <p className="text-[11px] text-slate-500 italic text-center pt-1">{result.disclaimer}</p>
        </div>
      )}
    </div>
  );
}
