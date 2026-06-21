import { loadEnvConfig } from "@next/env";
loadEnvConfig(process.cwd());
import bcrypt from "bcryptjs";

async function seed() {
  const [{ connectDB }, { default: User }, { default: Settings }] = await Promise.all([
    import("../lib/db"),
    import("../models/User"),
    import("../models/Settings")
  ]);
  await connectDB();
  const email = (process.env.SEED_ADMIN_EMAIL || "admin@medvault.local").toLowerCase();
  const password = process.env.SEED_ADMIN_PASSWORD || "ChangeMe123!";
  const passwordHash = await bcrypt.hash(password, 12);
  const currentAdmin = await User.findOne({ role: "super_admin" });
  if (currentAdmin) {
    currentAdmin.name = "Aniket";
    currentAdmin.email = email;
    currentAdmin.passwordHash = passwordHash;
    currentAdmin.active = true;
    await currentAdmin.save();
  } else {
    await User.create({ name: "Aniket", email, passwordHash, role: "super_admin", active: true });
  }
  await Settings.findOneAndUpdate({ key: "system" }, { $setOnInsert: { labName: "MedVault Diagnostics", address: "", contactNumber: "", email, reportUrlPrefix: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/report?id=`, theme: "light", qrPosition: "cns-psychiatry", qrSize: 68, qrMargin: 24, qrCustomX: 24, qrCustomY: 24 } }, { upsert: true });
  console.log(`Seed complete. Admin: ${email}`);
  process.exit(0);
}
seed().catch(error => { console.error(error); process.exit(1); });
