import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { apiError } from "@/lib/api";
import Report from "@/models/Report";
import { regenerateQR } from "@/services/report.service";
import { storage } from "@/services/storage.service";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireSession();
    await connectDB();
    const report = await Report.findById((await params).id);
    if (!report) return NextResponse.json({ error: "Report not found" }, { status: 404 });
    const format = new URL(req.url).searchParams.get("format") === "svg" ? "svg" : "png";
    const key = format === "svg" ? report.qrSvgStorageKey : report.qrPngStorageKey;
    if (!key) return NextResponse.json({ error: "QR not available for this report" }, { status: 404 });
    const data = await storage.read(key);
    return new NextResponse(new Uint8Array(data), {
      headers: {
        "Content-Type": format === "svg" ? "image/svg+xml" : "image/png",
        "Content-Disposition": `attachment; filename="${report.uid}-qr.${format}"`,
        "Cache-Control": "private, no-store"
      }
    });
  } catch (error) {
    return apiError(error);
  }
}

export async function POST(
  _: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireSession();
    await connectDB();
    return NextResponse.json(await regenerateQR((await params).id));
  } catch (error) {
    return apiError(error);
  }
}
