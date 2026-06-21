import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { apiError } from "@/lib/api";
import { requireSession } from "@/lib/auth";
import { settingsSchema } from "@/lib/validation";
import Settings from "@/models/Settings";
import { storage } from "@/services/storage.service";
import { logActivity } from "@/services/activity.service";

const defaults = {
  labName: "MedVault Diagnostics",
  address: "",
  contactNumber: "",
  email: "admin@example.com",
  reportUrlPrefix: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/report?id=`,
  theme: "light",
  qrPosition: "cns-psychiatry",
  qrSize: 68,
  qrMargin: 24,
  qrCustomX: 24,
  qrCustomY: 24
};

export async function GET() {
  try {
    await requireSession();
    await connectDB();
    const item = await Settings.findOneAndUpdate(
      { key: "system" },
      { $setOnInsert: defaults },
      { upsert: true, new: true }
    ).lean();
    return NextResponse.json(item);
  } catch (error) {
    return apiError(error);
  }
}

export async function PUT(req: Request) {
  try {
    const user = await requireSession(["super_admin", "admin"]);
    await connectDB();
    const contentType = req.headers.get("content-type") || "";
    let data: Record<string, unknown>;
    let logoUrl: string | undefined;

    if (contentType.includes("multipart/form-data")) {
      const form = await req.formData();
      data = Object.fromEntries([...form.entries()].filter(([key]) => key !== "logo"));
      const logo = form.get("logo");
      if (logo instanceof File && logo.size) {
        if (!logo.type.startsWith("image/")) {
          return NextResponse.json({ error: "Logo must be an image" }, { status: 422 });
        }
        const extension = logo.type === "image/png" ? "png" : "jpg";
        logoUrl = await storage.save(
          `branding/logo.${extension}`,
          Buffer.from(await logo.arrayBuffer())
        );
      }
    } else {
      data = await req.json();
    }

    const parsed = settingsSchema.parse(data);
    const item = await Settings.findOneAndUpdate(
      { key: "system" },
      { ...parsed, ...(logoUrl ? { logoUrl } : {}) },
      { upsert: true, new: true, runValidators: true }
    );
    if (!item) throw new Error("Unable to save settings");

    await logActivity({
      actor: user.id,
      action: "settings_update",
      entityType: "Settings",
      entityId: String(item._id),
      request: req
    });
    return NextResponse.json(item);
  } catch (error) {
    return apiError(error);
  }
}
