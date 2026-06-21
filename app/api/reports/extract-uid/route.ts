import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth";
import { apiError } from "@/lib/api";
import { extractUIDFromPDF } from "@/services/uid-ocr.service";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    await requireSession();
    const form = await req.formData();
    const file = form.get("file");
    if (!(file instanceof File) || file.type !== "application/pdf") {
      return NextResponse.json({ error: "A valid PDF is required" }, { status: 422 });
    }
    const max = Number(process.env.MAX_UPLOAD_MB || 10) * 1024 * 1024;
    if (file.size > max) {
      return NextResponse.json({ error: "PDF exceeds the upload limit" }, { status: 413 });
    }
    const uid = await extractUIDFromPDF(Buffer.from(await file.arrayBuffer()));
    if (!uid) {
      return NextResponse.json(
        { error: "UID could not be detected. Please enter it exactly as printed." },
        { status: 422 }
      );
    }
    return NextResponse.json({ uid, source: "ocr" });
  } catch (error) {
    if (error instanceof Error && "code" in error && error.code === "ENOENT") {
      return NextResponse.json({ error: "OCR service is not installed on this server" }, { status: 503 });
    }
    return apiError(error);
  }
}
