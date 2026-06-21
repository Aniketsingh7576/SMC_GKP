import { Schema, model, models, type Model } from "mongoose";
import type { QRPosition } from "@/models/Report";

export interface ISettings {
  key: string;
  labName: string;
  logoUrl?: string;
  address: string;
  contactNumber: string;
  email: string;
  reportUrlPrefix: string;
  theme: "light" | "system";
  qrPosition: QRPosition;
  qrSize: number;
  qrMargin: number;
  qrCustomX: number;
  qrCustomY: number;
}

const schema = new Schema<ISettings>({
  key: { type: String, unique: true, default: "system" },
  labName: { type: String, default: "MedVault Diagnostics" },
  logoUrl: String,
  address: { type: String, default: "" },
  contactNumber: { type: String, default: "" },
  email: { type: String, default: "admin@example.com" },
  reportUrlPrefix: { type: String, default: "http://localhost:3000/report?id=" },
  theme: { type: String, enum: ["light", "system"], default: "light" },
  qrPosition: { type: String, enum: ["cns-psychiatry", "bottom-right", "bottom-left", "top-right", "top-left", "custom"], default: "cns-psychiatry" },
  qrSize: { type: Number, min: 48, max: 240, default: 68 },
  qrMargin: { type: Number, min: 0, max: 144, default: 24 },
  qrCustomX: { type: Number, min: 0, default: 24 },
  qrCustomY: { type: Number, min: 0, default: 24 }
}, { timestamps: true });

export default (models.Settings as Model<ISettings>) || model<ISettings>("Settings", schema);
