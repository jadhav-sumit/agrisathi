import { useState } from "react";
import { Landmark, ShieldCheck, Sun, Droplets, PhoneCall, ExternalLink, CheckCircle2, ChevronDown, Volume2, FileText } from "lucide-react";
import type { Locale } from "@/lib/i18n";
import { useVoice } from "@/hooks/useVoice";

interface GovtSchemesProps {
  locale: Locale;
}

interface Scheme {
  id: string;
  nameEn: string;
  nameHi: string;
  nameMr: string;
  category: "income" | "insurance" | "irrigation" | "solar";
  benefitEn: string;
  benefitHi: string;
  benefitMr: string;
  eligibilityEn: string;
  eligibilityHi: string;
  eligibilityMr: string;
  helpline: string;
  portalUrl: string;
  docs: string[];
}

const schemes: Scheme[] = [
  {
    id: "pm-kisan",
    nameEn: "PM-KISAN Samman Nidhi",
    nameHi: "प्रधानमंत्री किसान सम्मान निधि",
    nameMr: "पंतप्रधान किसान सन्मान निधी (PM-KISAN)",
    category: "income",
    benefitEn: "₹6,000 per year directly into bank accounts in 3 equal installments of ₹2,000.",
    benefitHi: "प्रति वर्ष ₹6,000 सीधे बैंक खाते में (₹2,000 की 3 किस्तों में)।",
    benefitMr: "प्रति वर्ष ₹6,000 थेट बँक खात्यात (₹2,000 च्या 3 समान हप्त्यांमध्ये).",
    eligibilityEn: "All small and marginal landholding farmer families with cultivable land in their name.",
    eligibilityHi: "सभी छोटे और सीमांत किसान परिवार जिनके नाम पर कृषि भूमि दर्ज है।",
    eligibilityMr: "स्वतःच्या नावावर शेतजमीन असलेले सर्व अल्प व अत्यल्प भूधारक शेतकरी कुटुंब.",
    helpline: "155261",
    portalUrl: "https://pmkisan.gov.in/",
    docs: ["Aadhaar Card linked to Mobile", "Land 7/12 Extract (७/१२ उतारा) & 8A", "Active Bank Account linked to Aadhaar (e-KYC)"],
  },
  {
    id: "pmfby",
    nameEn: "Pradhan Mantri Fasal Bima Yojana (PMFBY)",
    nameHi: "प्रधानमंत्री फसल बीमा योजना (फसल बीमा)",
    nameMr: "प्रधानमंत्री पीक विमा योजना (१ रुपयात पीक विमा)",
    category: "insurance",
    benefitEn: "Comprehensive financial safety net against natural disasters, drought, unseasonal rain & pest attacks.",
    benefitHi: "प्राकृतिक आपदा, बेमौसम बारिश व सूखे से हुए नुकसान की भरपाई। केवल 2% खरीफ व 1.5% रबी प्रीमियम।",
    benefitMr: "अतिवृष्टी, दुष्काळ किंवा गारपिटीने नुकसान झाल्यास आर्थिक भरपाई. महाराष्ट्रात केवळ ₹1 टोकन दरात विमा.",
    eligibilityEn: "Farmers growing notified crops in notified areas. Crucial: Intimate crop loss within 72 hours via Crop Insurance App.",
    eligibilityHi: "अधिसूचित फसलों के किसान। नुकसान के 72 घंटे के भीतर सूचना देना अनिवार्य है।",
    eligibilityMr: "सर्व अधिसूचित पिके घेणारे शेतकरी. महत्त्वाचे: नुकसान झाल्यास 72 तासांत क्रॉप इन्शुरन्स ॲपवर तक्रार करणे बंधनकारक.",
    helpline: "18001802117",
    portalUrl: "https://pmfby.gov.in/",
    docs: ["Sowing Certificate (पेरणी स्वयंघोषणापत्र)", "7/12 & 8A Extract", "Geo-tagged photo of damaged field via App"],
  },
  {
    id: "kusum",
    nameEn: "PM KUSUM Solar Agriculture Pump",
    nameHi: "पीएम कुसुम सौर पंप योजना",
    nameMr: "मागेल त्याला सौर कृषी पंप योजना (PM-KUSUM)",
    category: "solar",
    benefitEn: "Up to 90% government subsidy for installation of 3 HP, 5 HP, or 7.5 HP off-grid solar water pumps.",
    benefitHi: "3 HP, 5 HP और 7.5 HP सोलर सिंचाई पंप पर 90% तक सरकारी अनुदान। दिन में निर्बाध मुफ्त बिजली।",
    benefitMr: "3 HP, 5 HP व 7.5 HP सौर कृषी पंपावर 90% पर्यंत शासकीय अनुदान. दिवसा हक्काचे सिंचन पाणी.",
    eligibilityEn: "Farmers having assured water source (well, borewell, farm pond) without existing grid electricity connection.",
    eligibilityHi: "जिनके पास कुआं, बोरवेल या तालाब जैसा जल स्रोत है और बिजली कनेक्शन नहीं है।",
    eligibilityMr: "विहीर, बोअरवेल किंवा शेततळे उपलब्ध असणारे शेतकरी ज्यांच्याकडे पारंपरिक वीज जोडणी नाही.",
    helpline: "18001028766",
    portalUrl: "https://pmkusum.mnre.gov.in/",
    docs: ["7/12 Extract with Water Source Entry", "Aadhaar Card", "Caste Certificate (if applying for special category)"],
  },
  {
    id: "micro-irrigation",
    nameEn: "MahaDBT Drip & Sprinkler Subsidy",
    nameHi: "सूक्ष्म सिंचाई अनुदान (ड्रिप व स्प्रिंकलर)",
    nameMr: "ठिबक व तुषार सिंचन अनुदान योजना (महाडीबीटी)",
    category: "irrigation",
    benefitEn: "70% to 80% subsidy on certified drip irrigation and micro-sprinkler sets, saving 50% water.",
    benefitHi: "ड्रिप और स्प्रिंकलर सिस्टम पर 70% से 80% तक सब्सिडी। 50% पानी की बचत और 30% अधिक उपज।",
    benefitMr: "अल्प व अत्यल्प भूधारकांना ठिबक सिंचनावर 80% व इतर शेतकऱ्यांना 70% थेट बँक अनुदान. 50% पाण्याची बचत.",
    eligibilityEn: "Farmers with cultivable land and a permanent water source. Application via MahaDBT farmer portal.",
    eligibilityHi: "कृषि भूमि और जल स्रोत वाले किसान। महाडीबीटी पोर्टल पर ऑनलाइन पंजीकरण अनिवार्य।",
    eligibilityMr: "पाणी स्त्रोत असणारे शेतकरी. महाडीबीटी शेतकरी पोर्टलवर पूर्वसंमती घेणे आवश्यक.",
    helpline: "18001208040",
    portalUrl: "https://mahadbt.maharashtra.gov.in/",
    docs: ["7/12 & 8A Extract", "GST Bill of Certified Drip Dealer", "Water Source & Pipeline Certificate"],
  },
];

export function GovtSchemes({ locale }: GovtSchemesProps) {
  const voice = useVoice(locale);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [expandedScheme, setExpandedScheme] = useState<string | null>("pm-kisan");

  const filtered = selectedCategory === "all" ? schemes : schemes.filter((s) => s.category === selectedCategory);

  const speakScheme = (s: Scheme) => {
    const name = locale === "hi" ? s.nameHi : locale === "mr" ? s.nameMr : s.nameEn;
    const benefit = locale === "hi" ? s.benefitHi : locale === "mr" ? s.benefitMr : s.benefitEn;
    const text = `${name}. फायदा: ${benefit}. अधिक माहितीसाठी हेल्पलाइन ${s.helpline} वर संपर्क करा.`;
    voice.speak(text);
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-5 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md">
            Direct Benefit Transfer (DBT) Hub
          </span>
          <h3 className="text-lg font-bold text-slate-800 mt-1 flex items-center gap-2">
            <Landmark className="text-emerald-700" size={20} />
            {locale === "hi"
              ? "सरकारी कृषि योजनाएं व सब्सिडी मार्गदर्शक"
              : locale === "mr"
              ? "शासकीय कृषी योजना, सबसिडी व कागदपत्रे मार्गदर्शक"
              : "Government Schemes, Subsidies & Document Checklists"}
          </h3>
          <p className="text-xs text-slate-500">
            {locale === "hi"
              ? "पीएम-किसान, फसल बीमा, सोलर पंप और ड्रिप सब्सिडी की पात्रता और आवश्यक दस्तावेज"
              : locale === "mr"
              ? "पीएम-किसान, १ रुपयात पीक विमा, सौर कृषी पंप व ठिबक सिंचन अनुदान पात्रता"
              : "PM-KISAN, crop insurance, solar pumps, and drip irrigation eligibility guide"}
          </p>
        </div>
      </div>

      {/* Category Filter Pills */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
        {[
          { id: "all", label: locale === "mr" ? "सर्व योजना" : locale === "hi" ? "सभी योजनाएं" : "All Schemes" },
          { id: "income", label: locale === "mr" ? "आर्थिक सहाय्य (PM-Kisan)" : "Income Support" },
          { id: "insurance", label: locale === "mr" ? "पीक विमा (PMFBY)" : "Crop Insurance" },
          { id: "solar", label: locale === "mr" ? "सौर कृषी पंप (KUSUM)" : "Solar Pumps" },
          { id: "irrigation", label: locale === "mr" ? "ठिबक सिंचन अनुदान" : "Micro-Irrigation" },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setSelectedCategory(tab.id)}
            className={`text-xs px-3 py-1.5 rounded-xl font-medium border transition ${
              selectedCategory === tab.id
                ? "bg-emerald-700 text-white border-emerald-700 shadow-xs"
                : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Scheme Cards */}
      <div className="space-y-3">
        {filtered.map((s) => {
          const isExpanded = expandedScheme === s.id;
          const name = locale === "hi" ? s.nameHi : locale === "mr" ? s.nameMr : s.nameEn;
          const benefit = locale === "hi" ? s.benefitHi : locale === "mr" ? s.benefitMr : s.benefitEn;
          const eligibility = locale === "hi" ? s.eligibilityHi : locale === "mr" ? s.eligibilityMr : s.eligibilityEn;

          return (
            <div
              key={s.id}
              className="border border-slate-200 hover:border-emerald-300 rounded-2xl overflow-hidden transition bg-slate-50/40"
            >
              <div
                onClick={() => setExpandedScheme(isExpanded ? null : s.id)}
                className="p-4 cursor-pointer flex items-center justify-between gap-3 bg-white hover:bg-emerald-50/30 transition"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-sm shrink-0">
                    <Landmark size={20} />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">{name}</h4>
                    <p className="text-xs text-slate-600 line-clamp-1 mt-0.5">{benefit}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      speakScheme(s);
                    }}
                    className="p-1.5 text-slate-400 hover:text-emerald-700 rounded-lg"
                    title="Listen"
                  >
                    <Volume2 size={16} />
                  </button>
                  <ChevronDown
                    size={18}
                    className={`text-slate-400 transition-transform duration-200 ${isExpanded ? "rotate-180" : ""}`}
                  />
                </div>
              </div>

              {/* Collapsible Details */}
              {isExpanded && (
                <div className="p-4 pt-2 border-t border-slate-100 space-y-3 bg-slate-50/70 text-xs">
                  <div>
                    <strong className="text-slate-800 block mb-1">
                      🎯 {locale === "hi" ? "मुख्य लाभ व अनुदान:" : locale === "mr" ? "योजनेचे मुख्य लाभ व अनुदान:" : "Key Benefits:"}
                    </strong>
                    <p className="text-slate-700">{benefit}</p>
                  </div>

                  <div>
                    <strong className="text-slate-800 block mb-1">
                      📋 {locale === "hi" ? "पात्रता व मुख्य शर्त:" : locale === "mr" ? "पात्रता व महत्त्वाच्या अटी:" : "Eligibility:"}
                    </strong>
                    <p className="text-slate-700">{eligibility}</p>
                  </div>

                  <div>
                    <strong className="text-slate-800 block mb-1.5">
                      📑 {locale === "hi" ? "आवश्यक दस्तावेज चेकलिस्ट:" : locale === "mr" ? "आवश्यक कागदपत्रे चेकलिस्ट:" : "Required Documents:"}
                    </strong>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                      {s.docs.map((doc, idx) => (
                        <div key={idx} className="flex items-center gap-2 text-slate-700 bg-white p-2 rounded-lg border border-slate-200">
                          <CheckCircle2 size={14} className="text-emerald-600 shrink-0" />
                          <span>{doc}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Actions & Helpline Bar */}
                  <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-200">
                    <a
                      href={`tel:${s.helpline}`}
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-800 bg-emerald-100/80 hover:bg-emerald-200 px-3 py-1.5 rounded-xl transition"
                    >
                      <PhoneCall size={13} />
                      <span>
                        {locale === "mr" ? "टोल-फ्री हेल्पलाइन:" : "Toll-Free Helpline:"} {s.helpline}
                      </span>
                    </a>

                    <a
                      href={s.portalUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-700 hover:text-slate-900 bg-white border border-slate-300 hover:border-slate-400 px-3 py-1.5 rounded-xl transition shadow-2xs"
                    >
                      <span>{locale === "mr" ? "अधिकृत सरकारी पोर्टल" : "Official Govt Portal"}</span>
                      <ExternalLink size={13} />
                    </a>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default GovtSchemes;
