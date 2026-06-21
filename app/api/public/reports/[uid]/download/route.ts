import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { apiError } from "@/lib/api";
import Report from "@/models/Report";
import { storage } from "@/services/storage.service";
import { logActivity } from "@/services/activity.service";
import { isValidReportUID } from "@/lib/report-uid";

export const runtime = "nodejs";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ uid: string }> }
) {
  try {
    await connectDB();
    const { uid } = await params;
    if (!isValidReportUID(uid)) {
      return NextResponse.json({ error: "Invalid report UID" }, { status: 400 });
    }
    const inline = new URL(req.url).searchParams.get("view") === "1";
    const update = inline
      ? { $inc: { views: 1 }, $set: { lastViewedAt: new Date() } }
      : { $inc: { downloads: 1 }, $set: { lastDownloadedAt: new Date() } };
    const report = await Report.findOneAndUpdate({ uid, status: "active" }, update, { new: true });
    if (!report) return NextResponse.json({ error: "Report unavailable" }, { status: 404 });
    const data = await storage.read(report.embeddedStorageKey);
    if (!inline) {
      await logActivity({
        action: "download_report",
        entityType: "Report",
        entityId: String(report._id),
        metadata: { uid },
        request: req
      });
    }
    return new NextResponse(new Uint8Array(data), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `${inline ? "inline" : "attachment"}; filename="${uid}-verified.pdf"`,
        "Cache-Control": "private, no-store",
        "X-Content-Type-Options": "nosniff"
      }
    });
  } catch (error) {
    return apiError(error);
  }
}
