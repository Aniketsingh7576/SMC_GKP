import { z } from "zod";

export const loginSchema = z.object({ email: z.string().email(), password: z.string().min(8) });
export const patientSchema = z.object({
  fullName: z.string().trim().min(2).max(100), mobile: z.string().trim().min(8).max(15),
  email: z.union([z.string().email(), z.literal("")]).optional(), gender: z.enum(["male", "female", "other"]),
  age: z.coerce.number().int().min(0).max(130), address: z.string().max(300).optional()
});
export const reportUpdateSchema = z.object({ reportName: z.string().min(2).max(150).optional(), reportType: z.string().min(2).max(80).optional(), status: z.enum(["active", "archived", "revoked"]).optional() });
export const settingsSchema = z.object({
  labName: z.string().min(2).max(120),
  address: z.string().max(300),
  contactNumber: z.string().max(20),
  email: z.string().email(),
  reportUrlPrefix: z.string().url(),
  theme: z.enum(["light", "system"]),
  qrPosition: z.enum(["cns-psychiatry", "bottom-right", "bottom-left", "top-right", "top-left", "custom"]),
  qrSize: z.coerce.number().int().min(48).max(240),
  qrMargin: z.coerce.number().int().min(0).max(144),
  qrCustomX: z.coerce.number().min(0),
  qrCustomY: z.coerce.number().min(0)
});
