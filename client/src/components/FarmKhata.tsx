import { useState, useEffect } from "react";
import { BookOpen, PlusCircle, Trash2, TrendingUp, TrendingDown, DollarSign, Wallet, ArrowDownRight, ArrowUpRight, Volume2 } from "lucide-react";
import type { Locale } from "@/lib/i18n";
import { useVoice } from "@/hooks/useVoice";

interface FarmKhataProps {
  locale: Locale;
  cropName?: string;
  farmSize?: string;
}

interface ExpenseItem {
  id: string;
  date: string;
  category: "seeds" | "fertilizer" | "spray" | "machinery" | "labor" | "irrigation" | "other";
  description: string;
  amount: number;
}

const defaultExpenses: ExpenseItem[] = [
  { id: "1", date: "2026-09-15", category: "seeds", description: "Agri Found Dark Red Seed (3 kg)", amount: 3600 },
  { id: "2", date: "2026-09-18", category: "machinery", description: "Rotavator & Field Bed Prep", amount: 2400 },
  { id: "3", date: "2026-09-20", category: "fertilizer", description: "DAP (2 bags) + MOP Potash (1 bag)", amount: 4350 },
  { id: "4", date: "2026-09-22", category: "labor", description: "Seedling Transplanting Labor (6 workers)", amount: 2400 },
  { id: "5", date: "2026-10-05", category: "spray", description: "Neem Oil 10,000ppm + Blue Sticky Traps", amount: 1150 },
  { id: "6", date: "2026-10-10", category: "labor", description: "First Weeding & Hoeing Labor", amount: 1800 },
];

export function FarmKhata({ locale, cropName = "Onion", farmSize = "2 Acres" }: FarmKhataProps) {
  const voice = useVoice(locale);
  const storageKey = `agrisathi-khata-${cropName.toLowerCase()}`;

  const [expenses, setExpenses] = useState<ExpenseItem[]>(() => {
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return defaultExpenses;
      }
    }
    return defaultExpenses;
  });

  // Harvest Income Estimates
  const [expectedYieldQuintals, setExpectedYieldQuintals] = useState<number>(140);
  const [expectedMandiRate, setExpectedMandiRate] = useState<number>(2400);

  // Form State
  const [showAddModal, setShowAddModal] = useState(false);
  const [newDesc, setNewDesc] = useState("");
  const [newAmount, setNewAmount] = useState("");
  const [newCategory, setNewCategory] = useState<ExpenseItem["category"]>("fertilizer");

  useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify(expenses));
  }, [expenses, storageKey]);

  const totalExpense = expenses.reduce((sum, item) => sum + item.amount, 0);
  const totalRevenue = expectedYieldQuintals * expectedMandiRate;
  const netProfit = totalRevenue - totalExpense;
  const costPerQuintal = expectedYieldQuintals > 0 ? Math.round(totalExpense / expectedYieldQuintals) : 0;

  const handleAddExpense = (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(newAmount);
    if (!newDesc.trim() || isNaN(amt) || amt <= 0) return;

    const newItem: ExpenseItem = {
      id: Date.now().toString(),
      date: new Date().toISOString().split("T")[0],
      category: newCategory,
      description: newDesc.trim(),
      amount: amt,
    };

    setExpenses([newItem, ...expenses]);
    setNewDesc("");
    setNewAmount("");
    setShowAddModal(false);
  };

  const handleDeleteExpense = (id: string) => {
    setExpenses(expenses.filter((e) => e.id !== id));
  };

  const getCategoryBadge = (cat: ExpenseItem["category"]) => {
    switch (cat) {
      case "seeds":
        return { label: locale === "mr" ? "बियाणे" : locale === "hi" ? "बीज" : "Seeds", color: "bg-green-100 text-green-800" };
      case "fertilizer":
        return { label: locale === "mr" ? "खते" : locale === "hi" ? "खाद" : "Fertilizer", color: "bg-emerald-100 text-emerald-800" };
      case "spray":
        return { label: locale === "mr" ? "फवारणी" : locale === "hi" ? "छिड़काव" : "Pest Spray", color: "bg-amber-100 text-amber-800" };
      case "machinery":
        return { label: locale === "mr" ? "ट्रॅक्टर/यंत्रे" : locale === "hi" ? "ट्रैक्टर/डीजल" : "Machinery", color: "bg-stone-100 text-stone-800" };
      case "labor":
        return { label: locale === "mr" ? "मजुरी" : locale === "hi" ? "मजदूरी" : "Labor", color: "bg-blue-100 text-blue-800" };
      case "irrigation":
        return { label: locale === "mr" ? "पाणी/वीज" : locale === "hi" ? "सिंचाई/बिजली" : "Irrigation", color: "bg-cyan-100 text-cyan-800" };
      default:
        return { label: locale === "mr" ? "इतर" : locale === "hi" ? "अन्य" : "Other", color: "bg-slate-100 text-slate-800" };
    }
  };

  const speakKhata = () => {
    const text =
      locale === "mr"
        ? `${cropName} पिकासाठी आतापर्यंत एकूण खर्च ₹${totalExpense} रुपये झाला आहे. अपेक्षित उत्पन्न ₹${totalRevenue} रुपये असून अपेक्षित निव्वळ नफा ₹${netProfit} रुपये आहे. प्रति क्विंटल उत्पादन खर्च ₹${costPerQuintal} रुपये बसतो.`
        : locale === "hi"
        ? `${cropName} फसल के लिए अब तक कुल खर्च ₹${totalExpense} हुआ है। अनुमानित आय ₹${totalRevenue} है और शुद्ध लाभ ₹${netProfit} रहने का अनुमान है। प्रति क्विंटल उत्पादन लागत ₹${costPerQuintal} है।`
        : `Total crop expenditure so far is ₹${totalExpense}. Expected revenue is ₹${totalRevenue} resulting in estimated net profit of ₹${netProfit}. Production cost is ₹${costPerQuintal} per quintal.`;

    voice.speak(text);
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-5 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md">
            Smart Crop Economics & Ledger
          </span>
          <h3 className="text-lg font-bold text-slate-800 mt-1 flex items-center gap-2">
            <BookOpen className="text-emerald-700" size={20} />
            {locale === "hi"
              ? "डिजिटल किसान बही-खाता (खर्च व शुद्ध मुनाफा)"
              : locale === "mr"
              ? "शेतकरी डिजिटल जमा-खर्च वही (खर्च व निव्वळ नफा)"
              : "Digital Farm Khata & Crop Profit Margin Ledger"}
          </h3>
          <p className="text-xs text-slate-500">
            {locale === "hi"
              ? "बीज, खाद, दवा, मजदूरी और कटाई बिक्री का सटीक हिसाब और प्रति क्विंटल उत्पादन लागत"
              : locale === "mr"
              ? "बियाणे, खते, फवारणी, मजुरी व विक्री हिशोब आणि प्रति क्विंटल प्रत्यक्ष उत्पादन खर्च"
              : "Track farm expenses, mandi sale revenue, and net profit per acre"}
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={speakKhata}
            className="flex items-center gap-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 px-3 py-1.5 rounded-xl text-xs font-semibold transition"
          >
            <Volume2 size={15} />
            <span>{locale === "hi" ? "हिसाब सुनें" : locale === "mr" ? "हिशोब ऐका" : "Listen"}</span>
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1.5 bg-emerald-700 hover:bg-emerald-800 text-white px-3.5 py-1.5 rounded-xl text-xs font-semibold shadow-sm transition"
          >
            <PlusCircle size={15} />
            <span>{locale === "hi" ? "+ नया खर्च जोड़ें" : locale === "mr" ? "+ नवीन खर्च नोंदवा" : "+ Add Expense"}</span>
          </button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Total Expense */}
        <div className="bg-rose-50/70 border border-rose-200/90 rounded-2xl p-4">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-rose-800">
              {locale === "hi" ? "अब तक कुल खर्च" : locale === "mr" ? "एकूण झालेला खर्च" : "Total Investment"}
            </span>
            <ArrowDownRight size={16} className="text-rose-600" />
          </div>
          <div className="text-2xl font-extrabold text-rose-950 mt-1">
            ₹{totalExpense.toLocaleString("en-IN")}
          </div>
          <span className="text-[11px] text-rose-700 block mt-0.5">
            {expenses.length} {locale === "mr" ? "नोंदी" : locale === "hi" ? "प्रविष्टियां" : "entries logged"}
          </span>
        </div>

        {/* Expected Yield & Revenue */}
        <div className="bg-sky-50/70 border border-sky-200/90 rounded-2xl p-4">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-sky-800">
              {locale === "hi" ? "अपेक्षित मंडी आय" : locale === "mr" ? "अपेक्षित बाजार उत्पन्न" : "Estimated Revenue"}
            </span>
            <ArrowUpRight size={16} className="text-sky-600" />
          </div>
          <div className="text-2xl font-extrabold text-sky-950 mt-1">
            ₹{totalRevenue.toLocaleString("en-IN")}
          </div>
          <span className="text-[11px] text-sky-700 block mt-0.5">
            {expectedYieldQuintals} Qtl @ ₹{expectedMandiRate}/Qtl
          </span>
        </div>

        {/* Estimated Net Profit */}
        <div className="bg-emerald-50/70 border border-emerald-200/90 rounded-2xl p-4">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800">
              {locale === "hi" ? "अनुमानित शुद्ध लाभ" : locale === "mr" ? "अपेक्षित निव्वळ नफा" : "Net Profit"}
            </span>
            <TrendingUp size={16} className="text-emerald-600" />
          </div>
          <div className="text-2xl font-extrabold text-emerald-950 mt-1">
            ₹{netProfit.toLocaleString("en-IN")}
          </div>
          <span className="text-[11px] text-emerald-700 block mt-0.5">
            {netProfit > 0 ? (locale === "mr" ? "नफा अपेक्षित" : "लाभ की स्थिति") : "घाटा/जोखिम"}
          </span>
        </div>

        {/* Cost of Cultivation per Quintal */}
        <div className="bg-amber-50/70 border border-amber-200/90 rounded-2xl p-4">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800">
              {locale === "hi" ? "उत्पादन लागत / क्विंटल" : locale === "mr" ? "उत्पादन खर्च / क्विंटल" : "Cost / Quintal"}
            </span>
            <Wallet size={16} className="text-amber-600" />
          </div>
          <div className="text-2xl font-extrabold text-amber-950 mt-1">
            ₹{costPerQuintal}
          </div>
          <span className="text-[11px] text-amber-800 block mt-0.5">
            {locale === "mr" ? "किमान नफा मिळण्यासाठी आवश्यक दर" : "Minimum break-even price"}
          </span>
        </div>
      </div>

      {/* Yield & Mandi Price Controls */}
      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
          <TrendingUp size={16} className="text-emerald-700" />
          <span>{locale === "hi" ? "उत्पादन व अपेक्षित मंडी भाव अनुमान:" : locale === "mr" ? "अपेक्षित उत्पादन व बाजारभाव अंदाज:" : "Yield & Mandi Market Simulator:"}</span>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-600">{locale === "mr" ? "उत्पादन (क्विंटल):" : "Yield (Qtl):"}</span>
            <input
              type="number"
              min="1"
              value={expectedYieldQuintals}
              onChange={(e) => setExpectedYieldQuintals(Math.max(1, parseFloat(e.target.value) || 1))}
              className="w-20 bg-white border border-slate-300 rounded-lg px-2.5 py-1 text-xs font-bold text-slate-800 outline-none"
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-600">{locale === "mr" ? "भाव (₹/क्विंटल):" : "Rate (₹/Qtl):"}</span>
            <input
              type="number"
              min="100"
              step="50"
              value={expectedMandiRate}
              onChange={(e) => setExpectedMandiRate(Math.max(100, parseFloat(e.target.value) || 100))}
              className="w-24 bg-white border border-slate-300 rounded-lg px-2.5 py-1 text-xs font-bold text-emerald-800 outline-none"
            />
          </div>
        </div>
      </div>

      {/* Expense List Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
              <th className="py-2.5 px-3">Date</th>
              <th className="py-2.5 px-3">Category</th>
              <th className="py-2.5 px-3">Description</th>
              <th className="py-2.5 px-3 text-right">Amount</th>
              <th className="py-2.5 px-2 text-center">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {expenses.map((item) => {
              const badge = getCategoryBadge(item.category);
              return (
                <tr key={item.id} className="hover:bg-slate-50/80 transition">
                  <td className="py-2.5 px-3 font-medium text-slate-600">{item.date}</td>
                  <td className="py-2.5 px-3">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${badge.color}`}>
                      {badge.label}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 font-medium text-slate-800">{item.description}</td>
                  <td className="py-2.5 px-3 text-right font-bold text-slate-900">
                    ₹{item.amount.toLocaleString("en-IN")}
                  </td>
                  <td className="py-2.5 px-2 text-center">
                    <button
                      onClick={() => handleDeleteExpense(item.id)}
                      className="text-slate-400 hover:text-rose-600 p-1 rounded transition"
                      title="Delete"
                    >
                      <Trash2 size={14} />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Add Expense Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 shadow-2xl animate-in zoom-in-95">
            <h4 className="text-sm font-bold text-slate-900 mb-3">
              {locale === "hi" ? "नया खर्च प्रविष्टि जोड़ें" : locale === "mr" ? "नवीन खर्च नोंदवा" : "Log New Farm Expense"}
            </h4>
            <form onSubmit={handleAddExpense} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {locale === "hi" ? "खर्च की श्रेणी" : locale === "mr" ? "खर्च प्रकार" : "Expense Category"}
                </label>
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value as any)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-medium text-slate-800 outline-none"
                >
                  <option value="seeds">{locale === "mr" ? "बियाणे / रोपे" : "Seeds / Nursery"}</option>
                  <option value="fertilizer">{locale === "mr" ? "खते व शेणखत" : "Fertilizer / Manure"}</option>
                  <option value="spray">{locale === "mr" ? "कीटकनाशके व फवारणी" : "Pest Spray / Chemicals"}</option>
                  <option value="machinery">{locale === "mr" ? "ट्रॅक्टर / नांगरणी / डिझेल" : "Machinery / Diesel"}</option>
                  <option value="labor">{locale === "mr" ? "मजुरी" : "Labor Wages"}</option>
                  <option value="irrigation">{locale === "mr" ? "पाणी / वीज" : "Irrigation / Electricity"}</option>
                  <option value="other">{locale === "mr" ? "इतर" : "Other"}</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {locale === "hi" ? "विवरण" : locale === "mr" ? "तपशील" : "Description"}
                </label>
                <input
                  type="text"
                  required
                  placeholder="उदा. 2 पोती DAP खरेदी / खुरपणी मजुरी"
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-medium text-slate-800 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {locale === "hi" ? "राशि (₹)" : locale === "mr" ? "रक्कम (₹)" : "Amount (₹)"}
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  step="1"
                  placeholder="2400"
                  value={newAmount}
                  onChange={(e) => setNewAmount(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-medium text-slate-800 outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-3 py-2 rounded-xl text-xs text-slate-600 hover:bg-slate-100 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-xs px-4 py-2 rounded-xl shadow-sm transition"
                >
                  Save Entry
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default FarmKhata;
