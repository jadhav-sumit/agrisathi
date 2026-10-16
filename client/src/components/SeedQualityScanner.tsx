import { useState, useRef } from "react";
import {
  Camera,
  Upload,
  AlertTriangle,
  CheckCircle2,
  Sparkles,
  ShieldCheck,
  Loader2,
  RefreshCw,
  Info,
  Volume2,
  Sprout,
  Percent,
  TrendingUp,
  Droplets,
  PackageCheck,
  XCircle,
} from "lucide-react";
import type { Locale } from "@/lib/i18n";
import { useVoice } from "@/hooks/useVoice";
import { analyzeImagePixels } from "@/lib/imageValidator";

interface SeedQualityScannerProps {
  locale: Locale;
  defaultCrop?: string;
  className?: string;
}

interface SeedAnalysisData {
  cropName: string;
  variety: string;
  purityPercentage: number;
  germinationPotential: number;
  healthStatus: string;
  defects: string[];
  moistureAssessment: string;
  recommendedTreatment: string[];
  sowingAdvice: string[];
  disclaimer: string;
}

/**
 * Client-Side Image Compressor & Seed Grain Canvas Analyzer
 */
function processSeedImage(
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

export function SeedQualityScanner({ locale, defaultCrop = "Onion", className = "" }: SeedQualityScannerProps) {
  const voice = useVoice(locale);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<SeedAnalysisData | null>(null);
  const [provider, setProvider] = useState<string>("");
  const [validationError, setValidationError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const t = {
    en: {
      badge: "🌾 Seeds Only",
      title: "Seed Quality & Germination Analyzer",
      subTitle: "Upload a photo of crop seeds on a clean surface to test physical purity and germination potential.",
      strictNotice: "Strict Validation: Accepts ONLY crop seeds/grains. Photos of plant leaves, faces, or objects will be rejected.",
      tapToCapture: "Tap to capture or choose crop seed photo",
      cameraOrGallery: "Camera or Gallery (auto-compressed for rural 2G/3G)",
      selectBtn: "Select Seed Photo",
      analyzingText: "Analyzing seed grain clustering, coat purity & viability...",
      newScan: "New Seed Scan",
      listenBtn: "Listen Analysis",
      purityLabel: "Physical Purity",
      germLabel: "Germination Potential",
      healthLabel: "Batch Health Grade",
      defectsTitle: "Defect & Impurity Screening",
      treatmentTitle: "Recommended Certified Pre-Sowing Treatments",
      sowingTitle: "Actionable Sowing & Cloth Germination Guide",
      moistureTitle: "Moisture & Storage Assessment",
    },
    hi: {
      badge: "🌾 केवल फसल के बीज",
      title: "बीज गुणवत्ता एवं अंकुरण क्षमता विश्लेषण",
      subTitle: "भौतिक शुद्धता और अंकुरण क्षमता जांचने के लिए साफ सतह पर रखे बीजों की फोटो अपलोड करें।",
      strictNotice: "सख्त नियम: केवल बीजों की फोटो स्वीकार की जाती है। पत्ती, चेहरा, जानवर या अन्य फोटो खारिज कर दिए जाएंगे।",
      tapToCapture: "बीज की फोटो खींचने या चुनने के लिए टैप करें",
      cameraOrGallery: "कैमरा या गैलरी (धीमे 2G/3G नेटवर्क हेतु स्व-कंप्रेस्ड)",
      selectBtn: "बीज की फोटो चुनें",
      analyzingText: "बीजों के आकार, छिलके की शुद्धता व अंकुरण क्षमता का विश्लेषण जारी है...",
      newScan: "नया बीज लॉट जांचें",
      listenBtn: "सलाह सुनें",
      purityLabel: "भौतिक शुद्धता",
      germLabel: "अनुमानित अंकुरण",
      healthLabel: "बीज स्वास्थ्य ग्रेड",
      defectsTitle: "कचरा एवं क्षति जांच",
      treatmentTitle: "प्रमाणित बीजोपचार (बुवाई से पूर्व)",
      sowingTitle: "बुवाई व 7-दिवसीय कपड़ा अंकुरण विधि",
      moistureTitle: "नमी एवं सुरक्षित भंडारण स्थिति",
    },
    mr: {
      badge: "🌾 केवळ शेती बियाणे",
      title: "बियाणे प्रत व उगवण क्षमता विश्लेषण",
      subTitle: "भौतिक शुद्धता आणि उगवण क्षमता तपासण्यासाठी सपाट पृष्ठभागावर ठेवलेल्या बियाण्यांचा स्पष्ट फोटो जोडा.",
      strictNotice: "सक्त अट: येथे केवळ शेती बियाण्यांचाच फोटो स्वीकारला जातो. झाडाची पाने, चेहरा किंवा इतर वस्तूंचा फोटो नाकारला जाईल.",
      tapToCapture: "बियाण्यांचा फोटो काढण्यासाठी किंवा निवडण्यासाठी टॅप करा",
      cameraOrGallery: "कॅमेरा किंवा गॅलरी (ग्रामीण 2G/3G साठी स्वयंचलित कंप्रेस्ड)",
      selectBtn: "बियाणे फोटो निवडा",
      analyzingText: "बियाण्यांचा पोत, टपोरेपणा व उगवण क्षमता तपासली जात आहे...",
      newScan: "नवीन बियाणे तपासा",
      listenBtn: "सल्ला ऐका",
      purityLabel: "भौतिक शुद्धता",
      germLabel: "अंदाजे उगवण क्षमता",
      healthLabel: "बियाणे दर्जा प्रत",
      defectsTitle: "दोष व कचरा तपासणी",
      treatmentTitle: "पेरणीपूर्वी शिफारशीत बीजप्रक्रिया",
      sowingTitle: "पेरणी पद्धत व घरगुती कापड उगवण चाचणी",
      moistureTitle: "ओलावा आणि साठवणूक सुरक्षितता",
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
      const { base64, canvas } = await processSeedImage(file);
      setImagePreview(base64);

      // 1. Run local client-side pre-validation
      const clientMetrics = analyzeImagePixels(canvas, "seed");

      if (clientMetrics.rejectionReason) {
        setValidationError(clientMetrics.rejectionReason[locale]);
        setAnalyzing(false);
        return;
      }

      // 2. Query backend /api/seed/analyze with strict seed enforcement
      const singleApiKey =
        typeof window !== "undefined"
          ? localStorage.getItem("agrisathi_single_ai_key") ||
            localStorage.getItem("agrisathi_custom_api_key") ||
            ""
          : "";

      const res = await fetch("/api/seed/analyze", {
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

      if (!res.ok || !data.isSeeds) {
        setValidationError(
          data.error ||
            "❌ Invalid image: Only agricultural seeds are accepted for seed quality analysis. Please upload a clear photo of seeds."
        );
        return;
      }

      setResult(data.result);
      setProvider(data.provider || "AgriSathi SeedNet Quality Standard");
    } catch (err: any) {
      setValidationError(err.message || "Failed to complete seed scan. Please try a clearer photo of seeds.");
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
    const text =
      locale === "mr"
        ? `बियाणे जात: ${result.cropName}. शुद्धता: ${result.purityPercentage} टक्के. अंदाजे उगवण: ${result.germinationPotential} टक्के. दर्जा: ${result.healthStatus}. बीजप्रक्रिया: ${result.recommendedTreatment.join(". ")}`
        : locale === "hi"
        ? `बीज: ${result.cropName}। शुद्धता: ${result.purityPercentage}%। संभावित अंकुरण: ${result.germinationPotential}%। स्थिति: ${result.healthStatus}। बीजोपचार: ${result.recommendedTreatment.join(". ")}`
        : `Seed lot: ${result.cropName}. Purity: ${result.purityPercentage}%. Germination Potential: ${result.germinationPotential}%. Quality: ${result.healthStatus}. Recommended Treatment: ${result.recommendedTreatment.join(". ")}`;

    voice.speak(text);
  };

  return (
    <div className={`bg-white rounded-2xl border border-amber-200/90 shadow-sm overflow-hidden p-5 ${className}`}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 text-xs font-bold uppercase tracking-wider text-amber-900 bg-amber-100 px-2.5 py-1 rounded-md">
              <Sprout size={13} className="text-amber-800" />
              {t.badge}
            </span>
            <span className="text-xs text-slate-500 font-medium bg-slate-100 px-2 py-0.5 rounded">
              SeedNet & ICAR Testing Lab
            </span>
          </div>
          <h3 className="text-lg font-bold text-slate-800 mt-1 flex items-center gap-2">
            <PackageCheck size={20} className="text-amber-700" />
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
                className="flex items-center gap-1 text-xs bg-amber-50 hover:bg-amber-100 text-amber-900 px-3 py-1.5 rounded-lg font-semibold transition border border-amber-200"
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

      {/* Strict Seeds Requirement Alert Banner */}
      {!imagePreview && (
        <div className="mb-4 bg-amber-50/70 border border-amber-200 text-amber-950 rounded-xl p-3 text-xs flex items-start gap-2.5">
          <Info size={16} className="text-amber-700 shrink-0 mt-0.5" />
          <div>
            <strong className="font-semibold block">{t.strictNotice}</strong>
            <span className="text-amber-800/80 text-[11px]">
              {locale === "mr"
                ? "बियाण्यांची शुद्धता, टपोरेपणा व उगवण क्षमता तपासण्यासाठी बियाणे पांढऱ्या कागदावर किंवा सपाट पृष्ठभागावर पसरवून चांगल्या उजेडात फोटो काढा."
                : locale === "hi"
                ? "बीजों की शुद्धता और अंकुरण क्षमता मापने के लिए बीजों को सफेद कागज अथवा साफ सतह पर फैलाकर अच्छी रोशनी में फोटो लें।"
                : "Scatter 50-100 seeds across a clean light surface in good daylight for highest accuracy."}
            </span>
          </div>
        </div>
      )}

      {/* Upload Drop Zone / Camera Trigger */}
      {!imagePreview && (
        <div
          onClick={triggerUpload}
          className="border-2 border-dashed border-amber-300 hover:border-amber-600 bg-amber-50/30 hover:bg-amber-50/60 rounded-xl p-8 text-center cursor-pointer transition flex flex-col items-center justify-center gap-3"
        >
          <div className="w-14 h-14 rounded-full bg-amber-700 text-white flex items-center justify-center shadow-md">
            <Camera size={26} />
          </div>
          <div>
            <strong className="text-sm font-semibold text-slate-800 block">{t.tapToCapture}</strong>
            <span className="text-xs text-slate-500">{t.cameraOrGallery}</span>
          </div>
          <button
            type="button"
            className="mt-1 bg-white border border-amber-300 text-amber-900 text-xs font-semibold px-4 py-2 rounded-lg shadow-xs flex items-center gap-1.5"
          >
            <Upload size={14} /> {t.selectBtn}
          </button>
        </div>
      )}

      {/* Analyzing Spinner */}
      {analyzing && (
        <div className="py-12 flex flex-col items-center justify-center gap-3">
          <Loader2 className="animate-spin text-amber-700" size={36} />
          <p className="text-sm font-semibold text-slate-700">{t.analyzingText}</p>
          <span className="text-xs text-slate-500">Checking grain granularity, foreign chaff & physiological maturity</span>
        </div>
      )}

      {/* Strict Non-Seed Rejection Alert Box */}
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
                  <RefreshCw size={13} /> {locale === "mr" ? "बियाण्यांचा दुसरा फोटो काढा" : locale === "hi" ? "बीजों का दूसरा फोटो लें" : "Upload A Crop Seed Photo"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Valid Seed Quality Results Display */}
      {result && !analyzing && (
        <div className="mt-4 space-y-4 animate-in fade-in">
          {/* Top Seed Overview Card */}
          <div className="flex flex-col md:flex-row gap-4 bg-slate-50 rounded-xl p-4 border border-slate-200">
            {imagePreview && (
              <div className="w-full md:w-36 h-36 rounded-lg overflow-hidden border border-slate-300 shrink-0 relative bg-black">
                <img src={imagePreview} alt="Seed Preview" className="w-full h-full object-cover" />
                <span className="absolute bottom-1 right-1 bg-black/75 text-white text-[10px] px-1.5 py-0.5 rounded font-mono">
                  🌾 Seeds Verified
                </span>
              </div>
            )}

            <div className="flex-1 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h4 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <span className="text-amber-800">🌾 {result.cropName}</span>
                  </h4>
                  <span className="text-xs text-slate-500 font-medium">{result.variety}</span>
                </div>
                <span className="text-xs font-bold px-2.5 py-1 rounded-md bg-emerald-100 text-emerald-800 border border-emerald-300">
                  {result.healthStatus}
                </span>
              </div>

              {/* Metrics Grid */}
              <div className="grid grid-cols-2 gap-2">
                <div className="p-2.5 rounded-lg bg-white border border-slate-200/80">
                  <span className="text-[11px] text-slate-500 block">{t.purityLabel}</span>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <Percent size={15} className="text-emerald-700" />
                    <span className="text-lg font-extrabold text-slate-900">{result.purityPercentage}%</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-1.5 mt-1.5 overflow-hidden">
                    <div
                      className="bg-emerald-600 h-1.5 rounded-full"
                      style={{ width: `${Math.min(100, result.purityPercentage)}%` }}
                    />
                  </div>
                </div>

                <div className="p-2.5 rounded-lg bg-white border border-slate-200/80">
                  <span className="text-[11px] text-slate-500 block">{t.germLabel}</span>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <TrendingUp size={15} className="text-blue-700" />
                    <span className="text-lg font-extrabold text-slate-900">{result.germinationPotential}%</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-1.5 mt-1.5 overflow-hidden">
                    <div
                      className="bg-blue-600 h-1.5 rounded-full"
                      style={{ width: `${Math.min(100, result.germinationPotential)}%` }}
                    />
                  </div>
                </div>
              </div>

              <div className="text-[11px] text-slate-500 flex items-center justify-between">
                <span>Evaluation Standard: <strong className="text-slate-700">{provider}</strong></span>
              </div>
            </div>
          </div>

          {/* Moisture Assessment Card */}
          <div className="bg-sky-50/70 border border-sky-200 rounded-xl p-3 flex items-start gap-2.5">
            <Droplets size={16} className="text-sky-700 shrink-0 mt-0.5" />
            <div className="text-xs">
              <strong className="text-sky-950 font-bold block">{t.moistureTitle}</strong>
              <span className="text-sky-900 leading-relaxed">{result.moistureAssessment}</span>
            </div>
          </div>

          {/* Defects & Impurities */}
          {result.defects && result.defects.length > 0 && (
            <div className="bg-amber-50/60 border border-amber-200 rounded-xl p-3.5 space-y-2">
              <h5 className="text-xs font-bold text-amber-950 uppercase tracking-wide flex items-center gap-1.5">
                <AlertTriangle size={14} className="text-amber-700" />
                {t.defectsTitle}
              </h5>
              <ul className="space-y-1.5 text-xs text-amber-950">
                {result.defects.map((d, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-amber-600 font-bold">•</span>
                    <span>{d}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Pre-Sowing Seed Treatments */}
          {result.recommendedTreatment && result.recommendedTreatment.length > 0 && (
            <div className="bg-emerald-50/60 border border-emerald-200 rounded-xl p-3.5 space-y-2">
              <h5 className="text-xs font-bold text-emerald-950 uppercase tracking-wide flex items-center gap-1.5">
                <ShieldCheck size={14} className="text-emerald-700" />
                {t.treatmentTitle}
              </h5>
              <ul className="space-y-1.5 text-xs text-emerald-950">
                {result.recommendedTreatment.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-emerald-700 font-bold">✓</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Sowing & 7-Day Cloth Test Guide */}
          {result.sowingAdvice && result.sowingAdvice.length > 0 && (
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2">
              <h5 className="text-xs font-bold text-slate-800 uppercase tracking-wide flex items-center gap-1.5">
                <Sprout size={14} className="text-slate-600" />
                {t.sowingTitle}
              </h5>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {result.sowingAdvice.map((item, idx) => (
                  <div key={idx} className="text-xs text-slate-700 bg-white p-2.5 rounded-lg border border-slate-200 leading-relaxed">
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
