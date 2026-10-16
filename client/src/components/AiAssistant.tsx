import { useState, useRef, useEffect } from "react";
import {
  Bot,
  Send,
  X,
  Volume2,
  Sparkles,
  Loader2,
  Camera,
  Upload,
  Leaf,
  CloudSun,
  ScanLine,
  Sprout,
  Tractor,
  BookOpen,
  Droplets,
} from "lucide-react";
import type { Locale } from "@/lib/i18n";
import { useVoice } from "@/hooks/useVoice";
import type { FarmerProfile } from "@/lib/auth";
import { CameraModal } from "./CameraModal";

export type AssistantMode =
  | "soil"
  | "weather"
  | "pest"
  | "seed"
  | "fertilizer"
  | "resources"
  | "practice"
  | "irrigation"
  | "general";

interface AiAssistantProps {
  locale: Locale;
  profile: FarmerProfile;
  isOpen: boolean;
  onClose: () => void;
  initialMode?: AssistantMode;
  initialPrompt?: string;
}

interface ChatMessage {
  id: string;
  sender: "user" | "bot";
  text: string;
  image?: string;
  category?: AssistantMode;
  routedCategory?: string;
  provider?: string;
  disclaimer?: string;
}

const categoryDisplayNames: Record<string, Record<Locale, string>> = {
  soil: { en: "Soil Health Expert", hi: "मिट्टी स्वास्थ्य विशेषज्ञ", mr: "माती आरोग्य तज्ज्ञ" },
  weather: { en: "Weather & Spray Advisory", hi: "मौसम एवं छिड़काव सलाह", mr: "हवामान व फवारणी सल्ला" },
  pest: { en: "Pest & Disease Diagnosis", hi: "कीट एवं रोग पहचान", mr: "कीड व रोग निदान" },
  seed: { en: "Seed Quality & Germination", hi: "बीज गुणवत्ता एवं अंकुरण", mr: "बियाणे प्रत व उगवण" },
  fertilizer: { en: "Fertilizer & Nutrition Guide", hi: "उर्वरक एवं पोषण सलाह", mr: "खत व पोषण व्यवस्थापन" },
  resources: { en: "Resource & Budget Planner", hi: "संसाधन एवं बजट योजना", mr: "संसाधन व बजेट नियोजन" },
  practice: { en: "Agricultural Best Practices", hi: "उत्तम कृषि पद्धतियां", mr: "उत्कृष्ट कृषी पद्धती" },
  irrigation: { en: "Smart Irrigation Advisory", hi: "सिंचाई प्रबंधन", mr: "पाणी व्यवस्थापन" },
  general: { en: "Comprehensive Agro Assistant", hi: "समग्र कृषि सहायक", mr: "सर्वसमावेशक कृषी सहाय्यक" },
};

const popularPrompts: Record<Locale, string[]> = {
  en: [
    "Identify leaf spots and curled tips on my crop",
    "How to test seed germination rate at home?",
    "Balanced N:P:K fertilizer dosage for 2 acres",
    "Is today's weather safe for pesticide spraying?",
    "How to manage drip irrigation runtime in winter?",
    "How to improve organic carbon in black soil?",
  ],
  hi: [
    "पत्तियों पर पीले धब्बे और मुड़ने के कारण व कीटनाशक",
    "घर पर बीज अंकुरण प्रतिशत कैसे जांचें?",
    "2 एकड़ के लिए डीएपी और यूरिया की सही मात्रा",
    "क्या आज कीटनाशक छिड़काव करना सुरक्षित है?",
    "सर्दियों में ड्रिप सिंचाई कितनी देर चलाएं?",
    "काली मिट्टी में जैविक कार्बन कैसे बढ़ाएं?",
  ],
  mr: [
    "पाने पिवळी पडणे व चुरमुरणे यावर उपाय व फवारणी",
    "घरी बियाणे उगवण क्षमता कशी तपासावी?",
    "२ एकरासाठी खतांची मात्रा (डीएपी व युरिया)",
    "आज कीटकनाशक फवारणी करावी का?",
    "हिवाळ्यात ठिबक किती वेळ चालू ठेवावे?",
    "काळी मातीत सेंद्रिय कर्ब कसा वाढवावा?",
  ],
};

export function AiAssistant({
  locale,
  profile,
  isOpen,
  onClose,
  initialMode,
  initialPrompt,
}: AiAssistantProps) {
  const voice = useVoice(locale);
  const [messages, setMessages] = useState<ChatMessage[]>(() => [
    {
      id: "welcome",
      sender: "bot",
      category: "general",
      provider: "AgriSathi Intelligent Engine",
      text:
        locale === "hi"
          ? `नमस्ते ${profile.name}! मैं आपका एग्रीसाथी AI सलाहकार हूँ। अपनी खेती, कीट, बीज, खाद, मौसम या सिंचाई के बारे में कोई भी प्रश्न एक ही जगह पूछें — मैं स्वचालित रूप से विशेषज्ञ मॉडल से सटीक उत्तर दूंगा।`
          : locale === "mr"
          ? `नमस्कार ${profile.name}! मी तुमचा अॅग्रीसाथी AI सल्लागार आहे. शेती, कीड, बियाणे, खते, हवामान किंवा पाणी व्यवस्थापनाविषयी कोणताही प्रश्न इथेच विचारा — मी आपोआप योग्य तज्ज्ञ प्रणालीद्वारे अचूक सल्ला देईन.`
          : `Hello ${profile.name}! I am your AgriSathi AI Advisor. Ask any farming query regarding pests, seeds, soil, weather, fertilizer, or irrigation in this single prompt box — I will automatically route your request to the specialized agricultural model.`,
    },
  ]);
  const [input, setInput] = useState("");
  const [attachedImage, setAttachedImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [cameraOpen, setCameraOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (initialPrompt && isOpen) {
      sendMessage(initialPrompt);
    }
  }, [initialPrompt, isOpen]);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isOpen]);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      alert("Please select an image file.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setAttachedImage(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const sendMessage = async (textToSend?: string) => {
    const text = (textToSend || input).trim();
    if ((!text && !attachedImage) || loading) return;

    const currentImg = attachedImage;
    const userMsg: ChatMessage = {
      id: `u-${Date.now()}`,
      sender: "user",
      text: text || "Please inspect this agricultural photo and provide recommendations.",
      image: currentImg || undefined,
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setInput("");
    setAttachedImage(null);
    setLoading(true);

    try {
      const response = await fetch("/api/advisory", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          category: initialMode || "general",
          message: text || "Analyze this crop or seed image",
          image: currentImg || undefined,
          language: locale,
        }),
      });

      const data = await response.json();
      const detectedCat = data.category || "general";
      const botMsg: ChatMessage = {
        id: `b-${Date.now()}`,
        sender: "bot",
        text: data.reply || data.error || "Unable to get an answer right now.",
        category: detectedCat,
        routedCategory: categoryDisplayNames[detectedCat]?.[locale] || detectedCat,
        provider: data.provider || "AgriSathi AI Engine",
        disclaimer: data.disclaimer,
      };

      setMessages((prev) => [...prev, botMsg]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          sender: "bot",
          category: "general",
          text: "Network error connecting to agricultural advisor. Please verify your connection.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/65 backdrop-blur-sm p-3 sm:p-4 animate-in fade-in"
      role="dialog"
      aria-modal="true"
    >
      <div className="bg-white w-full max-w-3xl rounded-2xl shadow-2xl flex flex-col h-[700px] max-h-[92vh] overflow-hidden border border-emerald-200">
        {/* Header - AI Advisor */}
        <div className="bg-emerald-800 text-white p-3.5 sm:p-4 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-700/90 flex items-center justify-center border border-emerald-600 shadow-inner">
              <Bot size={22} className="text-emerald-100" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base leading-tight">
                  {locale === "hi"
                    ? "एग्रीसाथी AI सलाहकार"
                    : locale === "mr"
                    ? "अॅग्रीसाथी AI सल्लागार"
                    : "AgriSathi AI Advisor"}
                </h3>
                <span className="bg-emerald-600/80 text-emerald-100 text-[10px] px-2 py-0.5 rounded-full font-semibold">
                  Auto-Routing Active
                </span>
              </div>
              <p className="text-emerald-200 text-xs mt-0.5">
                Single Prompt Intelligence · {profile.crop} ({profile.farmSize})
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-emerald-200 hover:text-white p-1.5 rounded-xl hover:bg-emerald-700/60 transition"
            aria-label="Close"
          >
            <X size={22} />
          </button>
        </div>

        {/* Message Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/60">
          {messages.map((m) => (
            <div
              key={m.id}
              className={`flex flex-col ${m.sender === "user" ? "items-end" : "items-start"}`}
            >
              <div
                className={`max-w-[88%] rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-sm ${
                  m.sender === "user"
                    ? "bg-emerald-700 text-white rounded-br-none"
                    : "bg-white text-slate-800 border border-slate-200/90 rounded-bl-none"
                }`}
              >
                {m.sender === "bot" && (
                  <div className="flex flex-wrap items-center justify-between border-b border-slate-100 pb-1.5 mb-2 text-[11px] text-slate-500 gap-2">
                    <span className="font-semibold text-emerald-800 flex items-center gap-1">
                      <Sparkles size={12} />
                      {m.provider || "AgriSathi Agro Engine"}
                    </span>
                    {m.routedCategory && (
                      <span className="bg-emerald-100 text-emerald-900 text-[10px] px-2 py-0.5 rounded-full font-semibold">
                        🎯 {m.routedCategory}
                      </span>
                    )}
                    <button
                      onClick={() => voice.speak(m.text)}
                      className="text-slate-400 hover:text-emerald-700 flex items-center gap-1 text-[10px]"
                      title="Read aloud"
                    >
                      <Volume2 size={13} />
                      <span>Listen</span>
                    </button>
                  </div>
                )}

                {m.image && (
                  <img
                    src={m.image}
                    alt="User attached photo"
                    className="w-48 h-36 object-cover rounded-xl mb-2.5 border border-white/30 shadow-sm"
                  />
                )}

                <div className="whitespace-pre-wrap">{m.text}</div>

                {m.disclaimer && (
                  <div className="mt-2.5 pt-2 border-t border-slate-100 text-[10px] text-slate-500 italic">
                    {m.disclaimer}
                  </div>
                )}
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex items-center gap-2 text-slate-500 text-xs p-2 bg-white rounded-xl border border-slate-200 w-fit">
              <Loader2 size={16} className="animate-spin text-emerald-700" />
              <span>Analyzing query & routing to specialized agricultural API...</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Quick Suggestion Prompts */}
        <div className="px-4 py-2 bg-white border-t border-slate-200">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">
            Quick Inquiries:
          </span>
          <div className="flex flex-wrap gap-1.5 max-h-16 overflow-y-auto">
            {popularPrompts[locale].map((p, idx) => (
              <button
                key={idx}
                onClick={() => sendMessage(p)}
                disabled={loading}
                className="text-xs bg-emerald-50/80 hover:bg-emerald-100/90 border border-emerald-200/90 text-emerald-900 px-2.5 py-1 rounded-lg transition text-left"
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        {/* Attached Image Preview */}
        {attachedImage && (
          <div className="px-4 py-2 bg-slate-100 border-t border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <img
                src={attachedImage}
                alt="Attached crop"
                className="w-12 h-12 object-cover rounded-lg border border-slate-300"
              />
              <span className="text-xs text-slate-600">Photo attached for AI analysis</span>
            </div>
            <button
              onClick={() => setAttachedImage(null)}
              className="text-slate-400 hover:text-slate-700 p-1"
            >
              <X size={16} />
            </button>
          </div>
        )}

        {/* Unified Single Text Input Section */}
        <div className="p-3 bg-white border-t border-slate-200">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              sendMessage();
            }}
            className="flex items-center gap-2"
          >
            {/* Hidden file input */}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="image/*"
              className="hidden"
            />

            {/* Photo Capture Buttons */}
            <button
              type="button"
              onClick={() => setCameraOpen(true)}
              className="p-2.5 rounded-xl text-slate-600 hover:text-emerald-700 hover:bg-emerald-50 border border-slate-200 transition"
              title="Capture photo with camera"
            >
              <Camera size={18} />
            </button>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="p-2.5 rounded-xl text-slate-600 hover:text-emerald-700 hover:bg-emerald-50 border border-slate-200 transition"
              title="Upload image from device"
            >
              <Upload size={18} />
            </button>

            {/* Single Text Input Container */}
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={
                locale === "hi"
                  ? "अपनी फसल, मिट्टी, कीट, बीज या खाद के बारे में कोई भी प्रश्न पूछें..."
                  : locale === "mr"
                  ? "पीक, माती, कीड, बियाणे किंवा खताविषयी कोणताही प्रश्न इथे विचारा..."
                  : "Ask any question about crops, pests, seeds, soil, weather, fertilizer..."
              }
              disabled={loading}
              className="flex-1 bg-slate-50 border border-slate-300 focus:border-emerald-600 rounded-xl px-4 py-2.5 text-sm outline-none transition"
            />

            <button
              type="submit"
              disabled={loading || (!input.trim() && !attachedImage)}
              className="bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white p-2.5 rounded-xl transition shadow-sm"
              aria-label="Send"
            >
              <Send size={18} />
            </button>
          </form>
        </div>
      </div>

      {/* Camera Capture Modal */}
      <CameraModal
        isOpen={cameraOpen}
        onClose={() => setCameraOpen(false)}
        onCapture={(base64) => setAttachedImage(base64)}
        title="Capture Crop, Pest or Seed Photo"
        subtitle="Align the affected leaf, pest, or seed sample within the frame"
      />
    </div>
  );
}

export default AiAssistant;
