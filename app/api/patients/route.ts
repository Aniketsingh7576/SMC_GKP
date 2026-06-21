import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { apiError, pageParams } from "@/lib/api";
import { patientSchema } from "@/lib/validation";
import { requireSession } from "@/lib/auth";
import Patient from "@/models/Patient";
import Report from "@/models/Report";
import { logActivity } from "@/services/activity.service";

export async function GET(req: Request) {
  try { await requireSession(); await connectDB(); const { page, limit, q } = pageParams(req.url); const filter = q ? { $or: [{ fullName: { $regex: q, $options: "i" } }, { mobile: { $regex: q, $options: "i" } }, { email: { $regex: q, $options: "i" } }] } : {};
    const [items, total] = await Promise.all([Patient.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(), Patient.countDocuments(filter)]);
    const counts = await Report.aggregate([{ $match: { patient: { $in: items.map(x => x._id) } } }, { $group: { _id: "$patient", count: { $sum: 1 } } }]); const map = new Map(counts.map(x => [String(x._id), x.count]));
    return NextResponse.json({ items: items.map(x => ({ ...x, reportCount: map.get(String(x._id)) || 0 })), total, page, pages: Math.ceil(total / limit) });
  } catch (e) { return apiError(e); }
}
export async function POST(req: Request) {
  try { const user = await requireSession(); await connectDB(); const input = patientSchema.parse(await req.json()); const patient = await Patient.create({ ...input, email: input.email || undefined, createdBy: user.id }); await logActivity({ actor: user.id, action: "create_patient", entityType: "Patient", entityId: String(patient._id), request: req }); return NextResponse.json(patient, { status: 201 }); } catch (e) { return apiError(e); }
}
