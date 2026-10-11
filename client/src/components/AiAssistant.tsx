import { useState, useRef, useEffect } from "react";
import {
  Bot,
  Send,
  X,
  Volume2,
  VolumeX,
  Sparkles,
  AlertCircle,
  Loader2,
  Leaf,
  CloudSun,
  ScanLine,
  Sprout,
  Tractor,
  BookOpen,
  Droplets,
  Layers,
  HelpCircle,
} from "lucide-react";
import type { Locale } from "@/lib/i18n";
import { useVoice } from "@/hooks/useVoice";
import type { FarmerProfile } from "@/lib/auth";

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
}

interface ChatMessage {
  id: string;
  sender: "user" | "bot";
  text: string;
  category?: AssistantMode;
  provider?: string;
  disclaimer?: string;
}

const modeConfig: Record<
  AssistantMode,
  {
    icon: typeof Leaf;
    color: string;
    labels: Record<Locale, string>;
    quickPrompts: Record<Locale, string[]>;
  }
> = {
  soil: {
    icon: Leaf,
    color: "emerald",
    labels: {
      en: "Soil Health",
      hi: "मिट्टी स्वास्थ्य",
      mr: "माती आरोग्य",
    },
    quickPrompts: {
      en: [
        "How to improve organic matter in black soil?",
        "Symptoms of nitrogen deficiency in onion",
        "Ideal soil pH range for my crop",
      ],
      hi: [
        "काली मिट्टी में जैविक खाद कैसे बढ़ाएं?",
        "प्याज़ में नाइट्रोजन की कमी के लक्षण",
        "मेरी फसल के लिए सही मिट्टी का पीएच",
      ],
      mr: [
        "काळी मातीत सेंद्रिय कर्ब कसा वाढवावा?",
        "कांदा पिकात नत्राच्या कमतरतेची लक्षणे",
        "पिकासाठी योग्य मातीचा सामू (pH)",
      ],
    },
  },
  weather: {
    icon: CloudSun,
    color: "sky",
    labels: {
      en: "Weather Alert",
      hi: "मौसम चेतावनी",
      mr: "हवामान इशारा",
    },
    quickPrompts: {
      en: [
        "Is it safe to spray pesticides today?",
        "Protect standing crop from unexpected rain",
        "High temperature mitigation steps",
      ],
      hi: [
        "क्या आज कीटनाशक छिड़काव करना सुरक्षित है?",
        "बेमौसम बारिश से खड़ी फसल कैसे बचाएं?",
        "अत्यधिक गर्मी से फसल बचाने के उपाय",
      ],
      mr: [
        "आज कीटकनाशक फवारणी करावी का?",
        "अवकाळी पावसापासून पीक कसे वाचवावे?",
        "उष्णतेच्या लाटेपासून पिकाचे संरक्षण",
      ],
    },
  },
  pest: {
    icon: ScanLine,
    color: "amber",
    labels: {
      en: "Pest Detection",
      hi: "कीट पहचान",
      mr: "कीड नियंत्रण",
    },
    quickPrompts: {
      en: [
        "How to control thrips with organic neem oil?",
        "Yellow spots and curling leaves causes",
        "Installing sticky traps per acre",
      ],
      hi: [
        "नीम तेल से थ्रिप्स कीट कैसे नियंत्रित करें?",
        "पत्तियों का पीला पड़ना और मुड़ना",
        "प्रति एकड़ कितने चिपचिपे ट्रैप लगाएं?",
      ],
      mr: [
        "कडुलिंब अर्क (नीम तेल) फवारणीचे प्रमाण",
        "पाने पिवळी पडणे आणि चुरमुरणे",
        "एका एकरासाठी चिकट सापळ्यांचे प्रमाण",
      ],
    },
  },
  seed: {
    icon: Sprout,
    color: "green",
    labels: {
      en: "Seed Quality",
      hi: "बीज गुणवत्ता",
      mr: "बियाणे प्रत",
    },
    quickPrompts: {
      en: [
        "How to test seed germination rate at home?",
        "Trichoderma seed treatment method",
        "Best certified seed varieties for onion",
      ],
      hi: [
        "घर पर बीज अंकुरण प्रतिशत कैसे जांचें?",
        "ट्राइकोडर्मा से बीजोपचार की विधि",
        "प्याज़ की उन्नत और प्रमाणित किस्में",
      ],
      mr: [
        "घरी बियाणे उगवण क्षमता कशी तपासावी?",
        "ट्रायकोडर्मा बीजप्रक्रिया पद्धत",
        "कांद्याचे सुधारित व प्रमाणित वाण",
      ],
    },
  },
  fertilizer: {
    icon: Sprout,
    color: "teal",
    labels: {
      en: "Fertilizer Advice",
      hi: "उर्वरक सलाह",
      mr: "खत व्यवस्थापन",
    },
    quickPrompts: {
      en: [
        "Basal fertilizer dose for 2 acres",
        "Urea split application schedule",
        "Organic compost vs chemical DAP comparison",
      ],
      hi: [
        "2 एकड़ के लिए बेसल खाद की सही मात्रा",
        "यूरिया की खुराक कितने दिनों में दें?",
        "गोबर की खाद और डीएपी का सही उपयोग",
      ],
      mr: [
        "२ एकरासाठी खतांची मात्रा (बेसल डोस)",
        "युरिया खताचे हप्ते कधी द्यावेत?",
        "सेंद्रिय खत व रासायनिक खतांचा मेळ",
      ],
    },
  },
  resources: {
    icon: Tractor,
    color: "stone",
    labels: {
      en: "Resource Planner",
      hi: "संसाधन योजना",
      mr: "संसाधन नियोजन",
    },
    quickPrompts: {
      en: [
        "Estimate seasonal budget for 2-acre crop",
        "Scheduling labor for weeding and harvest",
        "Water budgeting for drip irrigation",
      ],
      hi: [
        "2 एकड़ फसल का मौसमी बजट अनुमान",
        "निराई और कटाई के लिए मजदूरों का नियोजन",
        "ड्रिप सिंचाई के लिए पानी का हिसाब",
      ],
      mr: [
        "२ एकरासाठी हंगामाचा खर्च व बजेट",
        "खुरपणी व काढणीसाठी मजुरांचे नियोजन",
        "ठिबक सिंचनासाठी पाण्याचे नियोजन",
      ],
    },
  },
  practice: {
    icon: BookOpen,
    color: "indigo",
    labels: {
      en: "Practice Guide",
      hi: "कृषि पद्धतियां",
      mr: "उत्कृष्ट शेती",
    },
    quickPrompts: {
      en: [
        "Step-by-step land preparation for transplanting",
        "Crop rotation benefits after onion harvest",
        "Weed management without heavy herbicide",
      ],
      hi: [
        "रोपाई से पहले खेत तैयार करने के चरण",
        "प्याज़ के बाद कौन सी दलहनी फसल लगाएं?",
        "खरपतवार हटाने के सुरक्षित तरीके",
      ],
      mr: [
        "पुनर्लागवडीपूर्वी जमीन तयार करण्याचे टप्पे",
        "कांद्यानंतर फेरपालटीसाठी कोणते पीक घ्यावे?",
        "तण नियंत्रणाचे योग्य उपाय",
      ],
    },
  },
  irrigation: {
    icon: Droplets,
    color: "blue",
    labels: {
      en: "Irrigation Manage",
      hi: "सिंचाई प्रबंधन",
      mr: "पाणी व्यवस्थापन",
    },
    quickPrompts: {
      en: [
        "How long to run drip pump in winter?",
        "Symptoms of over-irrigation and root rot",
        "When to stop watering before harvesting?",
      ],
      hi: [
        "सर्दियों में ड्रिप पंप कितनी देर चलाएं?",
        "अधिक पानी से जड़ सड़न के लक्षण",
        "कटाई से कितने दिन पहले पानी बंद करें?",
      ],
      mr: [
        "हिवाळ्यात ठिबक किती वेळ चालू ठेवावे?",
        "जास्त पाण्यामुळे मुळकुज होण्याची लक्षणे",
        "काढणीपूर्वी पाणी कधी बंद करावे?",
      ],
    },
  },
  general: {
    icon: Bot,
    color: "emerald",
    labels: {
      en: "General Advisory",
      hi: "सामान्य सलाह",
      mr: "सर्वसाधारण सल्ला",
    },
    quickPrompts: {
      en: ["General crop advisory", "Market trend advice", "Kisan Call Center support"],
      hi: ["सामान्य फसल सलाह", "मंडी भाव की स्थिति", "किसान कॉल सेंटर जानकारी"],
      mr: ["सामान्य पीक सल्ला", "बाजारभाव कल", "किसान हेल्पलाइन माहिती"],
    },
  },
};

export function AiAssistant({
  locale,
  profile,
  isOpen,
  onClose,
  initialMode = "soil",
}: AiAssistantProps) {
  const [selectedMode, setSelectedMode] = useState<AssistantMode>(initialMode);
  const voice = useVoice(locale);
  const [messages, setMessages] = useState<ChatMessage[]>(() => [
    {
      id: "welcome",
      sender: "bot",
      category: initialMode,
      provider: "AgriSathi AI Engine",
      text:
        locale === "hi"
          ? `नमस्ते ${profile.name}! मैं आपका एग्रीसाथी कृषि सलाहकार हूँ। मिट्टी, मौसम, कीट, बीज, खाद या सिंचाई के बारे में कोई भी प्रश्न पूछें।`
          : locale === "mr"
          ? `नमस्कार ${profile.name}! मी तुमचा अॅग्रीसाथी कृषी सल्लागार आहे. माती, हवामान, कीड, बियाणे, खते किंवा सिंचनाविषयी कोणताही प्रश्न विचारा.`
          : `Hello ${profile.name}! I am your AgriSathi agricultural advisor. Select any specialized mode above or ask any farming question.`,
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (initialMode && initialMode !== selectedMode) {
      setSelectedMode(initialMode);
    }
  }, [initialMode]);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isOpen]);

  if (!isOpen) return null;

  const sendMessage = async (textToSend?: string) => {
    const text = (textToSend || input).trim();
    if (!text || loading) return;

    const userMsg: ChatMessage = {
      id: `u-${Date.now()}`,
      sender: "user",
      text,
      category: selectedMode,
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setInput("");
    setLoading(true);

    try {
      const response = await fetch("/api/advisory", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          category: selectedMode,
          message: text,
          language: locale,
        }),
      });

      const data = await response.json();
      const botMsg: ChatMessage = {
        id: `b-${Date.now()}`,
        sender: "bot",
        text: data.reply || data.error || "Unable to get an answer right now.",
        category: selectedMode,
        provider: data.provider || "AgriSathi Expert System",
        disclaimer: data.disclaimer,
      };

      setMessages((prev) => [...prev, botMsg]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          sender: "bot",
          category: selectedMode,
          text: "Network error connecting to agricultural advisor. Please verify your connection.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const currentModeInfo = modeConfig[selectedMode];
  const ModeIcon = currentModeInfo.icon;
  const modesList: AssistantMode[] = [
    "soil",
    "weather",
    "pest",
    "seed",
    "fertilizer",
    "resources",
    "practice",
    "irrigation",
  ];

  return (
    <div
      className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/65 backdrop-blur-sm p-3 sm:p-4 animate-in fade-in"
      role="dialog"
      aria-modal="true"
    >
      <div className="bg-white w-full max-w-3xl rounded-2xl shadow-2xl flex flex-col h-[700px] max-h-[92vh] overflow-hidden border border-emerald-200">
        {/* Header */}
        <div className="bg-emerald-800 text-white p-3.5 sm:p-4 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-700/90 flex items-center justify-center border border-emerald-600 shadow-inner">
              <ModeIcon size={22} className="text-emerald-100" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base leading-tight">
                  {locale === "hi"
                    ? "एग्रीसाथी 8-मोड कृषि सलाहकार"
                    : locale === "mr"
                    ? "अॅग्रीसाथी 8-मोड कृषी सल्लागार"
                    : "AgriSathi 8-Mode AI Advisor"}
                </h3>
                <span className="bg-emerald-600/80 text-emerald-100 text-[10px] px-2 py-0.5 rounded-full font-semibold">
                  Multi-LLM Active
                </span>
              </div>
              <p className="text-emerald-200 text-xs mt-0.5">
                Active Mode: <strong>{currentModeInfo.labels[locale]}</strong> · {profile.crop} ({profile.farmSize})
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

        {/* 8-Mode Selector Ribbon */}
        <div className="bg-slate-100 border-b border-slate-200 px-3 py-2 overflow-x-auto flex gap-1.5 scrollbar-thin">
          {modesList.map((m) => {
            const mData = modeConfig[m];
            const MIcon = mData.icon;
            const isSelected = selectedMode === m;
            return (
              <button
                key={m}
                onClick={() => setSelectedMode(m)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
                  isSelected
                    ? "bg-emerald-700 text-white shadow-sm"
                    : "bg-white text-slate-700 hover:bg-slate-200/80 border border-slate-200"
                }`}
              >
                <MIcon size={14} className={isSelected ? "text-emerald-200" : "text-emerald-700"} />
                <span>{mData.labels[locale]}</span>
              </button>
            );
          })}
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
                  <div className="flex items-center justify-between border-b border-slate-100 pb-1.5 mb-2 text-[11px] text-slate-500">
                    <span className="font-semibold text-emerald-800 flex items-center gap-1">
                      <Sparkles size={12} />
                      {m.provider || "AgriSathi Agro Engine"}
                    </span>
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
              <span>Analyzing agricultural database...</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Quick Prompts for Current Mode */}
        <div className="px-4 py-2 bg-white border-t border-slate-200">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">
            Quick Questions ({currentModeInfo.labels[locale]}):
          </span>
          <div className="flex flex-wrap gap-1.5">
            {currentModeInfo.quickPrompts[locale].map((p, idx) => (
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

        {/* Input Bar */}
        <div className="p-3 bg-white border-t border-slate-200">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              sendMessage();
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={`Ask ${currentModeInfo.labels[locale]} question...`}
              disabled={loading}
              className="flex-1 bg-slate-50 border border-slate-300 focus:border-emerald-600 rounded-xl px-4 py-2.5 text-sm outline-none transition"
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white p-2.5 rounded-xl transition shadow-sm"
              aria-label="Send"
            >
              <Send size={18} />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
