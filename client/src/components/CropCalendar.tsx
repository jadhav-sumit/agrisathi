import { useState, useEffect } from "react";
import { Calendar, Clock, CheckCircle2, AlertTriangle, Droplets, Sprout, ShieldAlert, Volume2, ArrowRight } from "lucide-react";
import type { Locale } from "@/lib/i18n";
import { useVoice } from "@/hooks/useVoice";

interface CropCalendarProps {
  locale: Locale;
  cropName?: string;
  village?: string;
}

interface CropStage {
  stageNumber: number;
  nameEn: string;
  nameHi: string;
  nameMr: string;
  minDays: number;
  maxDays: number;
  irrigationEn: string;
  irrigationHi: string;
  irrigationMr: string;
  fertilizerEn: string;
  fertilizerHi: string;
  fertilizerMr: string;
  pestWarningEn: string;
  pestWarningHi: string;
  pestWarningMr: string;
}

const cropStageProfiles: Record<string, { totalDays: number; stages: CropStage[] }> = {
  Onion: {
    totalDays: 120,
    stages: [
      {
        stageNumber: 1,
        nameEn: "Transplanting & Establishment",
        nameHi: "रोपाई व प्रारंभिक जड़ विकास",
        nameMr: "रोप लागवड व मुळे धरणे अवस्था",
        minDays: 0,
        maxDays: 20,
        irrigationEn: "Light irrigation every 4-5 days to help seedlings establish roots.",
        irrigationHi: "हल्की सिंचाई हर 4-5 दिन में ताकि नए पौधे आसानी से जड़ पकड़ सकें।",
        irrigationMr: "रोप मुळे धरण्यासाठी दर 4-5 दिवसांनी हलके पाणी द्यावे.",
        fertilizerEn: "Apply basal dose: DAP + 50% Potash + well-rotted FYM.",
        fertilizerHi: "बेसल खुराक दें: DAP + 50% पोटाश + सड़ी हुई गोबर खाद।",
        fertilizerMr: "बेसल डोस: DAP + 50% पोटॅश + शेणखत लागवडीवेळी द्या.",
        pestWarningEn: "Watch for damping-off and cutworms. Drench Trichoderma viride.",
        pestWarningHi: "डंपिंग-ऑफ (सड़न) और कतरने वाले कीड़ों से बचाव के लिए ट्राइकोडर्मा डालें।",
        pestWarningMr: "मर रोग आणि खोडकिड्याचा धोका; ट्रायकोडर्माची आळवणी करा.",
      },
      {
        stageNumber: 2,
        nameEn: "Vegetative Foliage Growth",
        nameHi: "शाखीय बढ़वार व पत्तियों का विकास",
        nameMr: "शाकीय वाढ व नवीन पानांची फूट",
        minDays: 21,
        maxDays: 50,
        irrigationEn: "Maintain uniform soil moisture. Avoid water-logging.",
        irrigationHi: "नमी बनाए रखें लेकिन क्यारियों में पानी रुकने न दें।",
        irrigationMr: "जमिनीत वाफसा ठेवा; वाफ्यामध्ये पाणी साचू देऊ नका.",
        fertilizerEn: "First split of Urea (25 kg/acre) + Micronutrient foliar spray.",
        fertilizerHi: "यूरिया की पहली खुराक (25 किग्रा/एकड़) + सूक्ष्म पोषक तत्वों का छिड़काव।",
        fertilizerMr: "युरियाचा पहिला हप्ता (25 किलो/एकर) + सूक्ष्म अन्नद्रव्यांची फवारणी.",
        pestWarningEn: "High risk of Thrips (Curled yellow leaf tips). Install blue sticky traps.",
        pestWarningHi: "थ्रिप्स (मावा/चुरड़ा-मुरड़ा) का गंभीर खतरा। नीले चिपचिपे ट्रैप लगाएं।",
        pestWarningMr: "फुलकिडे (थ्रिप्स/मावा) धोका; शेतात एकरी 15-20 निळे चिकट सापळे लावा.",
      },
      {
        stageNumber: 3,
        nameEn: "Bulb Initiation & Sizing",
        nameHi: "कंद निर्माण व आकार विकास",
        nameMr: "कांदा कंद फुगवण व पोसणे अवस्था",
        minDays: 51,
        maxDays: 90,
        irrigationEn: "Regular irrigation every 7-8 days. Critical moisture period.",
        irrigationHi: "हर 7-8 दिन में सिंचाई करें; कंद के विकास के लिए यह सबसे महत्वपूर्ण समय है।",
        irrigationMr: "कंद फुगवणीचा महत्त्वाचा काळ; दर 7-8 दिवसांनी नियमित पाणी द्या.",
        fertilizerEn: "Apply 00:00:50 (Potassium Sulphate) + Boron spray for luster and size.",
        fertilizerHi: "कंद के चमकदार रंग और वजन के लिए 00:00:50 + बोरॉन का छिड़काव करें।",
        fertilizerMr: "कांद्याची चमक, रंग व वजन वाढवण्यासाठी 00:00:50 + बोरॉन फवारा.",
        pestWarningEn: "Purple Blotch & Stemphylium blight risk. Spray fungicide if spots appear.",
        pestWarningHi: "बैंगनी धब्बा रोग (Purple Blotch) का खतरा। धब्बे दिखते ही कवकनाशी छिड़कें।",
        pestWarningMr: "जांभळा करपा रोगाचा प्रादुर्भाव; लक्षणे दिसताच प्रमाणित बुरशीनाशक फवारा.",
      },
      {
        stageNumber: 4,
        nameEn: "Maturity & Pre-Harvest Drying",
        nameHi: "परिपक्वता व कटाई पूर्व तैयारी",
        nameMr: "कांदा पक्वता व काढणीपूर्व सुकवणे",
        minDays: 91,
        maxDays: 120,
        irrigationEn: "Stop irrigation 10-15 days before harvest to prevent storage rot.",
        irrigationHi: "कटाई से 10-15 दिन पहले सिंचाई पूरी तरह बंद कर दें ताकि भंडारण में सड़न न हो।",
        irrigationMr: "काढणीपूर्वी 12-15 दिवस पाणी पूर्ण बंद करा; साठवणुकीत टिकवण क्षमता वाढते.",
        fertilizerEn: "Zero nitrogen application. Allow neck tops to fall naturally (50% neck fall).",
        fertilizerHi: "कोई यूरिया न डालें। 50% पत्तियों को प्राकृतिक रूप से झुकने दें।",
        fertilizerMr: "कोणतेही खत देऊ नका; 50% माना पडल्यानंतरच कांदा काढावा.",
        pestWarningEn: "Inspect neck area for fungal mold before curing in field shades.",
        pestWarningHi: "छांव में सुखाने से पहले कंद की गर्दन पर फफूंद की जांच करें।",
        pestWarningMr: "कांद्याची पात सुकवून सावलीत व्यवस्थित वाळवून घ्या.",
      },
    ],
  },
  Cotton: {
    totalDays: 160,
    stages: [
      {
        stageNumber: 1,
        nameEn: "Germination & Seedling",
        nameHi: "अंकुरण व प्रारंभिक अवस्था",
        nameMr: "उगवण व रोप अवस्था",
        minDays: 0,
        maxDays: 30,
        irrigationEn: "Light irrigation if rains are erratic.",
        irrigationHi: "बारिश में रुकावट होने पर हल्की सिंचाई दें।",
        irrigationMr: "पावसाचा खंड पडल्यास हलके संरक्षक पाणी द्या.",
        fertilizerEn: "Basal DAP + Zinc Sulphate application.",
        fertilizerHi: "बुवाई के समय DAP और जिंक सल्फेट दें।",
        fertilizerMr: "पेरणीवेळी DAP + झिंक सल्फेट खत द्या.",
        pestWarningEn: "Monitor for sucking pests (Jassids, Aphids). Install yellow traps.",
        pestWarningHi: "रस चूसक कीटों (माहू, हरा तेला) पर नज़र रखें। पीले ट्रैप लगाएं।",
        pestWarningMr: "मावा, तुडतुडे या रसशोषक किडींचे निरीक्षण करा; पिवळे सापळे लावा.",
      },
      {
        stageNumber: 2,
        nameEn: "Square & Flower Initiation",
        nameHi: "फूल व डोडे (Square) निर्माण अवस्था",
        nameMr: "पात्या व फुले लागण्याची अवस्था",
        minDays: 31,
        maxDays: 75,
        irrigationEn: "Critical water demand. Irrigate at alternate furrow.",
        irrigationHi: "अत्यधिक पानी की आवश्यकता; एकान्तर नाली में सिंचाई करें।",
        irrigationMr: "पाण्याची अत्यंत गरज; एकाआड एक सरीने पाणी द्या.",
        fertilizerEn: "Top dress Urea + Magnesium Sulphate spray to prevent red leaf.",
        fertilizerHi: "यूरिया दें + पत्तियां लाल होने से रोकने के लिए मैग्नीशियम सल्फेट छिड़कें।",
        fertilizerMr: "युरियाचा हप्ता द्या + पाने लाल पडू नयेत म्हणून मॅग्नेशियम सल्फेट फवारा.",
        pestWarningEn: "Pink Bollworm pheromone trap monitoring (8 traps/acre).",
        pestWarningHi: "गुलाबी सुंडी (Pink Bollworm) की निगरानी हेतु फेरोमोन ट्रैप लगाएं।",
        pestWarningMr: "गुलाबी बोंडअळीच्या नियंत्रणासाठी एकरी 8 कामगंध सापळे लावा.",
      },
      {
        stageNumber: 3,
        nameEn: "Boll Development & Picking",
        nameHi: "बोंड विकास व कपास तुड़ाई",
        nameMr: "बोंड विकास व कापूस वेचणी",
        minDays: 76,
        maxDays: 160,
        irrigationEn: "Taper off watering as bolls start cracking open.",
        irrigationHi: "जैसे ही बोंड फटने लगें, सिंचाई कम कर दें।",
        irrigationMr: "बोंडे फुटू लागताच पाणी देणे हळूहळू थांबवा.",
        fertilizerEn: "Foliar spray of 13:00:45 (Potassium Nitrate) for boll weight.",
        fertilizerHi: "बोंड के वजन और रेशे की गुणवत्ता हेतु 13:00:45 का छिड़काव करें।",
        fertilizerMr: "बोंडाचे वजन आणि धाग्याची गुणवत्ता वाढवण्यासाठी 13:00:45 फवारा.",
        pestWarningEn: "Pick dry, clean bolls without leaf trash for maximum mandi rate.",
        pestWarningHi: "उच्च मंडी भाव के लिए सूखे और साफ कपास की तुड़ाई करें।",
        pestWarningMr: "उच्च बाजारभाव मिळण्यासाठी कचराविरहीत कोरडा कापूस वेचा.",
      },
    ],
  },
};

export function CropCalendar({ locale, cropName = "Onion", village = "Field" }: CropCalendarProps) {
  const voice = useVoice(locale);

  // Look up profile or fallback to Onion
  const normalizedCrop = cropStageProfiles[cropName] ? cropName : "Onion";
  const profile = cropStageProfiles[normalizedCrop];

  // Sowing date persistence in localStorage
  const storageKey = `agrisathi-sowing-date-${normalizedCrop}`;
  const [sowingDate, setSowingDate] = useState<string>(() => {
    const saved = localStorage.getItem(storageKey);
    if (saved) return saved;
    // Default to 42 days ago (active growth stage)
    const d = new Date();
    d.setDate(d.getDate() - 42);
    return d.toISOString().split("T")[0];
  });

  const handleDateChange = (val: string) => {
    setSowingDate(val);
    localStorage.setItem(storageKey, val);
  };

  // Calculate days elapsed
  const sowingTime = new Date(sowingDate).getTime();
  const nowTime = new Date().getTime();
  const daysElapsed = Math.max(0, Math.floor((nowTime - sowingTime) / (1000 * 60 * 60 * 24)));
  const progressPercent = Math.min(100, Math.round((daysElapsed / profile.totalDays) * 100));
  const daysToHarvest = Math.max(0, profile.totalDays - daysElapsed);

  // Expected harvest date
  const harvestDateObj = new Date(sowingTime + profile.totalDays * 24 * 60 * 60 * 1000);
  const formattedHarvestDate = harvestDateObj.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  // Current active stage
  const currentStage =
    profile.stages.find((s) => daysElapsed >= s.minDays && daysElapsed <= s.maxDays) ||
    profile.stages[profile.stages.length - 1];

  const stageName =
    locale === "hi" ? currentStage.nameHi : locale === "mr" ? currentStage.nameMr : currentStage.nameEn;
  const irrigationAdvice =
    locale === "hi" ? currentStage.irrigationHi : locale === "mr" ? currentStage.irrigationMr : currentStage.irrigationEn;
  const fertilizerAdvice =
    locale === "hi" ? currentStage.fertilizerHi : locale === "mr" ? currentStage.fertilizerMr : currentStage.fertilizerEn;
  const pestAdvice =
    locale === "hi" ? currentStage.pestWarningHi : locale === "mr" ? currentStage.pestWarningMr : currentStage.pestWarningEn;

  const speakCalendar = () => {
    const text =
      locale === "mr"
        ? `${cropName} पिकाची पेरणी होऊन आज ${daysElapsed} दिवस झाले आहेत. पीक सध्या '${stageName}' अवस्थेत आहे. काढणीसाठी अजून अंदाजे ${daysToHarvest} दिवस शिल्लक आहेत. सिंचन सल्ला: ${irrigationAdvice}. खत सल्ला: ${fertilizerAdvice}.`
        : locale === "hi"
        ? `${cropName} फसल की बुवाई को आज ${daysElapsed} दिन हो चुके हैं। फसल वर्तमान में '${stageName}' अवस्था में है। कटाई में लगभग ${daysToHarvest} दिन शेष हैं। सिंचाई: ${irrigationAdvice}. खाद सलाह: ${fertilizerAdvice}.`
        : `Crop ${cropName} is at Day ${daysElapsed} in stage ${stageName}. Estimated ${daysToHarvest} days remaining until harvest. Irrigation: ${irrigationAdvice}`;

    voice.speak(text);
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-5 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md">
            ICAR Crop Phenology Engine
          </span>
          <h3 className="text-lg font-bold text-slate-800 mt-1 flex items-center gap-2">
            <Calendar className="text-emerald-700" size={20} />
            {locale === "hi"
              ? "दैनिक फसल विकास कैलेंडर व कार्य अनुसूची"
              : locale === "mr"
              ? "पीक वाढीचे टप्पे व दैनंदिन कृती वेळापत्रक"
              : "Dynamic Crop Growth Stage & Daily Task Calendar"}
          </h3>
          <p className="text-xs text-slate-500">
            {locale === "hi"
              ? "बुवाई तारीख से स्वतः गणना: वर्तमान अवस्था, खाद-पानी का समय और कीट चेतावनी"
              : locale === "mr"
              ? "लागवड दिनांकावरून आपोआप गणना: सध्याची अवस्था, पाणी, खतांची वेळ व रोग संरक्षण"
              : "Automated stage tracking, water timing, nutrition, and harvest countdown"}
          </p>
        </div>

        <button
          onClick={speakCalendar}
          className="flex items-center gap-1.5 self-start sm:self-auto bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 px-3 py-1.5 rounded-xl text-xs font-semibold transition"
        >
          <Volume2 size={15} />
          <span>{locale === "hi" ? "कैलेंडर सुनें" : locale === "mr" ? "वेळापत्रक ऐका" : "Listen Schedule"}</span>
        </button>
      </div>

      {/* Sowing Date Config & Crop Age Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-50 border border-slate-200 rounded-2xl p-4">
        {/* Sowing Date Input */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            {locale === "hi" ? "🌱 बुवाई/रोपाई का दिन" : locale === "mr" ? "🌱 पेरणी / पुनर्लागवड दिनांक" : "Sowing / Transplanting Date"}
          </label>
          <input
            type="date"
            value={sowingDate}
            onChange={(e) => handleDateChange(e.target.value)}
            className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-medium text-slate-800 focus:border-emerald-600 outline-none shadow-2xs"
          />
        </div>

        {/* Current Crop Age */}
        <div className="bg-white border border-slate-200 rounded-xl p-3 flex flex-col justify-center">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
            {locale === "hi" ? "फसल की वर्तमान आयु" : locale === "mr" ? "पिकाचे सध्याचे वय" : "Crop Age Today"}
          </span>
          <div className="text-xl font-extrabold text-emerald-800 mt-0.5">
            {daysElapsed} <span className="text-xs font-normal text-slate-600">{locale === "mr" ? "दिवस पूर्ण" : locale === "hi" ? "दिन पूर्ण" : "Days Completed"}</span>
          </div>
          <span className="text-[10px] text-slate-500">
            {progressPercent}% {locale === "mr" ? "हंगाम पूर्ण" : locale === "hi" ? "मौसम संपन्न" : "Season Elapsed"}
          </span>
        </div>

        {/* Harvest Countdown */}
        <div className="bg-white border border-slate-200 rounded-xl p-3 flex flex-col justify-center">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
            {locale === "hi" ? "अनुमानित कटाई दिन" : locale === "mr" ? "अपेक्षित काढणी तारीख" : "Expected Harvest"}
          </span>
          <div className="text-xl font-extrabold text-amber-800 mt-0.5">
            {daysToHarvest > 0 ? `${daysToHarvest} दिवस बाकी` : "काढणीसाठी तयार!"}
          </div>
          <span className="text-[10px] text-slate-500">{formattedHarvestDate}</span>
        </div>
      </div>

      {/* Progress Timeline Bar */}
      <div>
        <div className="flex justify-between text-xs font-semibold text-slate-700 mb-2">
          <span>{stageName} (Stage {currentStage.stageNumber}/{profile.stages.length})</span>
          <span className="text-emerald-700">{progressPercent}%</span>
        </div>
        <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden border border-slate-200">
          <div
            className="bg-gradient-to-r from-emerald-600 to-teal-500 h-full rounded-full transition-all duration-700"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Action Cards for Current Week */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {/* Irrigation Card */}
        <div className="bg-blue-50/70 border border-blue-200/90 rounded-2xl p-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-7 h-7 rounded-lg bg-blue-600 text-white flex items-center justify-center shadow-xs">
                <Droplets size={16} />
              </div>
              <strong className="text-xs font-bold text-blue-950">
                {locale === "hi" ? "सिंचाई प्रबंधन" : locale === "mr" ? "पाणी व्यवस्थापन" : "Irrigation Requirement"}
              </strong>
            </div>
            <p className="text-xs text-blue-900 leading-relaxed">{irrigationAdvice}</p>
          </div>
          <span className="text-[10px] font-semibold text-blue-700 mt-3 block">
            💧 {locale === "hi" ? "वाफसा स्थिति में ही पानी दें" : locale === "mr" ? "जमिनीत वाफसा पाहूनच पाणी सोडावे" : "Check root zone moisture before pumping"}
          </span>
        </div>

        {/* Fertilizer & Nutrition Card */}
        <div className="bg-emerald-50/70 border border-emerald-200/90 rounded-2xl p-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-7 h-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center shadow-xs">
                <Sprout size={16} />
              </div>
              <strong className="text-xs font-bold text-emerald-950">
                {locale === "hi" ? "पोषण व खाद कार्य" : locale === "mr" ? "खते व अन्नद्रव्ये डोस" : "Nutrient Dose Action"}
              </strong>
            </div>
            <p className="text-xs text-emerald-900 leading-relaxed">{fertilizerAdvice}</p>
          </div>
          <span className="text-[10px] font-semibold text-emerald-700 mt-3 block">
            🌾 {locale === "hi" ? "यूरिया को हमेशा विभाग कर दें" : locale === "mr" ? "खते विभागून दिल्यास खताचा अपव्यय टळतो" : "Split applications reduce fertilizer loss"}
          </span>
        </div>

        {/* Pest Risk & Crop Protection Card */}
        <div className="bg-amber-50/70 border border-amber-200/90 rounded-2xl p-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-7 h-7 rounded-lg bg-amber-600 text-white flex items-center justify-center shadow-xs">
                <ShieldAlert size={16} />
              </div>
              <strong className="text-xs font-bold text-amber-950">
                {locale === "hi" ? "कीट व रोग चेतावनी" : locale === "mr" ? "कीड व रोग संरक्षण इशारा" : "Pest & Disease Advisory"}
              </strong>
            </div>
            <p className="text-xs text-amber-900 leading-relaxed">{pestAdvice}</p>
          </div>
          <span className="text-[10px] font-semibold text-amber-700 mt-3 block">
            ⚠️ {locale === "hi" ? "लक्षण दिखते ही जैविक उपाय शुरू करें" : locale === "mr" ? "प्रादुर्भाव वाढण्यापूर्वीच प्रतिबंधक फवारणी करा" : "Preventive action prevents yield drop"}
          </span>
        </div>
      </div>
    </div>
  );
}

export default CropCalendar;
