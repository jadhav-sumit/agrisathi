import React, { useState, useEffect, useRef } from "react";
import {
  Bot,
  Send,
  Sparkles,
  Volume2,
  VolumeX,
  Copy,
  Check,
  RotateCcw,
  Mic,
  MicOff,
  AlertCircle,
  ShieldCheck,
  CheckCircle2,
} from "lucide-react";
import type { Locale } from "@/lib/i18n";
import { localeSpeechCodes } from "@/lib/i18n";
import type { FarmerProfile } from "@/lib/auth";

export type AdvisoryCategory =
  | "soil"
  | "weather"
  | "pest"
  | "seed"
  | "fertilizer"
  | "resources"
  | "practice"
  | "irrigation"
  | "general";

interface ExploreWithAiProps {
  category: AdvisoryCategory;
  sectionTitle: string;
  locale: Locale;
  profile: FarmerProfile;
  className?: string;
}

const CATEGORY_QUESTIONS: Record<AdvisoryCategory, Record<Locale, string[]>> = {
  pest: {
    en: [
      "How to control thrips and purple blotch in onion organically?",
      "Safe dosage of neem oil for sucking pests on vegetable crops",
      "Biological control methods for leaf miners and aphids",
    ],
    hi: [
      "प्याज में थ्रिप्स कीट और बैंगनी धब्बा रोग की जैविक रोकथाम कैसे करें?",
      "सब्जी फसलों में कीट नियंत्रण के लिए नीम तेल की सुरक्षित मात्रा",
      "माहू और लीफ माइनर कीटों के प्राकृतिक नियंत्रण के उपाय",
    ],
    mr: [
      "कांद्यावरील थ्रिप्स (फुलकिडे) व करपा रोगाचे सेंद्रिय नियंत्रण कसे करावे?",
      "भाजीपाला पिकांवर किडींसाठी निंबोळी अर्क/तेलाचे सुरक्षित प्रमाण काय?",
      "मावा व तुडतुडे नियंत्रणासाठी प्रभावी जैविक उपाय सांगा",
    ],
  },
  seed: {
    en: [
      "How to test seed germination rate at home in a wet cloth?",
      "Trichoderma viride seed treatment step-by-step method",
      "How to screen seed purity and foreign matter before sowing?",
    ],
    hi: [
      "गीले कपड़े में घर पर बीज अंकुरण परीक्षण की विधि बताएं",
      "बुवाई से पहले ट्राइकोडर्मा से बीजोपचार करने का सही तरीका",
      "बुवाई पूर्व बीज की शुद्धता और कचरा कैसे साफ करें?",
    ],
    mr: [
      "ओल्या कपड्यात घरी बियाणे उगवण क्षमता तपासण्याची पद्धत",
      "पेरणीपूर्वी ट्रायकोडर्मा व्हिरिडी बीजप्रक्रिया कशी करावी?",
      "पेरणीपूर्वी बियाण्यांतील कचरा व भौतिक शुद्धता कशी तपासावी?",
    ],
  },
  weather: {
    en: [
      "Should I pause or continue irrigation based on upcoming weather?",
      "Safe wind velocity and weather window for pesticide spraying",
      "How to protect crops during sudden heat spikes or heavy downpours?",
    ],
    hi: [
      "क्या आगामी मौसम के अनुसार सिंचाई रोकनी चाहिए या चालू रखनी चाहिए?",
      "कीटनाशक छिड़काव के लिए हवा की गति और मौसम का सही समय",
      "अचानक तेज धूप या भारी बारिश से फसल को कैसे सुरक्षित रखें?",
    ],
    mr: [
      "पुढील हवामानाचा अंदाज पाहून सिंचन थांबवावे की सुरू ठेवावे?",
      "फवारणीसाठी वाऱ्याचा वेग आणि अनुकूल हवामानाची वेळ कोणती?",
      "अचानक वाढलेले ऊन किंवा अवकाळी पावसापासून पिकाचे संरक्षण कसे करावे?",
    ],
  },
  soil: {
    en: [
      "How to improve organic carbon in black cotton soil?",
      "Optimal soil pH and gypsum treatment for alkaline fields",
      "Signs of nitrogen vs phosphorus deficiency in crop leaves",
    ],
    hi: [
      "काली मिट्टी में जैविक कार्बन और केंचुए की संख्या कैसे बढ़ाएं?",
      "मिट्टी का पीएच 7.5 से अधिक होने पर जिप्सम का उपयोग कैसे करें?",
      "फसल में नाइट्रोजन और फास्फोरस की कमी के मुख्य लक्षण",
    ],
    mr: [
      "काळी कसदार जमिनीत सेंद्रिय कर्ब आणि सुपीकता कशी वाढवावी?",
      "जमिनीचा सामू (pH) जास्त असल्यास जिप्समची मात्रा कशी ठरवावी?",
      "पिकाच्या पानात नत्र किंवा स्फुरदाची कमतरता कशी ओळखावी?",
    ],
  },
  fertilizer: {
    en: [
      "Basal fertilizer dose calculation for my crop and farm size",
      "Urea split application schedule to minimize nitrogen runoff",
      "Organic compost and bio-fertilizer balance to cut chemical costs",
    ],
    hi: [
      "मेरी फसल और खेत के आकार के लिए बेसल खाद की सही मात्रा",
      "यूरिया की खुराक को दो-तीन किस्तों में कब और कैसे दें?",
      "रासायनिक खाद का खर्च घटाने के लिए जैविक पोषण योजना",
    ],
    mr: [
      "माझ्या पिकासाठी आणि क्षेत्रफळानुसार बेसल डोसचे अचूक प्रमाण",
      "युरिया खताचे हप्ते कधी व किती प्रमाणात द्यावेत?",
      "खतांचा खर्च ३०% कमी करण्यासाठी जिवामृत व सेंद्रिय खतांचे नियोजन",
    ],
  },
  irrigation: {
    en: [
      "Recommended drip irrigation duration and schedule for this soil",
      "Signs of over-watering vs water stress in root zone",
      "How to save 30% water during peak summer irrigation?",
    ],
    hi: [
      "मेरी मिट्टी के लिए ड्रिप सिंचाई का सबसे सही समय और अवधि",
      "जड़ों में अधिक पानी या पानी की कमी की पहचान कैसे करें?",
      "गर्मियों में ड्रिप सिंचाई से पानी की 30% बचत कैसे करें?",
    ],
    mr: [
      "माझ्या जमिनीच्या पोतानुसार ठिबक सिंचन किती वेळ चालवावे?",
      "मुळांच्या भागात जास्त पाणी किंवा पाण्याचा ताण कसा ओळखावा?",
      "उन्हाळ्यात बाष्पीभवन रोखून पाण्याची ३०% बचत कशी करावी?",
    ],
  },
  practice: {
    en: [
      "Step-by-step crop calendar from sowing to harvest",
      "Profitable intercropping combinations for extra farm revenue",
      "Harvest readiness indicators and proper post-harvest storage",
    ],
    hi: [
      "बुवाई से कटाई तक का संपूर्ण फसल कैलेंडर एवं मुख्य कार्य",
      "अतिरिक्त आय के लिए मुख्य फसल के साथ लाभकारी अंतर-फसलें",
      "फसल कटाई की सही पहचान और सुरक्षित भंडारण के उपाय",
    ],
    mr: [
      "लागवडीपासून काढणीपर्यंतचे सुधारित पीक वाढ वेळापत्रक",
      "एकरी नफा वाढवण्यासाठी मुख्य पिकात कोणती आंतरपिके घ्यावीत?",
      "काढणीची योग्य वेळ आणि काढणीनंतर शेतमाल सुरक्षित साठवणूक",
    ],
  },
  resources: {
    en: [
      "Estimated cost of cultivation breakdown and cost-cutting tips",
      "Government subsidy schemes and Kisan Credit Card (KCC) tips",
      "How to rent farm machinery and schedule labor economically?",
    ],
    hi: [
      "प्रति एकड़ फसल की अनुमानित लागत और बचत के उपाय",
      "किसान क्रेडिट कार्ड (KCC) और सरकारी अनुदान योजनाएं",
      "मजदूरी और ट्रैक्टर किराए का खर्च कैसे नियंत्रित करें?",
    ],
    mr: [
      "प्रति एकर पिकाचा अंदाजे लागवड खर्च आणि बचतीचे मार्ग",
      "केसीसी (KCC) कर्ज, शेतकरी गट आणि शासकीय योजनांची माहिती",
      "मजुरी खर्च आणि ट्रॅक्टर भाडे व्यवस्थापन कसे करावे?",
    ],
  },
  general: {
    en: [
      "What farming tasks should I prioritize this week for my crop?",
      "Integrated pest, water and nutrient management plan",
      "Current mandi price trends and best selling window",
    ],
    hi: [
      "इस हफ्ते मुझे अपने खेत में किन कामों को प्राथमिकता देनी चाहिए?",
      "कीट, पानी और पोषण का संपूर्ण एकीकृत प्रबंधन प्लान",
      "मंडी में फसल के भाव और बेचने का सबसे सही समय",
    ],
    mr: [
      "या आठवड्यात शेतात कोणत्या महत्त्वाच्या कामांना प्राधान्य द्यावे?",
      "कीड, पाणी आणि खतांचे एकात्मिक शेती नियोजन",
      "बाजार समितीत शेतमालाचे सध्याचे भाव व विक्रीची योग्य वेळ",
    ],
  },
};

const OPENROUTER_EXPLORE_KEY =
  (import.meta.env.VITE_OPENROUTER_API_KEY as string) || "";

const UI_TEXTS = {
  en: {
    badge: "AgriSathi AI Engine • OpenRouter",
    exploreTitle: "Explore with AI",
    subTitle: "Instant intelligent answers to all your agricultural and crop questions powered by AI.",
    statusReady: "OpenRouter AI Active & Ready",
    placeholder: "Ask any farming question in this box (pests, seeds, soil, weather, fertilizer, schemes)...",
    sendBtn: "Ask AI",
    asking: "Thinking & Generating Expert Agricultural Guidance with OpenRouter AI...",
    listening: "Listening to your voice...",
    startVoice: "Voice Query",
    stopVoice: "Stop Listening",
    listenAudio: "Listen Advice",
    stopAudio: "Stop Voice",
    copied: "Copied!",
    copy: "Copy Advice",
    clear: "New Query",
    errorDefault: "Unable to retrieve AI advice right now. Please check your network connection.",
    disclaimer: "Scientifically benchmarked with ICAR agronomic guidance & crop pathology standards.",
    answeredBy: "Answered by:",
  },
  hi: {
    badge: "एग्रीसाथी AI इंजन • OpenRouter",
    exploreTitle: "AI से सलाह लें (Explore with AI)",
    subTitle: "खेती, कीट, बीज, खाद व मौसम से जुड़े सभी सवालों के त्वरित और सटीक उत्तर।",
    statusReady: "OpenRouter AI सक्रिय एवं तैयार",
    placeholder: "इस बॉक्स में कीट, बीज, खाद, मौसम या खेती का कोई भी सवाल पूछें...",
    sendBtn: "पूछें",
    asking: "कृषि OpenRouter AI से प्रामाणिक उत्तर तैयार हो रहा है...",
    listening: "आपकी आवाज़ सुनी जा रही है...",
    startVoice: "बोलकर पूछें",
    stopVoice: "सुनना बंद करें",
    listenAudio: "सलाह सुनें (ऑडियो)",
    stopAudio: "ऑडियो रोकें",
    copied: "कॉपी हो गया!",
    copy: "सलाह कॉपी करें",
    clear: "नया सवाल",
    errorDefault: "वर्तमान में सलाह प्राप्त नहीं हो सकी। कृपया इंटरनेट कनेक्शन जांचें।",
    disclaimer: "भारतीय कृषि अनुसंधान परिषद (ICAR) के मानकों पर आधारित प्रामाणिक परामर्श।",
    answeredBy: "सलाह प्रदाता:",
  },
  mr: {
    badge: "अॅग्रीसाथी AI इंजिन • OpenRouter",
    exploreTitle: "AI थेट सल्लागार (Explore with AI)",
    subTitle: "शेती, कीड, बियाणे, खते व हवामान याविषयी सर्व प्रश्नांची झटपट व अचूक उत्तरे.",
    statusReady: "OpenRouter AI सक्रिय व सज्ज",
    placeholder: "या बॉक्समध्ये कीड, बियाणे, खते, हवामान किंवा पिकांविषयी कोणताही प्रश्न विचारा...",
    sendBtn: "सल्ला विचारा",
    asking: "कृषी OpenRouter AI कडून सल्ला तयार केला जात आहे...",
    listening: "तुमचा आवाज ऐकला जात आहे...",
    startVoice: "बोलून विचारा",
    stopVoice: "थांबवा",
    listenAudio: "सल्ला ऐका",
    stopAudio: "ऑडिओ थांबवा",
    copied: "कॉपी केले!",
    copy: "सल्ला कॉपी करा",
    clear: "नवीन प्रश्न",
    errorDefault: "सध्या AI सल्ला मिळण्यात अडचण येत आहे. कृपया नेटवर्क तपासा.",
    disclaimer: "ICAR कृषी संशोधन मानकांनुसार तयार केलेला विश्वासार्ह सल्ला.",
    answeredBy: "सल्ला प्रणाली:",
  },
};

export function ExploreWithAi({
  category,
  sectionTitle,
  locale,
  profile,
  className = "",
}: ExploreWithAiProps) {
  const t = UI_TEXTS[locale];
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [reply, setReply] = useState<string | null>(null);
  const [provider, setProvider] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isListening, setIsListening] = useState(false);

  const recognitionRef = useRef<any>(null);

  const suggestions =
    CATEGORY_QUESTIONS[category]?.[locale] || CATEGORY_QUESTIONS.general[locale];

  // Voice synthesis (Text-to-Speech)
  const speakText = (text: string) => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    if (isSpeaking) {
      setIsSpeaking(false);
      return;
    }

    const cleanText = text.replace(/[*#_`]/g, " ").replace(/\s+/g, " ");
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = localeSpeechCodes[locale];
    utterance.rate = 0.92;
    utterance.pitch = 1.0;
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    window.speechSynthesis.speak(utterance);
  };

  const stopSpeaking = () => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    setIsSpeaking(false);
  };

  // Voice recognition (Speech-to-Text)
  const toggleListening = () => {
    if (typeof window === "undefined") return;
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert("Voice input is not supported in this browser. Please type your query in the text box.");
      return;
    }

    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = localeSpeechCodes[locale];
      recognition.interimResults = false;
      recognition.continuous = false;

      recognition.onresult = (event: any) => {
        const text = event.results[0]?.[0]?.transcript || "";
        if (text) {
          setQuery(text);
        }
      };

      recognition.onerror = () => setIsListening(false);
      recognition.onend = () => setIsListening(false);

      recognitionRef.current = recognition;
      recognition.start();
      setIsListening(true);
    } catch {
      setIsListening(false);
    }
  useEffect(() => {
    if (typeof window !== "undefined" && OPENROUTER_EXPLORE_KEY) {
      try {
        localStorage.setItem("agrisathi_openrouter_key", OPENROUTER_EXPLORE_KEY);
        localStorage.setItem("agrisathi_single_ai_key", OPENROUTER_EXPLORE_KEY);
      } catch {}
    }
    return () => {
      stopSpeaking();
      recognitionRef.current?.stop();
    };
  }, []);

  // Send query to unified AI engine via /api/advisory
  const handleAsk = async (textToAsk?: string) => {
    const questionText = (textToAsk ?? query).trim();
    if (!questionText) return;

    setLoading(true);
    setError(null);
    stopSpeaking();

    const apiKeyToSend =
      (typeof window !== "undefined"
        ? localStorage.getItem("agrisathi_openrouter_key") ||
          localStorage.getItem("agrisathi_single_ai_key")
        : null) || OPENROUTER_EXPLORE_KEY || undefined;

    try {
      const res = await fetch("/api/advisory", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          category,
          message: questionText,
          language: locale,
          serviceTarget: "openrouter",
          apiKey: apiKeyToSend,
          customApiKey: apiKeyToSend,
          farmerContext: {
            name: profile.name,
            crop: profile.crop,
            farmSize: profile.farmSize,
            soilType: profile.soilType || "Black Cotton Soil",
            village: profile.village,
            district: profile.district,
            state: profile.state,
            lat: 20.087,
            lon: 73.95,
          },
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || t.errorDefault);
      }

      setReply(data.reply);
      setProvider(data.provider || "AgriSathi OpenRouter AI");
      setQuery(questionText);
    } catch (err: any) {
      setError(err.message || t.errorDefault);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (!reply) return;
    navigator.clipboard.writeText(reply).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleReset = () => {
    setReply(null);
    setQuery("");
    setError(null);
    stopSpeaking();
  };

  return (
    <div
      className={`bg-white rounded-2xl border border-emerald-200/90 shadow-sm overflow-hidden p-5 ${className}`}
    >
      {/* Header with Title and Active Status */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 text-xs font-bold uppercase tracking-wider text-emerald-800 bg-emerald-100/80 px-2.5 py-1 rounded-md">
              <Sparkles size={13} className="text-emerald-700" />
              {t.badge}
            </span>
            <span className="text-xs text-slate-500 font-medium">
              {sectionTitle}
            </span>
          </div>
          <h3 className="text-lg font-bold text-slate-800 mt-1 flex items-center gap-2">
            <Bot size={20} className="text-emerald-700" />
            {t.exploreTitle}
          </h3>
          <p className="text-xs text-slate-600 mt-0.5">{t.subTitle}</p>
        </div>

        {/* Status Indicator */}
        <div className="flex items-center gap-1.5 text-xs text-emerald-800 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full font-medium shadow-2xs self-start md:self-auto">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="font-semibold">{t.statusReady}</span>
        </div>
      </div>

      {/* Suggested Quick Question Chips */}
      {!reply && (
        <div className="mb-4">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
            {locale === "mr"
              ? "थेट विचारण्यासाठी टॅप करा (सर्व विषय)"
              : locale === "hi"
              ? "सीधे पूछने के लिए टैप करें (सभी विषय)"
              : "Suggested Questions (Answers All Topics)"}
          </span>
          <div className="flex flex-wrap gap-1.5">
            {suggestions.map((q, idx) => (
              <button
                key={idx}
                onClick={() => {
                  setQuery(q);
                  handleAsk(q);
                }}
                disabled={loading}
                className="text-xs bg-slate-50 hover:bg-emerald-50 text-slate-700 hover:text-emerald-900 border border-slate-200 hover:border-emerald-300 px-3 py-1.5 rounded-lg text-left transition disabled:opacity-50"
              >
                {q}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Single Query Input Box */}
      <div className="space-y-2">
        <div className="relative flex items-center">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleAsk();
              }
            }}
            placeholder={t.placeholder}
            disabled={loading}
            className="w-full pl-4 pr-24 py-3 bg-slate-50 border border-slate-300 focus:border-emerald-600 focus:bg-white rounded-xl text-sm text-slate-900 placeholder:text-slate-400 outline-hidden transition shadow-inner"
          />

          <div className="absolute right-1.5 flex items-center gap-1">
            <button
              onClick={toggleListening}
              type="button"
              title={isListening ? t.stopVoice : t.startVoice}
              className={`p-2 rounded-lg transition ${
                isListening
                  ? "bg-rose-500 text-white animate-pulse"
                  : "text-slate-500 hover:text-emerald-700 hover:bg-slate-200/60"
              }`}
            >
              {isListening ? <MicOff size={16} /> : <Mic size={16} />}
            </button>

            <button
              onClick={() => handleAsk()}
              disabled={loading || !query.trim()}
              className="bg-emerald-700 hover:bg-emerald-800 disabled:bg-slate-300 text-white p-2 rounded-lg transition shadow-xs flex items-center justify-center"
            >
              <Send size={15} />
            </button>
          </div>
        </div>

        {isListening && (
          <div className="text-xs text-rose-600 font-medium flex items-center gap-1.5 px-2 animate-pulse">
            <span className="w-2 h-2 rounded-full bg-rose-500 inline-block" />
            {t.listening}
          </div>
        )}
      </div>

      {/* Loading Indicator */}
      {loading && (
        <div className="mt-4 p-5 rounded-xl bg-emerald-50/50 border border-emerald-200/60 flex items-center gap-3 text-emerald-900 text-xs font-semibold animate-pulse">
          <Bot size={20} className="text-emerald-700 animate-spin" />
          <span>{t.asking}</span>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="mt-3 p-3.5 rounded-xl bg-rose-50 border border-rose-200 flex items-start gap-2 text-rose-900 text-xs">
          <AlertCircle size={16} className="text-rose-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <span>{error}</span>
          </div>
        </div>
      )}

      {/* Reply Container */}
      {reply && !loading && (
        <div className="mt-4 p-4 rounded-xl bg-slate-50 border border-slate-200/90 space-y-3 animate-in fade-in">
          {/* Top Bar with Provider and Action Buttons */}
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200/80 pb-2.5">
            <div className="flex items-center gap-1.5 text-xs text-slate-600 font-medium">
              <Bot size={15} className="text-emerald-700" />
              <span>{t.answeredBy}</span>
              <strong className="text-slate-800">{provider}</strong>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                onClick={() => speakText(reply)}
                className={`text-xs px-2.5 py-1 rounded-md font-medium flex items-center gap-1 transition ${
                  isSpeaking
                    ? "bg-rose-100 text-rose-800"
                    : "bg-white hover:bg-slate-200/80 text-slate-700 border border-slate-200"
                }`}
              >
                {isSpeaking ? <VolumeX size={13} /> : <Volume2 size={13} />}
                <span>{isSpeaking ? t.stopAudio : t.listenAudio}</span>
              </button>

              <button
                onClick={handleCopy}
                className="text-xs bg-white hover:bg-slate-200/80 text-slate-700 border border-slate-200 px-2.5 py-1 rounded-md font-medium flex items-center gap-1 transition"
              >
                {copied ? <Check size={13} className="text-emerald-600" /> : <Copy size={13} />}
                <span>{copied ? t.copied : t.copy}</span>
              </button>

              <button
                onClick={handleReset}
                className="text-xs bg-white hover:bg-slate-200/80 text-slate-700 border border-slate-200 px-2.5 py-1 rounded-md font-medium flex items-center gap-1 transition"
              >
                <RotateCcw size={13} />
                <span>{t.clear}</span>
              </button>
            </div>
          </div>

          {/* Formatted Markdown Content */}
          <div className="prose prose-sm max-w-none text-slate-800 text-xs sm:text-sm leading-relaxed space-y-2 whitespace-pre-wrap font-sans">
            {reply}
          </div>

          {/* Scientific Disclaimer */}
          <div className="pt-2 border-t border-slate-200/70 text-[11px] text-slate-500 italic flex items-center gap-1.5">
            <ShieldCheck size={14} className="text-emerald-700 shrink-0" />
            <span>{t.disclaimer}</span>
          </div>
        </div>
      )}
    </div>
  );
}
