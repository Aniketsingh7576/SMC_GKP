import { loadEnvConfig } from "@next/env";
loadEnvConfig(process.cwd());

async function main() {
  const [{ connectDB }, { default: Settings }] = await Promise.all([
    import("../lib/db"),
    import("../models/Settings")
  ]);
  await connectDB();
  await Settings.findOneAndUpdate(
    { key: "system" },
    {
      $set: {
        qrPosition: "cns-psychiatry",
        qrSize: 68,
        qrMargin: 24
      }
    },
    { upsert: true, new: true }
  );
  console.log("QR placement set to CNS / Psychiatry box (68pt, exact reference anchor).");
  process.exit(0);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
