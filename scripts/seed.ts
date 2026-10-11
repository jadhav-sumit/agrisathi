import dotenv from "dotenv";
import { initDatabase, createUser, findUserByPhone } from "../server/db";
import { hashPassword } from "../server/auth";

dotenv.config();

async function seed() {
  console.log("[AgriSathi] Running database seed...");
  await initDatabase();

  // Create demo farmer account
  const demoPhone = "9876543210";
  const existingFarmer = await findUserByPhone(demoPhone);

  if (!existingFarmer) {
    const password_hash = await hashPassword("kisan123");
    const farmer = await createUser({
      name: "Om Atole",
      phone: demoPhone,
      email: "om.farmer@agrisathi.in",
      password_hash,
      role: "farmer",
      village: "Niphad",
      district: "Nashik",
      state: "Maharashtra",
      crop: "Onion",
      farm_size: "2.4 acres",
      tenure: "Tenant cultivator · verified by FPO",
      member_id: "KS-MH-2048",
    });
    console.log(`[AgriSathi] Created demo farmer account: ${farmer.phone} (Role: farmer)`);
  } else {
    console.log(`[AgriSathi] Demo farmer already exists.`);
  }

  // Create default admin account
  const adminPhone = "9999999999";
  const existingAdmin = await findUserByPhone(adminPhone);

  if (!existingAdmin) {
    const adminHash = await hashPassword("Admin@agrisathi2026");
    const admin = await createUser({
      name: "Krishi Vigyan Administrator",
      phone: adminPhone,
      email: "admin@agrisathi.in",
      password_hash: adminHash,
      role: "admin",
      village: "Nashik Head Office",
      district: "Nashik",
      state: "Maharashtra",
      crop: "All Crops",
      farm_size: "Regional APMC Center",
      tenure: "Senior Agronomist / Director",
      member_id: "KS-ADM-001",
    });
    console.log(`[AgriSathi] Created default administrator account: ${admin.phone} (Role: admin)`);
  } else {
    console.log(`[AgriSathi] Administrator account already exists.`);
  }

  console.log("[AgriSathi] Seeding completed successfully.");
  process.exit(0);
}

seed().catch((err) => {
  console.error("[AgriSathi] Seeding failed:", err);
  process.exit(1);
});
