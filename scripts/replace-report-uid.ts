import { loadEnvConfig } from "@next/env";
loadEnvConfig(process.cwd());

async function main() {
  const oldUid = process.argv[2]?.trim().toUpperCase();
  const newUid = process.argv[3]?.trim().toUpperCase();
  if (!oldUid || !newUid) throw new Error("Usage: report:replace-uid -- OLD_UID NEW_UID");

  const [
    { connectDB },
    { default: Report },
    { storage },
    { regenerateQR, reportPublicUrl },
    { isValidReportUID }
  ] = await Promise.all([
    import("../lib/db"),
    import("../models/Report"),
    import("../services/storage.service"),
    import("../services/report.service"),
    import("../lib/report-uid")
  ]);
  if (!isValidReportUID(newUid)) throw new Error("The new printed UID is invalid");
  await connectDB();
  if (await Report.exists({ uid: newUid })) throw new Error("The new UID already exists");
  const report = await Report.findOne({ uid: oldUid });
  if (!report) throw new Error(`Report ${oldUid} not found`);

  const oldKeys = [
    report.originalStorageKey,
    report.embeddedStorageKey,
    report.qrPngStorageKey,
    report.qrSvgStorageKey
  ];
  const original = await storage.read(report.originalStorageKey);
  const newOriginalKey = `reports/original/${newUid}.pdf`;
  await storage.save(newOriginalKey, original);

  report.uid = newUid;
  report.reportUrl = await reportPublicUrl(newUid);
  report.originalStorageKey = newOriginalKey;
  await report.save();
  await regenerateQR(String(report._id));
  await Promise.all(oldKeys.map((key) => storage.remove(key)));
  console.log(`Replaced ${oldUid} with printed PDF UID ${newUid}.`);
  process.exit(0);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
