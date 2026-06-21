import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { apiError } from "@/lib/api";
import Report from "@/models/Report";
import { regenerateQR } from "@/services/report.service";

export async function POST(req: Request) {
  try {
    await requireSession();
    await connectDB();
    const input = await req.json() as { id?: string; uid?: string };
    const id = input.id || (input.uid ? String((await Report.findOne({ uid: input.uid }).select("_id"))?._id || "") : "");
    if (!id) return NextResponse.json({ error: "Report not found" }, { status: 404 });
    return NextResponse.json(await regenerateQR(id));
  } catch (error) {
    return apiError(error);
  }
}
