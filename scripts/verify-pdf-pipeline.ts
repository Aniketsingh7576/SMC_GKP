async function main() {
  const { PDFDocument, StandardFonts } = await import("pdf-lib");
  const { default: QRCode } = await import("qrcode");
  const { embedQRIntoPDF } = await import("../services/report.service");

  const source = await PDFDocument.create();
  const page = source.addPage([595, 842]);
  const font = await source.embedFont(StandardFonts.Helvetica);
  page.drawText("Medical QR pipeline verification", { x: 48, y: 780, size: 20, font });
  const original = Buffer.from(await source.save());
  const uid = "MED-2026-999999";
  const reportUrl = `http://localhost:3000/report?id=${uid}`;
  const qr = await QRCode.toBuffer(reportUrl, { type: "png", width: 800, margin: 2 });
  const placement = { position: "cns-psychiatry" as const, size: 68, margin: 24, customX: 24, customY: 24 };
  const embedded = await embedQRIntoPDF(original, qr, uid, placement);
  const verified = await PDFDocument.load(embedded);
  if (verified.getPageCount() !== 1 || embedded.length <= original.length) {
    throw new Error("Embedded PDF verification failed");
  }
  console.log(JSON.stringify({
    valid: true,
    originalBytes: original.length,
    embeddedBytes: embedded.length,
    position: placement.position,
    size: placement.size,
    reportUrl
  }, null, 2));
  process.exit(0);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
