import fs from "fs";
import path from "path";
import mysql, { type Pool } from "mysql2/promise";
import type { UserRecord, FarmRecord, AdvisoryRecord, PasswordResetRecord, UserRole } from "./types";

export * from "./types";

let mysqlPool: Pool | null = null;
let isUsingMySQL = false;

// Local fallback store path
const dataDir = path.resolve(process.cwd(), "data");
const localStorePath = path.join(dataDir, "agrisathi_db.json");

interface LocalStoreData {
  users: UserRecord[];
  farms: FarmRecord[];
  advisories: AdvisoryRecord[];
  password_resets: PasswordResetRecord[];
}

function ensureLocalStore(): LocalStoreData {
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  if (!fs.existsSync(localStorePath)) {
    const initial: LocalStoreData = {
      users: [],
      farms: [],
      advisories: [],
      password_resets: [],
    };
    fs.writeFileSync(localStorePath, JSON.stringify(initial, null, 2), "utf-8");
    return initial;
  }
  try {
    const content = fs.readFileSync(localStorePath, "utf-8");
    return JSON.parse(content);
  } catch {
    return { users: [], farms: [], advisories: [], password_resets: [] };
  }
}

function saveLocalStore(data: LocalStoreData) {
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  fs.writeFileSync(localStorePath, JSON.stringify(data, null, 2), "utf-8");
}

export async function initDatabase() {
  const host = process.env.DB_HOST || "localhost";
  const port = Number(process.env.DB_PORT) || 3306;
  const user = process.env.DB_USER || "root";
  const password = process.env.DB_PASSWORD;
  const database = process.env.DB_NAME || "agrisathi";

  // Only attempt MySQL if explicitly configured or password given
  if (password !== undefined && password !== "") {
    try {
      // Connect without db first to create database if needed
      const tempConn = await mysql.createConnection({
        host,
        port,
        user,
        password,
      });
      await tempConn.query(`CREATE DATABASE IF NOT EXISTS \`${database}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`);
      await tempConn.end();

      mysqlPool = mysql.createPool({
        host,
        port,
        user,
        password,
        database,
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0,
      });

      // Verify connection
      const [test] = await mysqlPool.query("SELECT 1 as val");
      if (test) {
        isUsingMySQL = true;
        console.log(`[AgriSathi DB] Connected to MySQL database '${database}' on ${host}:${port}`);
        await runMySQLMigrations();
        return;
      }
    } catch (err: any) {
      console.warn(`[AgriSathi DB] MySQL connection not established (${err.message}). Using local reliable storage fallback.`);
    }
  } else {
    console.log("[AgriSathi DB] DB_PASSWORD not configured. Running in high-reliability local database mode.");
  }

  ensureLocalStore();
}

async function runMySQLMigrations() {
  if (!mysqlPool) return;
  const schemaPath = path.resolve(__dirname, "schema.sql");
  if (fs.existsSync(schemaPath)) {
    const schemaSql = fs.readFileSync(schemaPath, "utf-8");
    const queries = schemaSql
      .split(";")
      .map((q) => q.trim())
      .filter((q) => q.length > 0 && !q.startsWith("--") && !q.startsWith("USE ") && !q.startsWith("CREATE DATABASE"));

    for (const q of queries) {
      try {
        await mysqlPool.query(q);
      } catch (err: any) {
        console.warn(`[AgriSathi DB] Migration note:`, err.message);
      }
    }
  }
}

export function isDbLive(): { isMySQL: boolean; status: string } {
  return {
    isMySQL: isUsingMySQL,
    status: isUsingMySQL ? "MySQL 8.0 Connected (InnoDB)" : "Local Persistent JSON / Embedded DB Active",
  };
}

// ---------------------------------------------------------------------------
// Repository Operations (Safe, Parameterized, Consistent)
// ---------------------------------------------------------------------------

export async function findUserByPhone(phone: string): Promise<UserRecord | null> {
  const cleanPhone = phone.trim();
  if (isUsingMySQL && mysqlPool) {
    const [rows]: any = await mysqlPool.query(
      "SELECT * FROM users WHERE phone = ? LIMIT 1",
      [cleanPhone]
    );
    return rows[0] || null;
  }
  const data = ensureLocalStore();
  return data.users.find((u) => u.phone === cleanPhone) || null;
}

export async function findUserByEmail(email: string): Promise<UserRecord | null> {
  const cleanEmail = email.trim().toLowerCase();
  if (!cleanEmail) return null;
  if (isUsingMySQL && mysqlPool) {
    const [rows]: any = await mysqlPool.query(
      "SELECT * FROM users WHERE LOWER(email) = ? LIMIT 1",
      [cleanEmail]
    );
    return rows[0] || null;
  }
  const data = ensureLocalStore();
  return data.users.find((u) => u.email && u.email.toLowerCase() === cleanEmail) || null;
}

export async function findUserById(id: number): Promise<UserRecord | null> {
  if (isUsingMySQL && mysqlPool) {
    const [rows]: any = await mysqlPool.query(
      "SELECT * FROM users WHERE id = ? LIMIT 1",
      [id]
    );
    return rows[0] || null;
  }
  const data = ensureLocalStore();
  return data.users.find((u) => u.id === id) || null;
}

export async function createUser(userData: {
  name: string;
  phone: string;
  email?: string | null;
  password_hash: string;
  role?: UserRole;
  village?: string;
  district?: string;
  state?: string;
  crop?: string;
  farm_size?: string;
  tenure?: string;
  member_id?: string;
  crop_type?: string | null;
  sowing_date?: string | null;
  crop_image?: string | null;
  land_image?: string | null;
  land_unit?: string | null;
}): Promise<UserRecord> {
  const now = new Date().toISOString();
  const role: UserRole = userData.role || "farmer";
  const member_id = userData.member_id || `KS-MH-${Math.floor(1000 + Math.random() * 9000)}`;

  if (isUsingMySQL && mysqlPool) {
    try {
      const [result]: any = await mysqlPool.query(
        `INSERT INTO users (name, phone, email, password_hash, role, village, district, state, crop, farm_size, tenure, member_id, crop_type, sowing_date, crop_image, land_image, land_unit, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
        [
          userData.name,
          userData.phone,
          userData.email || null,
          userData.password_hash,
          role,
          userData.village || "",
          userData.district || "",
          userData.state || "Maharashtra",
          userData.crop || "Onion",
          userData.farm_size || "2 acres",
          userData.tenure || "Cultivator",
          member_id,
          userData.crop_type || "",
          userData.sowing_date || "",
          userData.crop_image || null,
          userData.land_image || null,
          userData.land_unit || "acres",
        ]
      );
      return (await findUserById(result.insertId))!;
    } catch {
      // Fallback for MySQL schema without extra columns
      const [result]: any = await mysqlPool.query(
        `INSERT INTO users (name, phone, email, password_hash, role, village, district, state, crop, farm_size, tenure, member_id, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
        [
          userData.name,
          userData.phone,
          userData.email || null,
          userData.password_hash,
          role,
          userData.village || "",
          userData.district || "",
          userData.state || "Maharashtra",
          userData.crop || "Onion",
          userData.farm_size || "2 acres",
          userData.tenure || "Cultivator",
          member_id,
        ]
      );
      return (await findUserById(result.insertId))!;
    }
  }

  const data = ensureLocalStore();
  const newId = data.users.length > 0 ? Math.max(...data.users.map((u) => u.id)) + 1 : 1;
  const newUser: UserRecord = {
    id: newId,
    name: userData.name,
    phone: userData.phone,
    email: userData.email || null,
    password_hash: userData.password_hash,
    role,
    village: userData.village || "",
    district: userData.district || "",
    state: userData.state || "Maharashtra",
    crop: userData.crop || "Onion",
    farm_size: userData.farm_size || "2 acres",
    tenure: userData.tenure || "Cultivator",
    member_id,
    crop_type: userData.crop_type || "",
    sowing_date: userData.sowing_date || "",
    crop_image: userData.crop_image || null,
    land_image: userData.land_image || null,
    land_unit: userData.land_unit || "acres",
    created_at: now,
  };
  data.users.push(newUser);
  saveLocalStore(data);
  return newUser;
}

export async function updateUser(
  id: number,
  fields: Partial<Omit<UserRecord, "id" | "created_at">>
): Promise<UserRecord | null> {
  if (isUsingMySQL && mysqlPool) {
    const keys = Object.keys(fields);
    if (keys.length === 0) return findUserById(id);
    const setClause = keys.map((k) => `\`${k}\` = ?`).join(", ");
    const values = keys.map((k) => (fields as any)[k]);
    await mysqlPool.query(`UPDATE users SET ${setClause} WHERE id = ?`, [...values, id]);
    return findUserById(id);
  }

  const data = ensureLocalStore();
  const idx = data.users.findIndex((u) => u.id === id);
  if (idx === -1) return null;
  data.users[idx] = { ...data.users[idx], ...fields, updated_at: new Date().toISOString() };
  saveLocalStore(data);
  return data.users[idx];
}

export async function getAllUsers(): Promise<Omit<UserRecord, "password_hash">[]> {
  if (isUsingMySQL && mysqlPool) {
    const [rows]: any = await mysqlPool.query(
      "SELECT id, name, phone, email, role, village, district, state, crop, farm_size, tenure, member_id, created_at, updated_at FROM users ORDER BY created_at DESC"
    );
    return rows;
  }
  const data = ensureLocalStore();
  return data.users.map(({ password_hash, ...rest }) => rest);
}

// ---------------------------------------------------------------------------
// Advisory Repository
// ---------------------------------------------------------------------------
export async function saveAdvisory(record: {
  user_id?: number | null;
  category: "soil" | "weather" | "pest" | "seed" | "fertilizer" | "resources" | "practice" | "irrigation" | "general";
  query: string;
  response: string;
  language: string;
  provider: string;
}): Promise<AdvisoryRecord> {
  const now = new Date().toISOString();
  if (isUsingMySQL && mysqlPool) {
    const [res]: any = await mysqlPool.query(
      `INSERT INTO advisories (user_id, category, query, response, language, provider, created_at)
       VALUES (?, ?, ?, ?, ?, ?, NOW())`,
      [record.user_id || null, record.category, record.query, record.response, record.language, record.provider]
    );
    return {
      id: res.insertId,
      ...record,
      created_at: now,
    };
  }

  const data = ensureLocalStore();
  const id = data.advisories.length > 0 ? Math.max(...data.advisories.map((a) => a.id)) + 1 : 1;
  const newRec: AdvisoryRecord = { id, ...record, created_at: now };
  data.advisories.push(newRec);
  saveLocalStore(data);
  return newRec;
}

export async function getAdvisoriesByUser(userId: number, limit = 15): Promise<AdvisoryRecord[]> {
  if (isUsingMySQL && mysqlPool) {
    const [rows]: any = await mysqlPool.query(
      "SELECT * FROM advisories WHERE user_id = ? ORDER BY created_at DESC LIMIT ?",
      [userId, limit]
    );
    return rows;
  }
  const data = ensureLocalStore();
  return data.advisories
    .filter((a) => a.user_id === userId)
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, limit);
}

// ---------------------------------------------------------------------------
// Password Reset Tokens
// ---------------------------------------------------------------------------
export async function createPasswordReset(userId: number, tokenHash: string, expiresAt: string) {
  if (isUsingMySQL && mysqlPool) {
    await mysqlPool.query(
      "INSERT INTO password_resets (user_id, token_hash, expires_at, used, created_at) VALUES (?, ?, ?, 0, NOW())",
      [userId, tokenHash, expiresAt]
    );
    return;
  }
  const data = ensureLocalStore();
  const id = data.password_resets.length > 0 ? Math.max(...data.password_resets.map((p) => p.id)) + 1 : 1;
  data.password_resets.push({
    id,
    user_id: userId,
    token_hash: tokenHash,
    expires_at: expiresAt,
    used: false,
    created_at: new Date().toISOString(),
  });
  saveLocalStore(data);
}

export async function findValidResetToken(tokenHash: string): Promise<PasswordResetRecord | null> {
  const now = new Date().toISOString();
  if (isUsingMySQL && mysqlPool) {
    const [rows]: any = await mysqlPool.query(
      "SELECT * FROM password_resets WHERE token_hash = ? AND used = 0 AND expires_at > NOW() LIMIT 1",
      [tokenHash]
    );
    return rows[0] || null;
  }
  const data = ensureLocalStore();
  return (
    data.password_resets.find(
      (p) => p.token_hash === tokenHash && !p.used && new Date(p.expires_at).getTime() > Date.now()
    ) || null
  );
}

export async function markResetTokenUsed(id: number) {
  if (isUsingMySQL && mysqlPool) {
    await mysqlPool.query("UPDATE password_resets SET used = 1 WHERE id = ?", [id]);
    return;
  }
  const data = ensureLocalStore();
  const item = data.password_resets.find((p) => p.id === id);
  if (item) {
    item.used = true;
    saveLocalStore(data);
  }
}
