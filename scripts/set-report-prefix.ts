import { loadEnvConfig } from "@next/env";
loadEnvConfig(process.cwd());

async function main() {
  const [{ connectDB }, { default: Settings }] = await Promise.all([
    import("../lib/db"),
    import("../models/Settings")
  ]);
  await connectDB();
  const prefix = process.argv[2];
  if (!prefix) throw new Error("Usage: set-report-prefix <prefix>");
  const res = await Settings.findOneAndUpdate(
    { key: "system" },
    { reportUrlPrefix: prefix },
    { new: true, upsert: true }
  );
  console.log("reportUrlPrefix is now:", res?.reportUrlPrefix);
  process.exit(0);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
