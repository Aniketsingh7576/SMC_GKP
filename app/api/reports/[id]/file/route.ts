import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { apiError } from "@/lib/api";
import Report from "@/models/Report";
import { storage } from "@/services/storage.service";

export const runtime = "nodejs";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireSession();
    await connectDB();
    const report = await Report.findById((await params).id);
    if (!report) return NextResponse.json({ error: "Report not found" }, { status: 404 });
    const query = new URL(req.url).searchParams;
    const original = query.get("variant") === "original";
    const data = await storage.read(original ? report.originalStorageKey : report.embeddedStorageKey);
    const download = query.get("download") === "1";
    const suffix = original ? "original" : "verified";
    return new NextResponse(new Uint8Array(data), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `${download ? "attachment" : "inline"}; filename="${report.uid}-${suffix}.pdf"`,
        "Cache-Control": "private, no-store"
      }
    });
  } catch (error) {
    return apiError(error);
  }
}
