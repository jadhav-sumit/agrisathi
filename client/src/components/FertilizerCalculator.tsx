import { useState } from "react";
import { Calculator, Sprout, CheckCircle2, AlertCircle, Volume2, ShieldCheck, DollarSign, Info } from "lucide-react";
import type { Locale } from "@/lib/i18n";
import { useVoice } from "@/hooks/useVoice";

interface FertilizerCalculatorProps {
  locale: Locale;
  defaultCrop?: string;
  defaultAcres?: string;
}

interface CropRequirement {
  id: string;
  nameEn: string;
  nameHi: string;
  nameMr: string;
  // Recommended kg per acre
  n: number;
  p: number;
  k: number;
  compostTonnes: number;
  zincKg: number;
}

const cropPresets: CropRequirement[] = [
  { id: "Onion", nameEn: "Onion (कांदा)", nameHi: "प्याज़", nameMr: "कांदा", n: 40, p: 20, k: 20, compostTonnes: 4, zincKg: 8 },
  { id: "Cotton", nameEn: "Cotton (कापूस)", nameHi: "कपास", nameMr: "कापूस", n: 48, p: 24, k: 24, compostTonnes: 5, zincKg: 10 },
  { id: "Soybean", nameEn: "Soybean (सोयाबीन)", nameHi: "सोयाबीन", nameMr: "सोयाबीन", n: 12, p: 24, k: 16, compostTonnes: 3, zincKg: 5 },
  { id: "Wheat", nameEn: "Wheat (गहू)", nameHi: "गेहूं", nameMr: "गहू", n: 48, p: 24, k: 16, compostTonnes: 3, zincKg: 8 },
  { id: "Sugarcane", nameEn: "Sugarcane (ऊस)", nameHi: "गन्ना", nameMr: "ऊस", n: 100, p: 46, k: 46, compostTonnes: 8, zincKg: 15 },
  { id: "Tomato", nameEn: "Tomato (टोमॅटो)", nameHi: "टमाटर", nameMr: "टोमॅटो", n: 60, p: 40, k: 40, compostTonnes: 5, zincKg: 10 },
  { id: "Maize", nameEn: "Maize (मका)", nameHi: "मक्का", nameMr: "मका", n: 48, p: 24, k: 16, compostTonnes: 4, zincKg: 8 },
  { id: "Gram", nameEn: "Gram / Chana (हरभरा)", nameHi: "चना", nameMr: "हरभरा", n: 10, p: 20, k: 0, compostTonnes: 2, zincKg: 5 },
];

export function FertilizerCalculator({ locale, defaultCrop = "Onion", defaultAcres = "2 Acres" }: FertilizerCalculatorProps) {
  const voice = useVoice(locale);

  // Match default crop preset
  const initialCrop = cropPresets.find(
    (c) => c.id.toLowerCase() === defaultCrop.toLowerCase() || defaultCrop.toLowerCase().includes(c.id.toLowerCase())
  ) || cropPresets[0];

  const parsedAcres = parseFloat(defaultAcres.replace(/[^0-9.]/g, "")) || 2;

  const [selectedCrop, setSelectedCrop] = useState<string>(initialCrop.id);
  const [areaValue, setAreaValue] = useState<number>(parsedAcres);
  const [areaUnit, setAreaUnit] = useState<"acre" | "guntha" | "bigha" | "hectare">("acre");
  const [soilFertility, setSoilFertility] = useState<"low" | "medium" | "high">("medium");
  const [fertilizerOption, setFertilizerOption] = useState<"dap" | "ssp">("dap");

  // Normalized area in acres
  const areaInAcres =
    areaUnit === "acre"
      ? areaValue
      : areaUnit === "guntha"
      ? areaValue / 40
      : areaUnit === "bigha"
      ? areaValue * 0.625
      : areaValue * 2.47;

  const crop = cropPresets.find((c) => c.id === selectedCrop) || cropPresets[0];

  // Adjust for soil fertility
  const fertilityMultiplier = soilFertility === "low" ? 1.15 : soilFertility === "high" ? 0.85 : 1.0;

  const netN = Math.round(crop.n * areaInAcres * fertilityMultiplier);
  const netP = Math.round(crop.p * areaInAcres * fertilityMultiplier);
  const netK = Math.round(crop.k * areaInAcres * fertilityMultiplier);

  // Calculation of commercial bags
  // Option 1: DAP (18:46:0) + Urea (46:0:0) + MOP (0:0:60)
  // DAP gives 46% P. 1 bag DAP (50kg) = 23kg P and 9kg N
  const dapBags = Math.max(1, Math.round((netP / 23) * 10) / 10);
  const nFromDap = dapBags * 9;
  const remainingN_DapOption = Math.max(0, netN - nFromDap);
  // Urea 45kg bag = 20.7 kg N (46%)
  const ureaBagsWithDap = Math.max(1, Math.round((remainingN_DapOption / 20.7) * 10) / 10);
  // MOP 50kg bag = 30 kg K (60%)
  const mopBags = netK > 0 ? Math.max(0.5, Math.round((netK / 30) * 10) / 10) : 0;

  // Option 2: SSP (16% P) + Urea + MOP
  // 1 bag SSP (50kg) = 8kg P
  const sspBags = Math.max(1, Math.round((netP / 8) * 10) / 10);
  const ureaBagsWithSsp = Math.max(1, Math.round((netN / 20.7) * 10) / 10);

  // Subsidized market rates (approximate ₹ per bag in India)
  const UREA_RATE = 266; // 45kg
  const DAP_RATE = 1350; // 50kg
  const MOP_RATE = 1650; // 50kg
  const SSP_RATE = 425;  // 50kg

  const totalCost =
    fertilizerOption === "dap"
      ? Math.round(dapBags * DAP_RATE + ureaBagsWithDap * UREA_RATE + mopBags * MOP_RATE)
      : Math.round(sspBags * SSP_RATE + ureaBagsWithSsp * UREA_RATE + mopBags * MOP_RATE);

  const compostRequired = Math.round(crop.compostTonnes * areaInAcres * 10) / 10;
  const zincRequired = Math.round(crop.zincKg * areaInAcres);

  const speakSummary = () => {
    const text =
      locale === "mr"
        ? `${crop.nameMr} पिकासाठी ${areaValue} ${areaUnit} क्षेत्राकरिता: ${fertilizerOption === "dap" ? `${dapBags} पोती DAP, ${ureaBagsWithDap} पोती युरिया` : `${sspBags} पोती SSP, ${ureaBagsWithSsp} पोती युरिया`} आणि ${mopBags} पोती पोटॅश लागतील. अंदाजे खर्च ₹${totalCost} रुपये आहे.`
        : locale === "hi"
        ? `${crop.nameHi} फसल के लिए ${areaValue} ${areaUnit} क्षेत्र हेतु: ${fertilizerOption === "dap" ? `${dapBags} बोरी DAP, ${ureaBagsWithDap} बोरी यूरिया` : `${sspBags} बोरी SSP, ${ureaBagsWithSsp} बोरी यूरिया`} और ${mopBags} बोरी पोटाश की आवश्यकता होगी। कुल अनुमानित लागत ₹${totalCost} है।`
        : `For ${crop.nameEn} over ${areaValue} ${areaUnit}: Need ${fertilizerOption === "dap" ? `${dapBags} bags DAP, ${ureaBagsWithDap} bags Urea` : `${sspBags} bags SSP, ${ureaBagsWithSsp} bags Urea`}, and ${mopBags} bags MOP Potash. Total estimated cost is ₹${totalCost}.`;

    voice.speak(text);
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-5 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md">
            ICAR & KVK Nutrient Standards
          </span>
          <h3 className="text-lg font-bold text-slate-800 mt-1 flex items-center gap-2">
            <Calculator className="text-emerald-700" size={20} />
            {locale === "hi"
              ? "वैज्ञानिक खाद व NPK खुराक गणक"
              : locale === "mr"
              ? "शास्त्रीय खत व NPK डोस गणक (पोत्यांची संख्या)"
              : "Scientific Fertilizer & NPK Dose Calculator"}
          </h3>
          <p className="text-xs text-slate-500">
            {locale === "hi"
              ? "खेत के वास्तविक आकार के अनुसार सटीक बोरी गणना और लागत अनुमान"
              : locale === "mr"
              ? "जमीन क्षेत्रानुसार युरिया, DAP व पोटॅशच्या अचूक पोत्यांचे प्रमाण व अंदाजे खर्च"
              : "Exact 50kg/45kg bag estimation based on land area and soil fertility"}
          </p>
        </div>

        <button
          onClick={speakSummary}
          className="flex items-center gap-1.5 self-start sm:self-auto bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 px-3 py-1.5 rounded-xl text-xs font-semibold transition"
        >
          <Volume2 size={15} />
          <span>{locale === "hi" ? "आवाज में सुनें" : locale === "mr" ? "सल्ला ऐका" : "Listen Advice"}</span>
        </button>
      </div>

      {/* Input Controls */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Crop Select */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">
            {locale === "hi" ? "फसल चुनें" : locale === "mr" ? "पीक निवडा" : "Select Crop"}
          </label>
          <select
            value={selectedCrop}
            onChange={(e) => setSelectedCrop(e.target.value)}
            className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-medium text-slate-800 focus:border-emerald-600 outline-none"
          >
            {cropPresets.map((c) => (
              <option key={c.id} value={c.id}>
                {locale === "hi" ? c.nameHi : locale === "mr" ? c.nameMr : c.nameEn}
              </option>
            ))}
          </select>
        </div>

        {/* Land Size */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">
            {locale === "hi" ? "जमीन का क्षेत्रफल" : locale === "mr" ? "जमिनीचे क्षेत्र" : "Land Area"}
          </label>
          <div className="flex gap-2">
            <input
              type="number"
              min="0.25"
              step="0.25"
              value={areaValue}
              onChange={(e) => setAreaValue(Math.max(0.1, parseFloat(e.target.value) || 1))}
              className="w-24 bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-medium text-slate-800 focus:border-emerald-600 outline-none"
            />
            <select
              value={areaUnit}
              onChange={(e) => setAreaUnit(e.target.value as any)}
              className="flex-1 bg-slate-50 border border-slate-300 rounded-xl px-2 py-2 text-xs font-medium text-slate-800 focus:border-emerald-600 outline-none"
            >
              <option value="acre">{locale === "mr" ? "एकर" : locale === "hi" ? "एकड़" : "Acres"}</option>
              <option value="guntha">{locale === "mr" ? "गुंठे (Guntha)" : "Guntha"}</option>
              <option value="bigha">{locale === "hi" ? "बीघा (Bigha)" : "Bigha"}</option>
              <option value="hectare">{locale === "mr" ? "हेक्टर (Ha)" : "Hectares"}</option>
            </select>
          </div>
        </div>

        {/* Soil Fertility */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">
            {locale === "hi" ? "मिट्टी की उर्वरता" : locale === "mr" ? "मातीची सुपीकता दर्जा" : "Soil Fertility Level"}
          </label>
          <select
            value={soilFertility}
            onChange={(e) => setSoilFertility(e.target.value as any)}
            className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-medium text-slate-800 focus:border-emerald-600 outline-none"
          >
            <option value="low">{locale === "hi" ? "कमज़ोर / हल्की मिट्टी (+15% खाद)" : locale === "mr" ? "कमी सुपीक / हलकी जमीन (+15% खत)" : "Low (Add 15% NPK)"}</option>
            <option value="medium">{locale === "hi" ? "मध्यम / सामान्य मिट्टी (मानक)" : locale === "mr" ? "मध्यम सुपीक जमीन (प्रमाणित)" : "Medium (Standard)"}</option>
            <option value="high">{locale === "hi" ? "भारी / काली उपजाऊ मिट्टी (-15%)" : locale === "mr" ? "काळी भारी सुपीक जमीन (-15%)" : "High (Reduce 15% NPK)"}</option>
          </select>
        </div>

        {/* Fertilizer Combination */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">
            {locale === "hi" ? "खाद का संयोजन" : locale === "mr" ? "खताचा पर्याय निवडा" : "Fertilizer Base Mix"}
          </label>
          <select
            value={fertilizerOption}
            onChange={(e) => setFertilizerOption(e.target.value as any)}
            className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-medium text-slate-800 focus:border-emerald-600 outline-none"
          >
            <option value="dap">DAP + युरिया + पोटॅश (सर्वात लोकप्रिय)</option>
            <option value="ssp">SSP + युरिया + पोटॅश (सल्फरयुक्त)</option>
          </select>
        </div>
      </div>

      {/* Bag Requirement Result Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* DAP or SSP Card */}
        <div className="bg-emerald-50/60 border border-emerald-200/90 rounded-2xl p-4 text-center">
          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 block">
            {fertilizerOption === "dap" ? "DAP (18:46:0)" : "Single Super Phosphate (SSP)"}
          </span>
          <div className="text-2xl sm:text-3xl font-extrabold text-emerald-900 mt-1">
            {fertilizerOption === "dap" ? dapBags : sspBags}{" "}
            <span className="text-xs font-normal text-emerald-700">
              {locale === "mr" ? "पोती (50kg)" : locale === "hi" ? "बोरी (50kg)" : "Bags (50kg)"}
            </span>
          </div>
          <span className="text-[11px] text-emerald-800 font-medium block mt-1">
            ₹{fertilizerOption === "dap" ? Math.round(dapBags * DAP_RATE) : Math.round(sspBags * SSP_RATE)}
          </span>
        </div>

        {/* Urea Card */}
        <div className="bg-sky-50/60 border border-sky-200/90 rounded-2xl p-4 text-center">
          <span className="text-[10px] font-bold uppercase tracking-wider text-sky-800 block">
            Urea / यूरिया (46% N)
          </span>
          <div className="text-2xl sm:text-3xl font-extrabold text-sky-900 mt-1">
            {fertilizerOption === "dap" ? ureaBagsWithDap : ureaBagsWithSsp}{" "}
            <span className="text-xs font-normal text-sky-700">
              {locale === "mr" ? "पोती (45kg)" : locale === "hi" ? "बोरी (45kg)" : "Bags (45kg)"}
            </span>
          </div>
          <span className="text-[11px] text-sky-800 font-medium block mt-1">
            ₹{Math.round((fertilizerOption === "dap" ? ureaBagsWithDap : ureaBagsWithSsp) * UREA_RATE)}
          </span>
        </div>

        {/* MOP Potash Card */}
        <div className="bg-amber-50/60 border border-amber-200/90 rounded-2xl p-4 text-center">
          <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800 block">
            MOP Potash / पोटॅश (60% K)
          </span>
          <div className="text-2xl sm:text-3xl font-extrabold text-amber-900 mt-1">
            {mopBags}{" "}
            <span className="text-xs font-normal text-amber-700">
              {locale === "mr" ? "पोती (50kg)" : locale === "hi" ? "बोरी (50kg)" : "Bags (50kg)"}
            </span>
          </div>
          <span className="text-[11px] text-amber-800 font-medium block mt-1">
            ₹{Math.round(mopBags * MOP_RATE)}
          </span>
        </div>

        {/* Total Cost Estimate Card */}
        <div className="bg-gradient-to-br from-emerald-800 to-teal-900 text-white rounded-2xl p-4 text-center shadow-sm">
          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-200 block">
            {locale === "hi" ? "कुल अनुमानित खाद खर्च" : locale === "mr" ? "एकूण खत खर्च" : "Estimated Cost"}
          </span>
          <div className="text-2xl sm:text-3xl font-extrabold text-white mt-1">
            ₹{totalCost.toLocaleString("en-IN")}
          </div>
          <span className="text-[10px] text-emerald-100 block mt-1">
            {locale === "hi" ? "सरकारी सब्सिडी दरों पर" : locale === "mr" ? "शासकीय अनुदानित दरावर" : "Govt Subsidized Rate"}
          </span>
        </div>
      </div>

      {/* Split Application Schedule */}
      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4">
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-3 flex items-center gap-2">
          <Sprout size={16} className="text-emerald-700" />
          {locale === "hi"
            ? "वैज्ञानिक विभाजन खुराक समय सारणी (Split Application)"
            : locale === "mr"
            ? "खताचा विभागून वापर (Split Dose Timetable)"
            : "Split Application Schedule"}
        </h4>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Stage 1: Basal */}
          <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-xs">
            <div className="flex items-center justify-between mb-1.5">
              <span className="font-bold text-xs text-emerald-900">1. {locale === "hi" ? "बुवाई/रोपाई के समय (Basal)" : locale === "mr" ? "पेरणी/लागवड करताना (Basal)" : "Basal (At Sowing)"}</span>
              <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-semibold">Day 0</span>
            </div>
            <p className="text-xs text-slate-600">
              {fertilizerOption === "dap"
                ? `100% DAP (${dapBags} पोती) + 50% पोटॅश (${Math.round((mopBags / 2) * 10) / 10} पोती).`
                : `100% SSP (${sspBags} पोती) + 25% युरिया.`}
            </p>
            <span className="text-[11px] text-slate-500 block mt-1">
              🌱 {locale === "hi" ? "साथ में 4-5 टन सड़ी गोबर खाद डालें" : locale === "mr" ? `${compostRequired} टन चांगले कुजलेले शेणखत मिसळा` : `Mix ${compostRequired} tonnes compost`}
            </span>
          </div>

          {/* Stage 2: Vegetative */}
          <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-xs">
            <div className="flex items-center justify-between mb-1.5">
              <span className="font-bold text-xs text-sky-900">2. {locale === "hi" ? "शाखीय वृद्धि अवस्था" : locale === "mr" ? "शाकीय वाढीची अवस्था" : "Vegetative Growth"}</span>
              <span className="text-[10px] bg-sky-100 text-sky-800 px-2 py-0.5 rounded-full font-semibold">Day 25–30</span>
            </div>
            <p className="text-xs text-slate-600">
              {locale === "mr"
                ? `युरियाचा पहिला हप्ता: ${Math.round((ureaBagsWithDap / 2) * 10) / 10} पोती युरिया ओल असताना जमिनीत द्या.`
                : `First Urea split: Apply ${Math.round((ureaBagsWithDap / 2) * 10) / 10} bags Urea during irrigation.`}
            </p>
            <span className="text-[11px] text-slate-500 block mt-1">
              💧 {locale === "hi" ? "सिंचाई से ठीक पहले या बाद में दें" : locale === "mr" ? "ओलावा असतानाच खत द्यावे" : "Apply when soil has moisture"}
            </span>
          </div>

          {/* Stage 3: Flowering / Bulb */}
          <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-xs">
            <div className="flex items-center justify-between mb-1.5">
              <span className="font-bold text-xs text-amber-900">3. {locale === "hi" ? "गांठ/फल/फूल निर्माण" : locale === "mr" ? "कंद / दाणे / बोंड भरणे" : "Bulb / Grain Filling"}</span>
              <span className="text-[10px] bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full font-semibold">Day 50–60</span>
            </div>
            <p className="text-xs text-slate-600">
              {locale === "mr"
                ? `उर्वरित युरिया (${Math.round((ureaBagsWithDap / 2) * 10) / 10} पोती) + उर्वरित पोटॅश (${Math.round((mopBags / 2) * 10) / 10} पोती).`
                : `Remaining Urea + Potash (${Math.round((mopBags / 2) * 10) / 10} bags) for bulb size and weight.`}
            </p>
            <span className="text-[11px] text-slate-500 block mt-1">
              ✨ {locale === "hi" ? "कंद का आकार और वजन तेजी से बढ़ता है" : locale === "mr" ? "कंदाचा आकार, चमक आणि वजन सुधारते" : "Improves bulb firmness and luster"}
            </span>
          </div>
        </div>

        {/* Micronutrient Advisory note */}
        <div className="mt-3 bg-amber-50/80 border border-amber-200 rounded-xl p-3 flex items-start gap-2 text-xs text-amber-900">
          <Info size={16} className="text-amber-700 shrink-0 mt-0.5" />
          <div>
            <strong>{locale === "hi" ? "सूक्ष्म पोषक तत्व सलाह:" : locale === "mr" ? "सूक्ष्म अन्नद्रव्ये (Micronutrients) सल्ला:" : "Micronutrient Recommendation:"}</strong>{" "}
            {locale === "mr"
              ? `काळी भारी जमिनीत झिंकची कमतरता असते. पेरणीवेळी एकरी ${zincRequired} किलो झिंक सल्फेट (Zinc Sulphate 21%) शेणखतात मिसळून द्या. फॉस्फरस (DAP) आणि झिंक एकत्र मिसळू नका.`
              : locale === "hi"
              ? `बुवाई के समय प्रति एकड़ ${zincRequired} किलो जिंक सल्फेट डालें। ध्यान दें: DAP और जिंक सल्फेट को सीधे एक साथ न मिलाएं।`
              : `Apply ${zincRequired} kg Zinc Sulphate (21%) per acre mixed in farmyard manure. Never mix Zinc Sulphate directly with DAP in the same bucket.`}
          </div>
        </div>
      </div>
    </div>
  );
}

export default FertilizerCalculator;
