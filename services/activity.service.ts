import ActivityLog, { type ActivityAction } from "@/models/ActivityLog";

export async function logActivity(input: { actor?: string; action: ActivityAction; entityType?: string; entityId?: string; metadata?: Record<string, unknown>; request?: Request }) {
  const forwarded = input.request?.headers.get("x-forwarded-for");
  return ActivityLog.create({ ...input, request: undefined, ip: forwarded?.split(",")[0] || "unknown", userAgent: input.request?.headers.get("user-agent") });
}
