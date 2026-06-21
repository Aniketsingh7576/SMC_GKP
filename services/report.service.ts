import QRCode from "qrcode";
import { PDFDocument } from "pdf-lib";
import Report, { type QRPosition } from "@/models/Report";
import Settings from "@/models/Settings";
import { storage } from "@/services/storage.service";

export interface QRPlacement {
  position: QRPosition;
  size: number;
  margin: number;
  customX: number;
  customY: number;
}

const defaultPlacement: QRPlacement = {
  position: "cns-psychiatry",
  size: 68,
  margin: 24,
  customX: 24,
  customY: 24
};

export async function getQRPlacement(): Promise<QRPlacement> {
  const settings = await Settings.findOne({ key: "system" }).lean();
  return {
    position: settings?.qrPosition || defaultPlacement.position,
    size: settings?.qrSize || defaultPlacement.size,
    margin: settings?.qrMargin ?? defaultPlacement.margin,
    customX: settings?.qrCustomX ?? defaultPlacement.customX,
    customY: settings?.qrCustomY ?? defaultPlacement.customY
  };
}

export async function reportPublicUrl(uid: string) {
  const settings = await Settings.findOne({ key: "system" }).lean();
  const prefix = settings?.reportUrlPrefix || `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/report?id=`;
  if (prefix.includes("{uid}")) return prefix.replace("{uid}", encodeURIComponent(uid));
  if (prefix.endsWith("=")) return `${prefix}${encodeURIComponent(uid)}`;
  const url = new URL(prefix);
  url.searchParams.set("id", uid);
  return url.toString();
}

export async function generateQRAssets(uid: string) {
  const publicUrl = await reportPublicUrl(uid);
  const png = await QRCode.toBuffer(publicUrl, {
    type: "png",
    width: 800,
    margin: 2,
    color: { dark: "#0F172A", light: "#FFFFFF" },
    errorCorrectionLevel: "H"
  });
  const svg = await QRCode.toString(publicUrl, {
    type: "svg",
    margin: 2,
    color: { dark: "#0F172A", light: "#FFFFFF" },
    errorCorrectionLevel: "H"
  });
  const pngKey = `qr/${uid}.png`;
  const svgKey = `qr/${uid}.svg`;
  const [pngUrl, svgUrl] = await Promise.all([
    storage.save(pngKey, png),
    storage.save(svgKey, Buffer.from(svg))
  ]);
  return { publicUrl, png, pngKey, svgKey, pngUrl, svgUrl };
}

function coordinates(
  pageWidth: number,
  pageHeight: number,
  placement: QRPlacement
) {
  const maxX = Math.max(0, pageWidth - placement.size);
  const maxY = Math.max(0, pageHeight - placement.size);
  const left = Math.min(placement.margin, maxX);
  const bottom = Math.min(placement.margin, maxY);
  const right = Math.max(0, pageWidth - placement.size - placement.margin);
  const top = Math.max(0, pageHeight - placement.size - placement.margin);

  switch (placement.position) {
    case "cns-psychiatry": return {
      // Template-specific blank panel beside C.N.S. / PSYCHIATRY. On the
      // reference 612x792 form the cell is bounded by Y=139..217pt and the
      // results divider is at X=235pt. The 68pt QR sits at X=150, Y=143,
      // leaving visible padding inside every border.
      x: Math.max(0, Math.min(pageWidth * 0.245, maxX)),
      y: Math.max(0, Math.min(pageHeight * 0.181, maxY))
    };
    case "bottom-left": return { x: left, y: bottom };
    case "top-right": return { x: right, y: top };
    case "top-left": return { x: left, y: top };
    case "custom": return {
      x: Math.max(0, Math.min(placement.customX, maxX)),
      y: Math.max(0, Math.min(placement.customY, maxY))
    };
    default: return { x: right, y: bottom };
  }
}

export async function embedQRIntoPDF(
  original: Buffer,
  qrPng: Buffer,
  uid: string,
  placement: QRPlacement
) {
  const document = await PDFDocument.load(original);
  const firstPage = document.getPages()[0];
  if (!firstPage) throw new Error("The uploaded PDF has no pages");
  const image = await document.embedPng(qrPng);
  const { width, height } = firstPage.getSize();
  const { x, y } = coordinates(width, height, placement);
  firstPage.drawImage(image, {
    x,
    y,
    width: placement.size,
    height: placement.size
  });
  document.setSubject(`Verified medical report ${uid}`);
  document.setKeywords(["verified medical report", uid]);
  document.setModificationDate(new Date());
  return Buffer.from(await document.save());
}

export async function regenerateQR(id: string) {
  const report = await Report.findById(id);
  if (!report) throw new Error("Report not found");
  const [original, placement, qr] = await Promise.all([
    storage.read(report.originalStorageKey),
    getQRPlacement(),
    generateQRAssets(report.uid)
  ]);
  const embedded = await embedQRIntoPDF(original, qr.png, report.uid, placement);
  const embeddedKey = `reports/embedded/${report.uid}.pdf`;
  const embeddedUrl = await storage.save(embeddedKey, embedded);
  report.reportUrl = qr.publicUrl;
  report.qrImageUrl = qr.pngUrl;
  report.qrSvgUrl = qr.svgUrl;
  report.qrPngStorageKey = qr.pngKey;
  report.qrSvgStorageKey = qr.svgKey;
  report.qrEmbeddedPdfUrl = embeddedUrl;
  report.embeddedStorageKey = embeddedKey;
  report.qrPosition = placement.position;
  report.qrSize = placement.size;
  report.qrMargin = placement.margin;
  report.qrCustomX = placement.customX;
  report.qrCustomY = placement.customY;
  await report.save();
  return report.populate("patient");
}
