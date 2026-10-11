export type UserRole = "farmer" | "admin";

export type FarmerProfile = {
  id?: number;
  name: string;
  username?: string;
  village: string;
  district: string;
  state: string;
  phone: string;
  email?: string | null;
  crop: string;
  cropType?: string;
  sowingDate?: string;
  farmSize: string;
  landSize?: string | number;
  landUnit?: string;
  cropImage?: string | null;
  landImage?: string | null;
  tenure: string;
  memberId: string;
  role?: UserRole;
};

export const demoCredentials = {
  phone: "9876543210",
  password: "kisan123",
};

export const adminCredentials = {
  phone: "9999999999",
  password: "Admin@agrisathi2026",
};

export const demoProfile: FarmerProfile = {
  name: "Om Atole",
  village: "Niphad",
  district: "Nashik",
  state: "Maharashtra",
  phone: demoCredentials.phone,
  crop: "Onion",
  farmSize: "2.4 acres",
  tenure: "Tenant cultivator · verified by FPO",
  memberId: "KS-MH-2048",
  role: "farmer",
};

const SESSION_KEY = "kisan-saathi-session";
const TOKEN_KEY = "agrisathi-auth-token";

export function loadSession(): FarmerProfile | null {
  try {
    const saved = window.localStorage.getItem(SESSION_KEY);
    return saved ? (JSON.parse(saved) as FarmerProfile) : null;
  } catch {
    return null;
  }
}

export function saveSession(profile: FarmerProfile, token?: string) {
  window.localStorage.setItem(SESSION_KEY, JSON.stringify(profile));
  if (token) {
    window.localStorage.setItem(TOKEN_KEY, token);
  }
}

export function getStoredToken(): string | null {
  return window.localStorage.getItem(TOKEN_KEY);
}

export function clearSession() {
  window.localStorage.removeItem(SESSION_KEY);
  window.localStorage.removeItem(TOKEN_KEY);
}

/**
 * Fetch with credentials and optional stored Bearer token
 */
export async function authFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const token = getStoredToken();
  const headers = new Headers(options.headers || {});
  if (token && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${token}`);
  }
  return fetch(url, {
    ...options,
    credentials: "include",
    headers,
  });
}

/**
 * Perform login against backend API
 */
export async function apiLogin(identifier: string, password: string): Promise<FarmerProfile> {
  const res = await fetch("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ identifier, password }),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || "Sign in failed");
  }

  const user = data.user;
  const profile: FarmerProfile = {
    id: user.id,
    name: user.name,
    username: user.member_id?.replace(/^KS-/, ""),
    village: user.village || "",
    district: user.district || "",
    state: user.state || "Maharashtra",
    phone: user.phone,
    email: user.email,
    crop: user.crop || "Onion",
    cropType: user.crop_type,
    sowingDate: user.sowing_date,
    farmSize: user.farm_size || "2 acres",
    landUnit: user.land_unit || "acres",
    cropImage: user.crop_image,
    landImage: user.land_image,
    tenure: user.tenure || "Cultivator",
    memberId: user.member_id || `KS-MH-${user.id}`,
    role: user.role || "farmer",
  };

  saveSession(profile, data.token);
  return profile;
}

/**
 * Perform registration against backend API
 */
export async function apiRegister(form: {
  name: string;
  username?: string;
  phone: string;
  email?: string;
  password: string;
  confirmPassword: string;
  village: string;
  district: string;
  state?: string;
  crop: string;
  cropType?: string;
  sowingDate?: string;
  landSize?: string | number;
  landUnit?: string;
  farmSize?: string;
  tenure?: string;
  cropImage?: string;
  landImage?: string;
  agreeTerms?: boolean;
}): Promise<FarmerProfile> {
  const res = await fetch("/api/auth/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(form),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || "Registration failed");
  }

  const user = data.user;
  const profile: FarmerProfile = {
    id: user.id,
    name: user.name,
    username: form.username || user.member_id?.replace(/^KS-/, ""),
    village: user.village,
    district: user.district,
    state: user.state,
    phone: user.phone,
    email: user.email,
    crop: user.crop,
    cropType: user.crop_type || form.cropType,
    sowingDate: user.sowing_date || form.sowingDate,
    farmSize: user.farm_size,
    landSize: form.landSize,
    landUnit: user.land_unit || form.landUnit,
    cropImage: user.crop_image || form.cropImage,
    landImage: user.land_image || form.landImage,
    tenure: user.tenure,
    memberId: user.member_id,
    role: user.role || "farmer",
  };

  saveSession(profile, data.token);
  return profile;
}

/**
 * Check currently authenticated user from backend session
 */
export async function checkAuth(): Promise<FarmerProfile | null> {
  try {
    const res = await authFetch("/api/auth/me");
    if (!res.ok) return null;
    const data = await res.json();
    const user = data.user;
    if (!user) return null;

    const profile: FarmerProfile = {
      id: user.id,
      name: user.name,
      username: user.member_id?.replace(/^KS-/, ""),
      village: user.village,
      district: user.district,
      state: user.state,
      phone: user.phone,
      email: user.email,
      crop: user.crop,
      cropType: user.crop_type,
      sowingDate: user.sowing_date,
      farmSize: user.farm_size,
      landUnit: user.land_unit,
      cropImage: user.crop_image,
      landImage: user.land_image,
      tenure: user.tenure,
      memberId: user.member_id,
      role: user.role,
    };
    saveSession(profile);
    return profile;
  } catch {
    return loadSession();
  }
}

/**
 * Sign out and clear backend session cookie
 */
export async function apiLogout() {
  try {
    await authFetch("/api/auth/logout", { method: "POST" });
  } catch {
    // Ignore network error on logout
  }
  clearSession();
}

/**
 * Update profile details on backend
 */
export async function apiUpdateProfile(fields: Partial<FarmerProfile>): Promise<FarmerProfile> {
  const res = await authFetch("/api/auth/profile", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: fields.name,
      village: fields.village,
      district: fields.district,
      state: fields.state,
      crop: fields.crop,
      farm_size: fields.farmSize,
      tenure: fields.tenure,
    }),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || "Failed to update profile");
  }

  const user = data.user;
  const updated: FarmerProfile = {
    id: user.id,
    name: user.name,
    village: user.village,
    district: user.district,
    state: user.state,
    phone: user.phone,
    email: user.email,
    crop: user.crop,
    farmSize: user.farm_size,
    tenure: user.tenure,
    memberId: user.member_id,
    role: user.role,
  };
  saveSession(updated);
  return updated;
}
