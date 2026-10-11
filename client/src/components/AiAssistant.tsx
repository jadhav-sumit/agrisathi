import { useState, useRef, useEffect } from "react";
import {
  Bot,
  Send,
  X,
  Volume2,
  VolumeX,
  Sparkles,
  AlertCircle,
  HelpCircle,
  Loader2,
  ShieldAlert,
} from "lucide-react";
import type { Locale } from "@/lib/i18n";
import { useVoice } from "@/hooks/useVoice";
import type { FarmerProfile } from "@/lib/auth";

interface AiAssistantProps {
  locale: Locale;
  profile: FarmerProfile;
  isOpen: boolean;
  onClose: () => void;
}

interface ChatMessage {
  id: string;
  sender: "user" | "bot";
  text: string;
  disclaimer?: string;
  configured?: boolean;
}

const quickPrompts: Record<Locale, string[]> = {
  en: [
    "How to protect onions from unexpected rain?",
    "Organic fertilizer schedule for 2 acres",
    "How to identify and control thrips pest?",
    "When is the best time to irrigate in winter?",
  ],
  hi: [
    "बारिश से प्याज़ की फसल कैसे बचाएं?",
    "2 एकड़ के लिए जैविक खाद की मात्रा",
    "थ्रिप्स कीट से बचाव के उपाय बताएं",
    "सर्दियों में सिंचाई का सही समय क्या है?",
  ],
  mr: [
    "अवकाळी पावसापासून कांदा पीक कसे वाचवावे?",
    "२ एकरासाठी सेंद्रिय खताचे नियोजन",
    "थ्रिप्स (फुलकिडे) नियंत्रणासाठी उपाय काय?",
    "हिवाळ्यात सिंचनाची योग्य वेळ कोणती?",
  ],
};

const labels: Record<
  Locale,
  {
    title: string;
    subtitle: string;
    placeholder: string;
    send: string;
    disclaimer: string;
    unconfiguredAlert: string;
    quickTitle: string;
  }
> = {
  en: {
    title: "AgriSathi AI Advisor",
    subtitle: "Real-time crop guidance powered by Gemini AI",
    placeholder: "Ask any farming, crop, or weather question...",
    send: "Send",
    disclaimer: "AI guidance is advisory only. Consult local KVK officers before chemical application.",
    unconfiguredAlert: "GEMINI_API_KEY is not configured on the server. Please add a free key from Google AI Studio to .env.",
    quickTitle: "Common Questions:",
  },
  hi: {
    title: "एग्रीसाथी AI सलाहकार",
    subtitle: "जेमिनी AI द्वारा संचालित लाइव कृषि मार्गदर्शन",
    placeholder: "फसल, खाद, कीट या मौसम के बारे में पूछें...",
    send: "भेजें",
    disclaimer: "AI सलाह केवल मार्गदर्शन के लिए है। किसी भी रासायनिक छिड़काव से पहले कृषि वैज्ञानिक (KVK) से सलाह लें।",
    unconfiguredAlert: "सर्वर पर GEMINI_API_KEY कॉन्फ़िगर नहीं है। Google AI Studio से मुफ्त कुंजी .env में जोड़ें।",
    quickTitle: "अक्सर पूछे जाने वाले सवाल:",
  },
  mr: {
    title: "अॅग्रीसाथी AI कृषी सल्लागार",
    subtitle: "जेमिनी AI आधारित थेट पीक सल्ला",
    placeholder: "पीक, खत, कीड किंवा हवामानाबद्दल विचारा...",
    send: "विचारा",
    disclaimer: "AI सल्ला केवळ मार्गदर्शनासाठी आहे. रासायनिक फवारणीपूर्वी कृषी तज्ज्ञ किंवा KVK चा सल्ला घ्या.",
    unconfiguredAlert: "सर्व्हरवर GEMINI_API_KEY जोडलेली नाही. Google AI Studio वरून मोफत की .env मध्ये टाका.",
    quickTitle: "वारंवार विचारले जाणारे प्रश्न:",
  },
};

export function AiAssistant({ locale, profile, isOpen, onClose }: AiAssistantProps) {
  const t = labels[locale];
  const voice = useVoice(locale);
  const [messages, setMessages] = useState<ChatMessage[]>(() => [
    {
      id: "welcome",
      sender: "bot",
      text:
        locale === "hi"
          ? `नमस्ते ${profile.name}! मैं आपका एग्रीसाथी AI सलाहकार हूँ। आपकी ${profile.crop} की फसल और खेती के किसी भी सवाल में मैं आपकी मदद कर सकता हूँ।`
          : locale === "mr"
            ? `नमस्कार ${profile.name}! मी तुमचा अॅग्रीसाथी AI कृषी सल्लागार आहे. तुमच्या ${profile.crop} पिकासाठी किंवा इतर कोणत्याही शेतीच्या कामासाठी मी मदत करू शकतो.`
            : `Hello ${profile.name}! I am your AgriSathi AI agricultural assistant. Ask me anything about your ${profile.crop} crop, soil nutrition, irrigation, or pest control.`,
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

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
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setInput("");
    setLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text,
          language: locale,
          profile: {
            crop: profile.crop,
            farmSize: profile.farmSize,
            village: profile.village,
            district: profile.district,
            state: profile.state,
          },
        }),
      });

      const data = await response.json();
      const botMsg: ChatMessage = {
        id: `b-${Date.now()}`,
        sender: "bot",
        text: data.reply || data.error || "Unable to get an answer right now.",
        disclaimer: data.disclaimer,
        configured: data.configured ?? false,
      };

      setMessages((prev) => [...prev, botMsg]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          sender: "bot",
          text: "Network error connecting to the agricultural assistant service. Please verify your connection.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in"
      role="dialog"
      aria-modal="true"
    >
      <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl flex flex-col h-[650px] max-h-[90vh] overflow-hidden border border-emerald-100">
        {/* Header */}
        <div className="bg-emerald-800 text-white p-4 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-emerald-700/80 flex items-center justify-center border border-emerald-600">
              <Bot size={22} className="text-emerald-200" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base tracking-tight">{t.title}</h3>
                <span className="bg-emerald-600/70 text-emerald-100 text-[10px] px-2 py-0.5 rounded-full font-medium flex items-center gap-1">
                  <Sparkles size={11} /> Gemini 2.5
                </span>
              </div>
              <p className="text-emerald-200 text-xs">{t.subtitle}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-emerald-200 hover:text-white p-1 rounded-lg hover:bg-emerald-700/50 transition"
            aria-label="Close"
          >
            <X size={22} />
          </button>
        </div>

        {/* Message Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50">
          {messages.map((m) => (
            <div
              key={m.id}
              className={`flex flex-col ${m.sender === "user" ? "items-end" : "items-start"}`}
            >
              <div
                className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-sm ${
                  m.sender === "user"
                    ? "bg-emerald-700 text-white rounded-br-none"
                    : "bg-white text-slate-800 border border-slate-200/80 rounded-bl-none"
                }`}
              >
                <div className="whitespace-pre-wrap">{m.text}</div>

                {m.sender === "bot" && (
                  <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                    <button
                      type="button"
                      onClick={() =>
                        voice.isSpeaking ? voice.stopSpeaking() : voice.speak(m.text)
                      }
                      className="flex items-center gap-1 text-emerald-700 hover:text-emerald-900 font-medium"
                    >
                      {voice.isSpeaking ? <VolumeX size={14} /> : <Volume2 size={14} />}
                      <span>{voice.isSpeaking ? "Stop" : "Listen"}</span>
                    </button>
                  </div>
                )}
              </div>

              {m.disclaimer && (
                <div className="mt-1 flex items-center gap-1 text-[11px] text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 max-w-[85%]">
                  <ShieldAlert size={12} className="shrink-0" />
                  <span>{m.disclaimer}</span>
                </div>
              )}
            </div>
          ))}

          {loading && (
            <div className="flex items-center gap-2 text-slate-500 text-xs bg-white px-3 py-2 rounded-xl border border-slate-200 w-fit">
              <Loader2 size={15} className="animate-spin text-emerald-600" />
              <span>Analyzing agronomic recommendations...</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Quick prompt pills */}
        <div className="px-4 py-2 bg-white border-t border-slate-100">
          <p className="text-[11px] font-semibold text-slate-400 mb-1 flex items-center gap-1">
            <HelpCircle size={12} /> {t.quickTitle}
          </p>
          <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            {quickPrompts[locale].map((p, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => sendMessage(p)}
                disabled={loading}
                className="text-xs bg-slate-100 hover:bg-emerald-50 hover:text-emerald-800 text-slate-700 px-2.5 py-1 rounded-full whitespace-nowrap border border-slate-200 transition disabled:opacity-50"
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        {/* Input box */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            sendMessage();
          }}
          className="p-3 bg-white border-t border-slate-200 flex items-center gap-2"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={t.placeholder}
            disabled={loading}
            className="flex-1 bg-slate-50 border border-slate-300 rounded-xl px-4 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:bg-white"
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="bg-emerald-700 hover:bg-emerald-800 text-white px-4 py-2.5 rounded-xl font-medium text-sm flex items-center gap-1.5 shadow-sm transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span>{t.send}</span>
            <Send size={15} />
          </button>
        </form>
      </div>
    </div>
  );
}
export default AiAssistant;
