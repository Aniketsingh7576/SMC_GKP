import { loadEnvConfig } from "@next/env";
loadEnvConfig(process.cwd());

async function main() {
  const [{ connectDB }, { default: Report }, { regenerateQR }] = await Promise.all([
    import("../lib/db"),
    import("../models/Report"),
    import("../services/report.service")
  ]);
  await connectDB();
  const reports = await Report.find({ status: "active" }).select("_id uid").lean();
  for (const report of reports) {
    await regenerateQR(String(report._id));
    console.log(`Regenerated ${report.uid}`);
  }
  console.log(`Updated ${reports.length} active report(s).`);
  process.exit(0);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
