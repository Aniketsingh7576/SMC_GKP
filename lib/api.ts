import { NextResponse } from "next/server";
import { ZodError } from "zod";

export function apiError(error: unknown) {
  console.error(error);
  if (error instanceof ZodError) return NextResponse.json({ error: "Validation failed", fields: error.flatten().fieldErrors }, { status: 422 });
  if (error instanceof Error && error.message === "UNAUTHORIZED") return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  if (error instanceof Error && error.message === "FORBIDDEN") return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
  if (error instanceof Error && error.message.includes("duplicate key")) return NextResponse.json({ error: "A record with this value already exists" }, { status: 409 });
  return NextResponse.json({ error: error instanceof Error ? error.message : "Unexpected server error" }, { status: 500 });
}

export function pageParams(url: string) {
  const p = new URL(url).searchParams;
  return { page: Math.max(1, Number(p.get("page") || 1)), limit: Math.min(100, Math.max(1, Number(p.get("limit") || 20))), q: p.get("q")?.trim() || "" };
}
