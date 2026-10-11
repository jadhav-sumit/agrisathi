import { useEffect, useState } from "react";
import {
  ShieldAlert,
  Users,
  Activity,
  Server,
  CloudSun,
  Bot,
  MapPin,
  CheckCircle2,
  XCircle,
  RefreshCw,
  LogOut,
  ChevronLeft,
  Search,
  UserCheck,
  ShieldCheck,
  Zap,
} from "lucide-react";
import type { Locale } from "@/lib/i18n";
import type { FarmerProfile } from "@/lib/auth";
import { authFetch } from "@/lib/auth";

interface AdminProps {
  locale: Locale;
  profile: FarmerProfile;
  onLogout: () => void;
  onBackToFarmer: () => void;
}

export default function Admin({ locale, profile, onLogout, onBackToFarmer }: AdminProps) {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [roleUpdating, setRoleUpdating] = useState<number | null>(null);

  const fetchAdminData = async () => {
    setLoading(true);
    try {
      const [statsRes, usersRes] = await Promise.all([
        authFetch("/api/admin/overview"),
        authFetch("/api/admin/users"),
      ]);

      if (statsRes.ok) {
        setStats(await statsRes.json());
      }
      if (usersRes.ok) {
        const uData = await usersRes.json();
        setUsers(uData.users || []);
      }
    } catch (err) {
      console.error("Admin fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, []);

  const handleRoleToggle = async (userId: number, currentRole: string) => {
    const newRole = currentRole === "admin" ? "farmer" : "admin";
    setRoleUpdating(userId);
    try {
      const res = await authFetch(`/api/admin/users/${userId}/role`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: newRole }),
      });
      if (res.ok) {
        setUsers((prev) =>
          prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u))
        );
      }
    } catch (err) {
      console.error("Failed to update role:", err);
    } finally {
      setRoleUpdating(null);
    }
  };

  const filteredUsers = users.filter((u) => {
    const s = search.toLowerCase();
    return (
      u.name?.toLowerCase().includes(s) ||
      u.phone?.includes(s) ||
      u.village?.toLowerCase().includes(s) ||
      u.district?.toLowerCase().includes(s) ||
      u.member_id?.toLowerCase().includes(s)
    );
  });

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col font-sans">
      {/* Top Header */}
      <header className="bg-slate-950 border-b border-slate-800 px-6 py-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={onBackToFarmer}
            className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white bg-slate-800/80 hover:bg-slate-800 px-3 py-1.5 rounded-lg transition"
          >
            <ChevronLeft size={16} />
            <span>Switch to Farmer View</span>
          </button>
          <div className="h-4 w-px bg-slate-800" />
          <div className="flex items-center gap-2">
            <span className="p-1.5 bg-emerald-500/20 text-emerald-400 rounded-lg">
              <ShieldCheck size={20} />
            </span>
            <div>
              <h1 className="text-base font-bold text-white leading-tight">
                AgriSathi Admin Console
              </h1>
              <span className="text-[11px] text-slate-400">
                Krishi Vigyan Administrative Portal
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchAdminData}
            disabled={loading}
            className="flex items-center gap-1 text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 px-3 py-1.5 rounded-lg transition disabled:opacity-50"
          >
            <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
            <span>Refresh</span>
          </button>
          <button
            onClick={onLogout}
            className="flex items-center gap-1.5 text-xs bg-red-950/40 hover:bg-red-900/60 text-red-300 border border-red-800/50 px-3 py-1.5 rounded-lg transition"
          >
            <LogOut size={13} />
            <span>Sign Out</span>
          </button>
        </div>
      </header>

      {/* Main Admin Content */}
      <main className="flex-1 p-6 max-w-7xl w-full mx-auto space-y-6">
        {/* System & Metrics Cards */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-slate-950/70 border border-slate-800 p-4 rounded-2xl">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">Registered Farmers</span>
              <Users size={18} className="text-emerald-400" />
            </div>
            <div className="text-2xl font-bold text-white">
              {stats?.metrics?.farmersCount ?? users.length}
            </div>
            <span className="text-[11px] text-slate-400 mt-1 block">Active cultivating profiles</span>
          </div>

          <div className="bg-slate-950/70 border border-slate-800 p-4 rounded-2xl">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">Administrators</span>
              <ShieldAlert size={18} className="text-amber-400" />
            </div>
            <div className="text-2xl font-bold text-white">
              {stats?.metrics?.adminsCount ?? 1}
            </div>
            <span className="text-[11px] text-slate-400 mt-1 block">Authorized officers</span>
          </div>

          <div className="bg-slate-950/70 border border-slate-800 p-4 rounded-2xl">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">Database Engine</span>
              <Server size={18} className="text-blue-400" />
            </div>
            <div className="text-sm font-bold text-white truncate">
              {stats?.system?.database?.status ?? "Active"}
            </div>
            <span className="text-[11px] text-slate-400 mt-1 block">
              {stats?.system?.database?.isMySQL ? "MySQL 8.0 Pool" : "Embedded Local Store"}
            </span>
          </div>

          <div className="bg-slate-950/70 border border-slate-800 p-4 rounded-2xl">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">Node & Memory</span>
              <Activity size={18} className="text-purple-400" />
            </div>
            <div className="text-2xl font-bold text-white">
              {stats?.system?.memoryUsageMb ? `${stats.system.memoryUsageMb} MB` : "Normal"}
            </div>
            <span className="text-[11px] text-slate-400 mt-1 block">
              {stats?.system?.nodeVersion ? `Node.js ${stats.system.nodeVersion}` : "Server Active"}
            </span>
          </div>
        </section>

        {/* API Integration Diagnostics */}
        <section className="bg-slate-950/80 border border-slate-800 p-5 rounded-2xl">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold uppercase tracking-wider text-emerald-400">
                Connected Agricultural APIs & Services
              </h2>
              <p className="text-xs text-slate-400">
                Real-time connection status across verified external providers.
              </p>
            </div>
            <span className="text-xs bg-slate-800 text-slate-300 px-2.5 py-1 rounded-full flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              Live Healthcheck
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {[
              { name: "OpenWeather API", key: "openWeather", desc: "Forecasts & rain radar" },
              { name: "NASA POWER", key: "nasaPower", desc: "Solar & Agroclimatology" },
              { name: "Geoapify Maps", key: "geoapify", desc: "Geocoding & Leaflet tiles" },
              { name: "Groq Llama 3.3", key: "groq", desc: "Ultra-fast advisory engine" },
              { name: "Mistral AI", key: "mistral", desc: "Multilingual guidance" },
              { name: "Google Gemini", key: "gemini", desc: "AI Studio fallback" },
              { name: "Plant.id Vision", key: "plantId", desc: "Leaf disease diagnosis" },
              { name: "Data.gov.in Agmarknet", key: "dataGovIn", desc: "Daily APMC mandi rates" },
            ].map((api) => {
              const isConfigured = stats?.apiStatus?.[api.key];
              return (
                <div
                  key={api.key}
                  className="bg-slate-900/90 border border-slate-800/80 p-3 rounded-xl flex items-start gap-3"
                >
                  <div className="mt-0.5">
                    {isConfigured ? (
                      <CheckCircle2 size={17} className="text-emerald-400" />
                    ) : (
                      <XCircle size={17} className="text-slate-500" />
                    )}
                  </div>
                  <div>
                    <div className="text-xs font-bold text-white">{api.name}</div>
                    <div className="text-[10px] text-slate-400">{api.desc}</div>
                    <span
                      className={`inline-block text-[9px] font-semibold mt-1 px-1.5 py-0.5 rounded ${
                        isConfigured
                          ? "bg-emerald-950 text-emerald-300 border border-emerald-800"
                          : "bg-slate-800 text-slate-400"
                      }`}
                    >
                      {isConfigured ? "Connected" : "Fallback active"}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* User Accounts Management Table */}
        <section className="bg-slate-950/80 border border-slate-800 p-5 rounded-2xl">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <div>
              <h2 className="text-base font-bold text-white">Registered Farmers & Accounts</h2>
              <p className="text-xs text-slate-400">
                View cultivator profiles, farm locations, and manage administrative authorizations.
              </p>
            </div>
            <div className="relative w-64">
              <Search size={15} className="absolute left-3 top-2.5 text-slate-500" />
              <input
                type="text"
                placeholder="Search by name, phone, village..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 text-xs text-slate-200 pl-8 pr-3 py-2 rounded-xl outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="text-[11px] uppercase bg-slate-900/80 text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="px-4 py-3">Farmer / Name</th>
                  <th className="px-4 py-3">Contact</th>
                  <th className="px-4 py-3">Location</th>
                  <th className="px-4 py-3">Crop & Acres</th>
                  <th className="px-4 py-3">Member ID</th>
                  <th className="px-4 py-3">Role</th>
                  <th className="px-4 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-6 text-center text-slate-500">
                      No accounts found matching your search.
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((u) => (
                    <tr key={u.id} className="hover:bg-slate-900/50 transition">
                      <td className="px-4 py-3 font-semibold text-white">
                        <div className="flex items-center gap-2">
                          <span className="h-7 w-7 rounded-full bg-emerald-900/60 text-emerald-300 flex items-center justify-center font-bold text-xs">
                            {u.name?.[0] || "F"}
                          </span>
                          <div>
                            <div>{u.name}</div>
                            <div className="text-[10px] text-slate-400">{u.tenure}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 font-mono text-slate-300">
                        {u.phone}
                        {u.email && <div className="text-[10px] text-slate-500">{u.email}</div>}
                      </td>
                      <td className="px-4 py-3">
                        {u.village ? `${u.village}, ${u.district}` : "Nashik, MH"}
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-semibold text-emerald-400">{u.crop || "Onion"}</span>
                        <div className="text-[10px] text-slate-400">{u.farm_size || "2 acres"}</div>
                      </td>
                      <td className="px-4 py-3 font-mono text-[11px] text-slate-400">
                        {u.member_id || `KS-MH-${u.id}`}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                            u.role === "admin"
                              ? "bg-amber-950 text-amber-300 border border-amber-800"
                              : "bg-emerald-950 text-emerald-300 border border-emerald-800"
                          }`}
                        >
                          {u.role}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          disabled={roleUpdating === u.id || u.id === profile.id}
                          onClick={() => handleRoleToggle(u.id, u.role)}
                          className="text-[11px] bg-slate-800 hover:bg-slate-700 text-slate-300 px-2.5 py-1 rounded-lg transition disabled:opacity-40"
                        >
                          {roleUpdating === u.id
                            ? "Updating..."
                            : u.role === "admin"
                            ? "Demote to Farmer"
                            : "Promote to Admin"}
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </div>
  );
}
