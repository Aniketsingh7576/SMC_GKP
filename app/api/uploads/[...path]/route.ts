import { NextResponse } from "next/server";
import { storage, safeStorageKey } from "@/services/storage.service";

export async function GET(
  _: Request,
  { params }: { params: Promise<{ path: string[] }> }
) {
  try {
    const key = safeStorageKey((await params).path.join("/"));
    if (key.startsWith("reports/")) {
      return NextResponse.json(
        { error: "Use the authorized report endpoint" },
        { status: 403 }
      );
    }
    const data = await storage.read(key);
    const contentType = key.endsWith(".png")
      ? "image/png"
      : key.endsWith(".svg")
        ? "image/svg+xml"
      : key.endsWith(".jpg") || key.endsWith(".jpeg")
        ? "image/jpeg"
        : "application/octet-stream";
    return new NextResponse(new Uint8Array(data), {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=86400"
      }
    });
  } catch {
    return NextResponse.json({ error: "File not found" }, { status: 404 });
  }
}
