import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { apiError } from "@/lib/api";
import { requireSession } from "@/lib/auth";
import Patient from "@/models/Patient";
import Report from "@/models/Report";
import { storage } from "@/services/storage.service";
import { reportPublicUrl } from "@/services/report.service";
import { logActivity } from "@/services/activity.service";
import { isValidReportUID, normalizeReportUID } from "@/lib/report-uid";
import { extractUIDFromPDF } from "@/services/uid-ocr.service";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const savedKeys: string[] = [];
  try {
    const user = await requireSession();
    await connectDB();
    const form = await req.formData();
    const file = form.get("file");
    const patientName = String(form.get("patientName") || "").trim();
    const mobileNumber = String(form.get("mobileNumber") || "").trim();
    const reportType = String(form.get("reportType") || "").trim();
    const reportName = String(form.get("reportName") || `${reportType} Report`).trim();
    let uid = normalizeReportUID(String(form.get("reportUid") || ""));

    if (!(file instanceof File) || file.type !== "application/pdf") {
      return NextResponse.json({ error: "A valid PDF file is required" }, { status: 422 });
    }
    const max = Number(process.env.MAX_UPLOAD_MB || 10) * 1024 * 1024;
    if (file.size > max) {
      return NextResponse.json(
        { error: `PDF must be smaller than ${process.env.MAX_UPLOAD_MB || 10} MB` },
        { status: 413 }
      );
    }
    if (patientName.length < 2 || mobileNumber.length < 8 || !reportType) {
      return NextResponse.json(
        { error: "Patient name, valid mobile number and report type are required" },
        { status: 422 }
      );
    }
    const original = Buffer.from(await file.arrayBuffer());
    if (!uid) uid = (await extractUIDFromPDF(original)) || "";
    if (!isValidReportUID(uid)) {
      return NextResponse.json(
        { error: "Enter the UID printed on the PDF (6–40 letters, numbers or hyphens)" },
        { status: 422 }
      );
    }
    if (await Report.exists({ uid })) {
      return NextResponse.json({ error: "This report UID already exists" }, { status: 409 });
    }

    let patient = await Patient.findOne({ mobile: mobileNumber });
    if (!patient) {
      patient = await Patient.create({
        fullName: patientName,
        mobile: mobileNumber,
        gender: "other",
        age: 0,
        createdBy: user.id
      });
    }

    // QR generation/embedding is disabled — store the original PDF as-is and
    // serve it directly. The report still has a public verification page/link.
    const publicUrl = await reportPublicUrl(uid);
    const originalKey = `reports/original/${uid}.pdf`;
    await storage.save(originalKey, original);
    savedKeys.push(originalKey);

    const report = new Report({
      uid,
      patient: patient._id,
      patientName,
      mobileNumber,
      reportName,
      reportType,
      reportUrl: publicUrl,
      originalPdfUrl: "pending",
      qrEmbeddedPdfUrl: "pending",
      originalStorageKey: originalKey,
      embeddedStorageKey: originalKey,
      fileSize: original.length,
      mimeType: file.type,
      createdBy: user.id
    });
    report.originalPdfUrl = `/api/reports/${report._id}/file?variant=original`;
    report.qrEmbeddedPdfUrl = `/api/reports/${report._id}/file`;
    await report.save();
    await report.populate("patient");

    await logActivity({
      actor: user.id,
      action: "upload_report",
      entityType: "Report",
      entityId: String(report._id),
      metadata: { uid },
      request: req
    });
    return NextResponse.json({
      uid,
      reportUrl: publicUrl,
      originalPdf: report.originalPdfUrl,
      modifiedPdf: report.qrEmbeddedPdfUrl,
      report
    }, { status: 201 });
  } catch (error) {
    await Promise.all(savedKeys.map((key) => storage.remove(key)));
    return apiError(error);
  }
}
