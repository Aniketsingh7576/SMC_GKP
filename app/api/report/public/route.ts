import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { apiError } from "@/lib/api";
import Report from "@/models/Report";
import Settings from "@/models/Settings";
import { storage } from "@/services/storage.service";
import { isValidReportUID, normalizeReportUID } from "@/lib/report-uid";

export async function GET(req: Request) {
  try {
    await connectDB();
    const query = new URL(req.url).searchParams;
    const uid = normalizeReportUID(query.get("id") || "");
    if (!isValidReportUID(uid)) {
      return NextResponse.json({ error: "Invalid report UID" }, { status: 400 });
    }
    const report = await Report.findOne({ uid, status: "active" }).lean();
    if (!report) return NextResponse.json({ error: "Report unavailable" }, { status: 404 });

    if (query.get("file") === "1") {
      const download = query.get("download") === "1";
      await Report.updateOne(
        { _id: report._id },
        download
          ? { $inc: { downloads: 1 }, $set: { lastDownloadedAt: new Date() } }
          : { $inc: { views: 1 }, $set: { lastViewedAt: new Date() } }
      );
      const data = await storage.read(report.embeddedStorageKey);
      return new NextResponse(new Uint8Array(data), {
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `${download ? "attachment" : "inline"}; filename="${uid}-verified.pdf"`,
          "Cache-Control": "private, no-store"
        }
      });
    }

    const lab = await Settings.findOne({ key: "system" }).select("labName logoUrl address contactNumber email").lean();
    return NextResponse.json({
      report: {
        uid: report.uid,
        patientName: report.patientName,
        mobileNumber: report.mobileNumber,
        reportType: report.reportType,
        reportName: report.reportName,
        reportUrl: report.reportUrl,
        uploadDate: report.createdAt,
        qrImageUrl: report.qrImageUrl,
        pdfUrl: `/api/report/public?id=${encodeURIComponent(uid)}&file=1`
      },
      lab
    });
  } catch (error) {
    return apiError(error);
  }
}
