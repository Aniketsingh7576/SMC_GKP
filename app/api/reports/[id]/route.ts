import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { apiError } from "@/lib/api";
import { requireSession } from "@/lib/auth";
import { reportUpdateSchema } from "@/lib/validation";
import Report from "@/models/Report";
import { storage } from "@/services/storage.service";
import { logActivity } from "@/services/activity.service";

type Context = { params: Promise<{ id: string }> };

export async function GET(_: Request, { params }: Context) {
  try {
    await requireSession();
    await connectDB();
    const report = await Report.findById((await params).id).populate("patient").lean();
    return report
      ? NextResponse.json(report)
      : NextResponse.json({ error: "Report not found" }, { status: 404 });
  } catch (error) {
    return apiError(error);
  }
}

export async function PUT(req: Request, { params }: Context) {
  try {
    const user = await requireSession();
    await connectDB();
    const { id } = await params;
    const report = await Report.findByIdAndUpdate(
      id,
      reportUpdateSchema.parse(await req.json()),
      { new: true, runValidators: true }
    ).populate("patient");
    if (!report) return NextResponse.json({ error: "Report not found" }, { status: 404 });
    await logActivity({ actor: user.id, action: "edit_report", entityType: "Report", entityId: id, request: req });
    return NextResponse.json(report);
  } catch (error) {
    return apiError(error);
  }
}

export async function DELETE(req: Request, { params }: Context) {
  try {
    const user = await requireSession(["super_admin", "admin"]);
    await connectDB();
    const { id } = await params;
    const report = await Report.findByIdAndDelete(id);
    if (!report) return NextResponse.json({ error: "Report not found" }, { status: 404 });
    await Promise.all(
      [
        report.originalStorageKey,
        report.embeddedStorageKey,
        report.qrPngStorageKey,
        report.qrSvgStorageKey
      ].filter((key): key is string => Boolean(key)).map((key) => storage.remove(key))
    );
    await logActivity({
      actor: user.id,
      action: "delete_report",
      entityType: "Report",
      entityId: id,
      metadata: { uid: report.uid },
      request: req
    });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return apiError(error);
  }
}
