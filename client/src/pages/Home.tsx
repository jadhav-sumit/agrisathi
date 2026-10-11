import { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  AudioLines,
  BellRing,
  BookOpen,
  Check,
  ChevronRight,
  CircleHelp,
  CloudSun,
  Droplets,
  ExternalLink,
  Leaf,
  LocateFixed,
  Menu,
  Mic,
  Mic2,
  MoreHorizontal,
  MoveLeft,
  Pause,
  Play,
  Radio,
  ScanLine,
  ShieldCheck,
  Sprout,
  Tractor,
  TrendingUp,
  Volume2,
  VolumeX,
  Waves,
  X,
  Bot,
  MapPin,
  Sparkles,
  Map as MapIcon,
} from "lucide-react";
import type { Locale, ModuleId } from "@/lib/i18n";
import { getTranslation, localeSpeechCodes, moduleColors, moduleIds } from "@/lib/i18n";
import { useVoice } from "@/hooks/useVoice";
import type { FarmerProfile } from "@/lib/auth";
import { fetchWeather, type WeatherSnapshot } from "@/lib/weather";
import { AiAssistant } from "@/components/AiAssistant";
import { CropScanner } from "@/components/CropScanner";
import { MandiTracker } from "@/components/MandiTracker";
import { MapView } from "@/components/Map";

type HomeProps = { locale: Locale; setLocale: (locale: Locale) => void; profile: FarmerProfile; onLogout: () => void };
type IconType = typeof Leaf;

const moduleIcons: Record<ModuleId, IconType> = {
  soil: Leaf,
  irrigation: Droplets,
  weather: CloudSun,
  pest: ScanLine,
  seed: Sprout,
  fertilizer: Sprout,
  practice: BookOpen,
  resources: Tractor,
};

const detailCopy: Record<Locale, Record<ModuleId, { eyebrow: string; headline: string; body: string; metric: string; metricLabel: string; steps: string[] }>> = {
  en: {
    soil: { eyebrow: "Soil Health Card · live adjustment", headline: "Your soil can support a stronger onion crop.", body: "Nitrogen is slightly low for the vegetative stage. Add compost first, then review the split dose before the next irrigation.", metric: "42%", metricLabel: "moisture now", steps: ["Add 80 kg compost per acre", "Apply 12 kg nitrogen in the next split", "Recheck after 7 days"] },
    irrigation: { eyebrow: "Water manager · next 48 hours", headline: "Wait until tomorrow morning to irrigate.", body: "Rain is expected tonight. A shorter 38-minute pump run tomorrow will protect your crop without over-pumping.", metric: "38 min", metricLabel: "pump runtime", steps: ["Hold irrigation tonight", "Check moisture at 06:30 tomorrow", "Run pump for 38 minutes if soil is dry"] },
    weather: { eyebrow: "IMD Agromet · updated 18 min ago", headline: "Hold spraying until the rain window passes.", body: "There is an 80% chance of rain within 6 hours. The safest action is to wait and protect the crop from wash-off.", metric: "80%", metricLabel: "rain confidence", steps: ["Do not spray today", "Secure harvested onions under cover", "Review alert again at 07:00"] },
    pest: { eyebrow: "ICAR diagnostic · photo + microclimate", headline: "Early thrips risk detected in the field.", body: "The image pattern and recent dry weather suggest a moderate risk. Start with the organic option and monitor new leaves.", metric: "74%", metricLabel: "confidence", steps: ["Inspect 10 plants in each corner", "Use blue sticky traps", "Escalate if new leaf damage increases"] },
    seed: { eyebrow: "SeedNet screen · preliminary result", headline: "This batch is ready for a germination test.", body: "The screen found low foreign matter and 91% visual purity. A simple home germination test will confirm viability.", metric: "91%", metricLabel: "visual purity", steps: ["Keep 100 seeds aside", "Test in a damp cloth for 7 days", "Use a lab test if germination is below 80%"] },
    fertilizer: { eyebrow: "Nutrient + mandi price optimizer", headline: "Save ₹1,240 without reducing the target yield.", body: "A split application of urea, DAP, and compost is the most cost-effective mix for your 2-acre onion plot.", metric: "₹6,860", metricLabel: "estimated total", steps: ["Basal: 50 kg DAP + compost", "Vegetative: 28 kg urea in two splits", "Avoid fertilizer before heavy rain"] },
    practice: { eyebrow: "KVK crop calendar · adjusted for delay", headline: "You are on track for harvest in 62 days.", body: "The calendar has shifted by 5 days for the late monsoon. Your next milestone is weeding and earthing-up.", metric: "62 days", metricLabel: "to expected harvest", steps: ["Finish first weeding this week", "Earth up after the next irrigation", "Keep a harvest crate plan ready"] },
    resources: { eyebrow: "Season budget · tenant-friendly", headline: "Your working capital covers the next milestone.", body: "You have ₹18,400 available. The next two weeks need ₹6,860, leaving a buffer for labor and crop protection.", metric: "₹11,540", metricLabel: "buffer after plan", steps: ["Reserve fertilizer budget", "Book labor 3 days ahead", "KCC route is available without land-title blocking"] },
  },
  hi: {
    soil: { eyebrow: "मिट्टी स्वास्थ्य कार्ड · लाइव बदलाव", headline: "आपकी मिट्टी प्याज़ की अच्छी फसल दे सकती है।", body: "वृद्धि अवस्था के लिए नाइट्रोजन थोड़ी कम है। पहले कंपोस्ट डालें, फिर अगली सिंचाई से पहले खुराक देखें।", metric: "42%", metricLabel: "अभी नमी", steps: ["प्रति एकड़ 80 किलो कंपोस्ट डालें", "अगली खुराक में 12 किलो नाइट्रोजन दें", "7 दिन बाद फिर जांचें"] },
    irrigation: { eyebrow: "पानी प्रबंधक · अगले 48 घंटे", headline: "सिंचाई कल सुबह तक रोकें।", body: "आज रात बारिश की संभावना है। कल 38 मिनट की छोटी पंप चाल फसल बचाएगी और ज्यादा पानी नहीं लगेगा।", metric: "38 मिनट", metricLabel: "पंप समय", steps: ["आज रात सिंचाई रोकें", "कल 06:30 पर नमी देखें", "मिट्टी सूखी हो तो 38 मिनट पंप चलाएं"] },
    weather: { eyebrow: "IMD एग्रोमेट · 18 मिनट पहले अपडेट", headline: "बारिश रुकने तक छिड़काव रोकें।", body: "अगले 6 घंटे में बारिश की 80% संभावना है। दवा बहने से बचाने के लिए इंतजार करना सबसे सुरक्षित है।", metric: "80%", metricLabel: "बारिश का भरोसा", steps: ["आज छिड़काव न करें", "कटी प्याज़ को ढककर रखें", "सुबह 07:00 बजे चेतावनी फिर देखें"] },
    pest: { eyebrow: "ICAR जांच · फोटो + मौसम", headline: "खेत में थ्रिप्स का शुरुआती खतरा मिला।", body: "फोटो और सूखे मौसम से मध्यम खतरा दिखता है। पहले जैविक उपाय करें और नई पत्तियों पर नज़र रखें।", metric: "74%", metricLabel: "भरोसा", steps: ["हर कोने में 10 पौधे देखें", "नीले चिपचिपे ट्रैप लगाएं", "नुकसान बढ़े तो विशेषज्ञ से बात करें"] },
    seed: { eyebrow: "SeedNet स्क्रीन · शुरुआती परिणाम", headline: "यह बीज खेप अंकुरण जांच के लिए तैयार है।", body: "स्क्रीन में कम बाहरी पदार्थ और 91% दृश्य शुद्धता मिली। घर की अंकुरण जांच से पुष्टि करें।", metric: "91%", metricLabel: "दृश्य शुद्धता", steps: ["100 बीज अलग रखें", "7 दिन गीले कपड़े में जांचें", "अंकुरण 80% से कम हो तो लैब जांच करें"] },
    fertilizer: { eyebrow: "पोषण + मंडी कीमत गणना", headline: "उपज घटाए बिना ₹1,240 बचाएं।", body: "2 एकड़ प्याज़ के लिए यूरिया, DAP और कंपोस्ट की खुराक सबसे कम खर्च वाली है।", metric: "₹6,860", metricLabel: "अनुमानित खर्च", steps: ["बेसल: 50 किलो DAP + कंपोस्ट", "वृद्धि: दो बार में 28 किलो यूरिया", "तेज बारिश से पहले खाद न डालें"] },
    practice: { eyebrow: "KVK फसल कैलेंडर · देरी के अनुसार", headline: "आप 62 दिन में कटाई के लिए सही रास्ते पर हैं।", body: "देर से आए मानसून के लिए कैलेंडर 5 दिन आगे किया गया है। अगला काम निराई और मिट्टी चढ़ाना है।", metric: "62 दिन", metricLabel: "कटाई तक", steps: ["इस सप्ताह पहली निराई पूरी करें", "अगली सिंचाई के बाद मिट्टी चढ़ाएं", "कटाई के लिए क्रेट तैयार रखें"] },
    resources: { eyebrow: "मौसम बजट · किरायेदारों के लिए", headline: "आपकी पूंजी अगले काम के लिए पर्याप्त है।", body: "आपके पास ₹18,400 हैं। अगले दो सप्ताह में ₹6,860 लगेंगे, फिर मजदूरी और फसल सुरक्षा के लिए बचत रहेगी।", metric: "₹11,540", metricLabel: "योजना के बाद बचत", steps: ["खाद का बजट अलग रखें", "मजदूर 3 दिन पहले बुक करें", "बिना जमीन के कागज़ के KCC रास्ता उपलब्ध है"] },
  },
  mr: {
    soil: { eyebrow: "माती आरोग्य कार्ड · थेट बदल", headline: "तुमची माती कांद्याच्या चांगल्या पिकाला साथ देऊ शकते.", body: "वाढीच्या अवस्थेसाठी नायट्रोजन थोडे कमी आहे. आधी कंपोस्ट द्या आणि पुढील सिंचनापूर्वी मात्रा तपासा.", metric: "42%", metricLabel: "सध्याचा ओलावा", steps: ["प्रति एकर 80 किलो कंपोस्ट द्या", "पुढील मात्रेत 12 किलो नायट्रोजन द्या", "7 दिवसांनी पुन्हा तपासा"] },
    irrigation: { eyebrow: "पाणी व्यवस्थापक · पुढील 48 तास", headline: "उद्या सकाळपर्यंत सिंचन थांबवा.", body: "आज रात्री पावसाची शक्यता आहे. उद्या 38 मिनिटांचा पंप तुमचे पीक वाचवेल आणि जास्त पाणी टाळेल.", metric: "38 मि.", metricLabel: "पंप वेळ", steps: ["आज रात्री सिंचन थांबवा", "उद्या 06:30 वाजता ओलावा पाहा", "माती कोरडी असल्यास 38 मिनिटे पंप चालवा"] },
    weather: { eyebrow: "IMD Agromet · 18 मिनिटांपूर्वी अपडेट", headline: "पावसाची वेळ संपेपर्यंत फवारणी थांबवा.", body: "पुढील 6 तासांत पावसाची 80% शक्यता आहे. औषध वाहून जाऊ नये म्हणून थांबणे सुरक्षित आहे.", metric: "80%", metricLabel: "पावसाचा विश्वास", steps: ["आज फवारणी करू नका", "काढलेला कांदा झाकून ठेवा", "सकाळी 07:00 वाजता इशारा पुन्हा पाहा"] },
    pest: { eyebrow: "ICAR तपासणी · फोटो + हवामान", headline: "शेतात थ्रिप्सचा सुरुवातीचा धोका दिसतो.", body: "फोटो आणि कोरड्या हवामानामुळे मध्यम धोका दिसतो. आधी सेंद्रिय उपाय करा आणि नवीन पानांवर लक्ष ठेवा.", metric: "74%", metricLabel: "विश्वास", steps: ["प्रत्येक कोपऱ्यात 10 झाडे तपासा", "निळे चिकट सापळे लावा", "नुकसान वाढल्यास तज्ज्ञांशी बोला"] },
    seed: { eyebrow: "SeedNet स्क्रीन · प्राथमिक निकाल", headline: "ही बियाणे खेप उगवण चाचणीसाठी तयार आहे.", body: "स्क्रीनमध्ये कमी परकीय पदार्थ आणि 91% दृश्य शुद्धता दिसते. घरच्या उगवण चाचणीने खात्री करा.", metric: "91%", metricLabel: "दृश्य शुद्धता", steps: ["100 बियाणे बाजूला ठेवा", "7 दिवस ओल्या कापडात तपासा", "उगवण 80% पेक्षा कमी असल्यास लॅब तपासणी करा"] },
    fertilizer: { eyebrow: "पोषण + बाजारभाव गणना", headline: "उत्पन्न कमी न करता ₹1,240 वाचवा.", body: "2 एकर कांद्यासाठी युरिया, DAP आणि कंपोस्टची मात्रा सर्वात कमी खर्चाची आहे.", metric: "₹6,860", metricLabel: "अंदाजे खर्च", steps: ["बेसल: 50 किलो DAP + कंपोस्ट", "वाढ: दोन हप्त्यांत 28 किलो युरिया", "जोरदार पावसापूर्वी खत देऊ नका"] },
    practice: { eyebrow: "KVK पीक कॅलेंडर · विलंबानुसार", headline: "तुम्ही 62 दिवसांत कापणीसाठी योग्य मार्गावर आहात.", body: "उशिरा आलेल्या मान्सूनसाठी कॅलेंडर 5 दिवसांनी बदलले आहे. पुढचे काम निंदणी आणि माती चढवणे आहे.", metric: "62 दिवस", metricLabel: "कापणीपर्यंत", steps: ["या आठवड्यात पहिली निंदणी पूर्ण करा", "पुढील सिंचनानंतर माती चढवा", "कापणीसाठी क्रेट तयार ठेवा"] },
    resources: { eyebrow: "हंगाम बजेट · भाडेकरूंसाठी", headline: "तुमचे भांडवल पुढील कामासाठी पुरेसे आहे.", body: "तुमच्याकडे ₹18,400 आहेत. पुढील दोन आठवड्यांना ₹6,860 लागतील आणि मजुरी व पीक संरक्षणासाठी रक्कम उरेल.", metric: "₹11,540", metricLabel: "योजनेनंतर शिल्लक", steps: ["खताचा बजेट वेगळा ठेवा", "मजूर 3 दिवस आधी बुक करा", "जमिनीच्या मालकीशिवाय KCC मार्ग उपलब्ध आहे"] },
  },
};

function cn(...classes: Array<string | false | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function LogoMark() {
  return <div className="logo-mark" aria-hidden="true"><Sprout size={22} strokeWidth={2.5} /></div>;
}

function LocaleSwitcher({ locale, setLocale }: { locale: Locale; setLocale: (locale: Locale) => void }) {
  const options: Array<{ id: Locale; label: string }> = [
    { id: "en", label: "EN" },
    { id: "hi", label: "हि" },
    { id: "mr", label: "म" },
  ];
  return (
    <div className="language-switcher" aria-label="Language selector">
      {options.map((option) => (
        <button key={option.id} className={cn("language-option", locale === option.id && "is-active")} onClick={() => setLocale(option.id)} aria-pressed={locale === option.id}>{option.label}</button>
      ))}
    </div>
  );
}

function StatusPill({ children, tone = "green" }: { children: React.ReactNode; tone?: "green" | "amber" | "slate" }) {
  return <span className={cn("status-pill", `status-${tone}`)}><span className="status-dot" />{children}</span>;
}

function ModuleCard({ id, locale, onOpen, onSpeak }: { id: ModuleId; locale: Locale; onOpen: () => void; onSpeak: () => void }) {
  const t = getTranslation(locale);
  const Icon = moduleIcons[id];
  const color = moduleColors[id];
  const urgent = id === "weather" || id === "irrigation";
  return (
    <article className={cn("module-card", `module-${color}`, urgent && "module-urgent")}>
      <div className="module-card-top"><div className="module-icon"><Icon size={21} strokeWidth={2.1} /></div><button className="icon-button subtle" onClick={onSpeak} aria-label={`${t.speak}: ${t.module[id].title}`}><Volume2 size={17} /></button></div>
      <div className="module-copy"><div className="module-index">0{moduleIds.indexOf(id) + 1}</div><h3>{t.module[id].title}</h3><p>{t.module[id].short}</p></div>
      <button className="module-action" onClick={onOpen}><span>{t.module[id].action}</span><ArrowRight size={16} /></button>
    </article>
  );
}

function VoiceGuide({ locale, voice, onClose }: { locale: Locale; voice: ReturnType<typeof useVoice>; onClose: () => void }) {
  const t = getTranslation(locale);
  const [step, setStep] = useState(0);
  const steps = [
    { icon: Mic2, title: t.voiceGuideTitle, body: t.guideStepBody },
    { icon: Leaf, title: t.crop, body: `${t.crop}: ${t.cropValue}` },
    { icon: Check, title: t.recommended, body: t.module.weather.action },
  ];
  const current = steps[step];
  const Icon = current.icon;
  useEffect(() => {
    voice.speak(`${current.title}. ${current.body}`);
  }, [step]);
  return (
    <div className="voice-sheet" role="dialog" aria-modal="true" aria-labelledby="voice-title">
      <div className="voice-sheet-glow" />
      <div className="voice-sheet-header"><div><div className="eyebrow light">{t.voiceGuide} · {t.guideStep}</div><h2 id="voice-title">{current.title}</h2></div><button className="icon-button light-button" onClick={onClose} aria-label="Close"><X size={20} /></button></div>
      <div className="voice-orb-wrap"><div className={cn("voice-orb", voice.isListening && "is-listening", voice.isSpeaking && "is-speaking")}><Icon size={42} /></div><div className="voice-ring ring-one" /><div className="voice-ring ring-two" /></div>
      <p className="voice-body">{current.body}</p>
      {voice.transcript && <div className="transcript-box"><span>{t.listening}</span><strong>“{voice.transcript}”</strong></div>}
      {voice.voiceError && <div className="voice-error"><CircleHelp size={17} /><span>{t.voiceNotSupported}</span></div>}
      <div className="voice-controls"><button className={cn("voice-main-button", voice.isListening && "recording")} onClick={voice.isListening ? voice.stopListening : voice.startListening}><Mic size={19} />{voice.isListening ? t.stopListening : t.startListening}</button><button className="voice-speak-button" onClick={() => voice.isSpeaking ? voice.stopSpeaking() : voice.speak(`${current.title}. ${current.body}`)}>{voice.isSpeaking ? <VolumeX size={18} /> : <Volume2 size={18} />}{voice.isSpeaking ? t.stop : t.speak}</button></div>
      <div className="voice-progress"><div className="voice-progress-track"><span style={{ width: `${((step + 1) / steps.length) * 100}%` }} /></div><div className="voice-progress-actions"><span>{step + 1} / {steps.length}</span>{step < steps.length - 1 ? <button onClick={() => setStep((value) => value + 1)}>{t.continueLabel} <ChevronRight size={15} /></button> : <button onClick={onClose}><Check size={15} /> {t.saved}</button>}</div></div>
    </div>
  );
}

function DetailPanel({ id, locale, voice, profile, onBack }: { id: ModuleId; locale: Locale; voice: ReturnType<typeof useVoice>; profile: FarmerProfile; onBack: () => void }) {
  const t = getTranslation(locale);
  const detail = detailCopy[locale][id];
  const Icon = moduleIcons[id];
  const [saved, setSaved] = useState(false);
  return (
    <main className="detail-page">
      <button className="back-link" onClick={onBack}><MoveLeft size={17} />{t.back}</button>
      <div className="detail-hero"><div className="detail-icon"><Icon size={28} /></div><div><div className="eyebrow">{detail.eyebrow}</div><h1>{detail.headline}</h1><p>{detail.body}</p></div><button className="speak-detail" onClick={() => voice.speak(`${detail.headline}. ${detail.body}`)}><Volume2 size={18} />{t.speak}</button></div>
      <div className="detail-grid"><section className="plan-card"><div className="plan-card-header"><div><span className="card-kicker">{t.recommended}</span><h2>{t.nextTask}</h2></div><StatusPill tone="green">{t.stable}</StatusPill></div><div className="plan-metric"><strong>{detail.metric}</strong><span>{detail.metricLabel}</span></div><ol className="step-list">{detail.steps.map((step, index) => <li key={step}><span>{index + 1}</span><p>{step}</p></li>)}</ol><button className="primary-button full" onClick={() => setSaved(true)}>{saved ? <><Check size={18} />{t.saved}</> : <><ShieldCheck size={18} />{t.useThisPlan}</>}</button></section><aside className="detail-aside"><div className="field-context"><span className="card-kicker">{t.fieldSnapshot}</span><div className="context-row"><span>{t.crop}</span><strong>{profile.crop || t.cropValue}</strong></div><div className="context-row"><span>{t.acres}</span><strong>{profile.farmSize}</strong></div><div className="context-row"><span>{t.stage}</span><strong>{t.stageValue}</strong></div><div className="context-row"><span>{t.village}</span><strong>{profile.village}, {profile.district}</strong></div></div><div className="trust-card"><div className="trust-icon"><Radio size={18} /></div><div><strong>{t.dataTrust}</strong><p>{t.source}: ICAR · {t.lastUpdated}</p><span>{t.confidence}: 86%</span></div></div><div className="fallback-card"><div className="fallback-icon"><AudioLines size={18} /></div><div><strong>{t.audioFallback}</strong><p>{t.audioFallbackBody}</p></div></div></aside></div>

      {/* Embedded Live API Integration Modules */}
      {id === "pest" && (
        <section className="mt-8">
          <CropScanner locale={locale} defaultCrop={profile.crop} />
        </section>
      )}

      {(id === "fertilizer" || id === "resources") && (
        <section className="mt-8">
          <MandiTracker locale={locale} />
        </section>
      )}

      {(id === "soil" || id === "irrigation") && (
        <section className="mt-8 bg-white p-5 rounded-2xl border border-slate-200/90 shadow-sm">
          <div className="mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md">
              Leaflet & OpenStreetMap Farm Boundary
            </span>
            <h3 className="text-base font-bold text-slate-800 mt-1">Interactive Farm Locator</h3>
            <p className="text-xs text-slate-500">Pinpoint your crop plot or use GPS with explicit permission.</p>
          </div>
          <MapView
            initialCenter={{ lat: 20.087, lng: 73.95 }}
            markerTitle={`${profile.name}'s Field`}
            markerDescription={`${profile.village}, ${profile.district} · ${profile.crop} (${profile.farmSize})`}
          />
        </section>
      )}
    </main>
  );
}

export default function Home({ locale, setLocale, profile, onLogout }: HomeProps) {
  const t = getTranslation(locale);
  const voice = useVoice(locale);
  const [weather, setWeather] = useState<WeatherSnapshot | null>(null);
  const [locating, setLocating] = useState(false);
  const [locationMessage, setLocationMessage] = useState("");
  const [selectedModule, setSelectedModule] = useState<ModuleId | null>(null);
  const [voiceOpen, setVoiceOpen] = useState(false);
  const [aiChatOpen, setAiChatOpen] = useState(false);
  const [showFarmMap, setShowFarmMap] = useState(false);
  const [assisted, setAssisted] = useState(false);
  const [online, setOnline] = useState(true);
  const [activeNav, setActiveNav] = useState("overview");

  useEffect(() => {
    setOnline(navigator.onLine);
    const handleOnline = () => setOnline(true);
    const handleOffline = () => setOnline(false);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => { window.removeEventListener("online", handleOnline); window.removeEventListener("offline", handleOffline); };
  }, []);

  useEffect(() => {
    fetchWeather(20.087, 73.95, `${profile.village}, ${profile.district}`).then(setWeather);
  }, [profile.district, profile.village]);

  const refreshWeatherForLocation = () => {
    if (!navigator.geolocation) {
      setLocationMessage(t.locationDenied);
      return;
    }
    setLocating(true);
    setLocationMessage("");
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        fetchWeather(coords.latitude, coords.longitude, t.location).then((snapshot) => {
          setWeather(snapshot);
          setLocating(false);
          setLocationMessage(snapshot.isLive ? t.liveWeather : t.mockWeather);
        });
      },
      () => {
        setLocating(false);
        setLocationMessage(t.locationDenied);
      },
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 300000 },
    );
  };

  const displayName = profile.name.split(" ")[0];
  const overviewText = useMemo(() => `${t.greeting}, ${displayName}. ${t.overviewSubtitle}`, [t, displayName]);
  const navItems = [
    { id: "overview", label: t.overview, icon: TrendingUp },
    ...moduleIds.map((id) => ({ id, label: t.module[id].title, icon: moduleIcons[id] })),
  ];

  const openModule = (id: ModuleId) => { setSelectedModule(id); setActiveNav(id); window.scrollTo({ top: 0, behavior: "smooth" }); };
  const speakOverview = () => voice.speak(`${overviewText} ${t.nextTask}: ${t.module.irrigation.title}. ${t.module.irrigation.short}`);

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand-lockup"><LogoMark /><div><strong>{t.brand}</strong><span>{t.brandTagline}</span></div></div>
        <div className="sidebar-divider" />
        <nav className="main-nav" aria-label={t.navLabel}><span className="nav-heading">{t.overview}</span>{navItems.map((item) => { const ItemIcon = item.icon; return <button key={item.id} className={cn("nav-item", activeNav === item.id && "is-active")} onClick={() => { setActiveNav(item.id); if (item.id !== "overview") openModule(item.id as ModuleId); else setSelectedModule(null); }}><ItemIcon size={18} /><span>{item.label}</span>{item.id === "weather" && <span className="nav-alert">2</span>}</button>; })}</nav>
        <div className="sidebar-bottom"><div className="help-card"><div className="help-card-icon"><CircleHelp size={17} /></div><div><strong>{t.askForHelp}</strong><a href="tel:18001801551">{t.callCentre}</a></div></div><button className="profile-button" onClick={onLogout}><span className="avatar">{profile.name[0]}</span><span><strong>{profile.name}</strong><small>{profile.village}, {profile.district}</small></span><MoreHorizontal size={18} /></button></div>
      </aside>
      <div className="mobile-topbar"><button className="icon-button" aria-label="Open navigation"><Menu size={20} /></button><div className="brand-lockup"><LogoMark /><strong>{t.brand}</strong></div><button className="icon-button"><BellRing size={19} /></button></div>
      <div className="content-shell">
        {!online && <div className="offline-banner"><Waves size={16} />{t.offlineBanner}</div>}
        <header className="topbar">
          <div className="breadcrumb"><span>{t.brand}</span><ChevronRight size={15} /><strong>{selectedModule ? t.module[selectedModule].title : t.overview}</strong></div>
          <div className="topbar-actions">
            <div className="sync-status"><span className={cn("sync-dot", online ? "is-online" : "is-offline")} />{online ? t.online : t.offlineReady}</div>
            <button
              className="flex items-center gap-1.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold px-3 py-1.5 rounded-xl shadow-sm transition"
              onClick={() => setAiChatOpen(true)}
            >
              <Bot size={15} />
              <span>{locale === "hi" ? "AI सलाहकार" : locale === "mr" ? "AI सल्लागार" : "AI Advisor"}</span>
            </button>
            <LocaleSwitcher locale={locale} setLocale={setLocale} />
            <button className="voice-trigger" onClick={() => setVoiceOpen(true)}><Mic2 size={17} />{t.voiceGuide}</button>
          </div>
        </header>

        {selectedModule ? (
          <DetailPanel id={selectedModule} locale={locale} voice={voice} profile={profile} onBack={() => { setSelectedModule(null); setActiveNav("overview"); }} />
        ) : (
          <main className="dashboard-main">
            <section className="welcome-row">
              <div>
                <div className="eyebrow">{t.dateLabel} · {profile.village}, {profile.district}</div>
                <h1>{t.greeting}, <em>{displayName}</em>.</h1>
                <p>{t.overviewSubtitle}</p>
              </div>
              <div className="welcome-actions">
                <button className="outline-button" onClick={speakOverview}>{voice.isSpeaking ? <Pause size={16} /> : <Volume2 size={16} />}{voice.isSpeaking ? t.stop : t.speak}</button>
                <button className="outline-button" onClick={() => setAiChatOpen(true)}><Sparkles size={16} className="text-emerald-700" />{locale === "hi" ? "AI सवाल" : locale === "mr" ? "AI सल्ला" : "AI Advisor"}</button>
                <button className="primary-button" onClick={() => setVoiceOpen(true)}><Mic size={17} />{t.listen}</button>
              </div>
            </section>

            <section className="hero-grid">
              <div className="hero-card">
                <div className="hero-card-pattern" />
                <div className="hero-card-content">
                  <div className="hero-card-kicker"><span className="pulse-dot" />{t.nextTask}</div>
                  <h2>{t.module.irrigation.title}</h2>
                  <p>{t.module.irrigation.short}. {detailCopy[locale].irrigation.headline}</p>
                  <button className="hero-link" onClick={() => openModule("irrigation")}>{t.module.irrigation.action}<ArrowRight size={16} /></button>
                </div>
                <div className="hero-weather">
                  <CloudSun size={24} />
                  <strong>{weather ? `${weather.temperature}°` : "28°"}</strong>
                  <span>{weather?.description ?? "Partly cloudy"}</span>
                </div>
              </div>

              <div className="snapshot-card">
                <div className="snapshot-title">
                  <span>{t.fieldSnapshot}</span>
                  <div className="flex items-center gap-1">
                    <button
                      className="location-button"
                      onClick={() => setShowFarmMap(!showFarmMap)}
                      aria-label="Toggle Interactive Farm Map"
                      title="Toggle Interactive Farm Map"
                    >
                      <MapIcon size={17} />
                    </button>
                    <button
                      className="location-button"
                      onClick={refreshWeatherForLocation}
                      aria-label={t.useLocation}
                      title={t.useLocation}
                    >
                      <LocateFixed size={17} />
                    </button>
                  </div>
                </div>
                <div className="snapshot-value">{profile.farmSize.replace(" acres", "")} <small>acres</small></div>
                <div className="snapshot-location">{weather?.location ?? `${profile.village}, ${profile.district}, ${profile.state}`}</div>
                <div className="snapshot-bars">
                  <div><span>{t.soilMoisture}</span><strong>42%</strong><i><b style={{ width: "42%" }} /></i></div>
                  <div><span>{t.rainfall}</span><strong>{weather ? `${weather.rainfall} mm` : "18 mm"}</strong><i><b className="rain-bar" style={{ width: `${weather?.precipitationProbability ?? 66}%` }} /></i></div>
                </div>
                <div className="weather-status">
                  <span className={weather?.isLive ? "is-live" : ""} />
                  {locating ? t.locating : locationMessage || (weather?.isLive ? t.liveWeather : t.mockWeather)}
                </div>
              </div>
            </section>

            {/* Interactive Leaflet Map Drawer / Expansion */}
            {showFarmMap && (
              <section className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-sm animate-in fade-in">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md">
                      OpenStreetMap & Leaflet
                    </span>
                    <h3 className="text-base font-bold text-slate-800 mt-1">Farm Boundary & Satellite Coordinates</h3>
                  </div>
                  <button
                    onClick={() => setShowFarmMap(false)}
                    className="text-slate-400 hover:text-slate-700 text-xs px-2 py-1 bg-slate-100 rounded-lg"
                  >
                    Close Map
                  </button>
                </div>
                <MapView
                  initialCenter={{ lat: 20.087, lng: 73.95 }}
                  markerTitle={`${profile.name}'s Farm`}
                  markerDescription={`${profile.village}, ${profile.district} (${profile.crop})`}
                />
              </section>
            )}

            <section className="status-strip">
              <div className="status-strip-item"><div className="strip-icon green"><Leaf size={17} /></div><div><span>{t.soilMoisture}</span><strong>{t.soilValue}</strong></div></div>
              <div className="status-strip-item"><div className="strip-icon blue"><Droplets size={17} /></div><div><span>{t.rainfall}</span><strong>{t.rainfallValue}</strong></div></div>
              <div className="status-strip-item"><div className="strip-icon amber"><ShieldCheck size={17} /></div><div><span>{t.dataTrust}</span><strong>{t.modulesCount}</strong></div></div>
              <div className="assisted-toggle"><div><strong>{t.assistedMode}</strong><span>{t.assistedModeBody}</span></div><button className={cn("toggle", assisted && "is-on")} onClick={() => setAssisted(!assisted)} role="switch" aria-checked={assisted}><span /></button></div>
            </section>

            <section className="section-heading"><div><div className="eyebrow">{t.modulesCount}</div><h2>{t.modules}</h2></div><button className="text-button" onClick={() => setVoiceOpen(true)}><Mic2 size={16} />{t.voiceGuide}</button></section>
            <section className="module-grid">{moduleIds.map((id) => <ModuleCard key={id} id={id} locale={locale} onOpen={() => openModule(id)} onSpeak={() => voice.speak(`${t.module[id].title}. ${t.module[id].short}`)} />)}</section>
            <section className="evidence-banner"><div className="evidence-mark"><Radio size={22} /></div><div><strong>{t.dataTrust}</strong><p>{t.dataTrustBody}</p></div><button className="evidence-action" onClick={() => voice.speak(t.dataTrustBody)}><Volume2 size={17} />{t.speak}</button></section>
          </main>
        )}
      </div>

      {voiceOpen && <VoiceGuide locale={locale} voice={voice} onClose={() => setVoiceOpen(false)} />}
      <AiAssistant
        locale={locale}
        profile={profile}
        isOpen={aiChatOpen}
        onClose={() => setAiChatOpen(false)}
      />
    </div>
  );
}
