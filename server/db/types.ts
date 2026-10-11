export type UserRole = "farmer" | "admin";

export interface UserRecord {
  id: number;
  name: string;
  phone: string;
  email?: string | null;
  password_hash: string;
  role: UserRole;
  village: string;
  district: string;
  state: string;
  crop: string;
  farm_size: string;
  tenure: string;
  member_id: string;
  crop_type?: string | null;
  sowing_date?: string | null;
  crop_image?: string | null;
  land_image?: string | null;
  land_unit?: string | null;
  created_at: string;
  updated_at?: string;
}

export interface FarmRecord {
  id: number;
  user_id: number;
  farm_name: string;
  latitude: number;
  longitude: number;
  crop: string;
  acres: number;
  soil_type: string;
  irrigation_type: string;
  created_at: string;
}

export interface AdvisoryRecord {
  id: number;
  user_id?: number | null;
  category: "soil" | "weather" | "pest" | "seed" | "fertilizer" | "resources" | "practice" | "irrigation" | "general";
  query: string;
  response: string;
  language: string;
  provider: string;
  created_at: string;
}

export interface PasswordResetRecord {
  id: number;
  user_id: number;
  token_hash: string;
  expires_at: string;
  used: boolean;
  created_at: string;
}
