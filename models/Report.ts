import { Schema, model, models, type Model, type Types } from "mongoose";
import type { ReportStatus } from "@/types";

export type QRPosition = "cns-psychiatry" | "bottom-right" | "bottom-left" | "top-right" | "top-left" | "custom";

export interface IReport {
  uid: string;
  patient: Types.ObjectId;
  patientName: string;
  mobileNumber: string;
  reportName: string;
  reportType: string;
  reportUrl: string;
  qrImageUrl?: string;
  qrSvgUrl?: string;
  originalPdfUrl: string;
  qrEmbeddedPdfUrl: string;
  originalStorageKey: string;
  embeddedStorageKey: string;
  qrPngStorageKey?: string;
  qrSvgStorageKey?: string;
  qrPosition: QRPosition;
  qrSize: number;
  qrMargin: number;
  qrCustomX?: number;
  qrCustomY?: number;
  fileSize: number;
  mimeType: string;
  status: ReportStatus;
  views: number;
  downloads: number;
  createdBy: Types.ObjectId;
  lastViewedAt?: Date;
  lastDownloadedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const schema = new Schema<IReport>({
  uid: { type: String, required: true, unique: true, index: true },
  patient: { type: Schema.Types.ObjectId, ref: "Patient", required: true, index: true },
  patientName: { type: String, required: true, trim: true, index: true },
  mobileNumber: { type: String, required: true, trim: true, index: true },
  reportName: { type: String, required: true, trim: true, index: true },
  reportType: { type: String, required: true, trim: true, index: true },
  reportUrl: { type: String, required: true },
  qrImageUrl: { type: String, default: "" },
  qrSvgUrl: { type: String, default: "" },
  originalPdfUrl: { type: String, required: true },
  qrEmbeddedPdfUrl: { type: String, required: true },
  originalStorageKey: { type: String, required: true },
  embeddedStorageKey: { type: String, required: true },
  qrPngStorageKey: { type: String, default: "" },
  qrSvgStorageKey: { type: String, default: "" },
  qrPosition: { type: String, enum: ["cns-psychiatry", "bottom-right", "bottom-left", "top-right", "top-left", "custom"], default: "cns-psychiatry" },
  qrSize: { type: Number, min: 48, max: 240, default: 100 },
  qrMargin: { type: Number, min: 0, max: 144, default: 24 },
  qrCustomX: Number,
  qrCustomY: Number,
  fileSize: { type: Number, required: true },
  mimeType: { type: String, default: "application/pdf" },
  status: { type: String, enum: ["active", "archived", "revoked"], default: "active", index: true },
  views: { type: Number, default: 0 },
  downloads: { type: Number, default: 0 },
  createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  lastViewedAt: Date,
  lastDownloadedAt: Date
}, { timestamps: true });

schema.index({ createdAt: -1, status: 1 });

export default (models.Report as Model<IReport>) || model<IReport>("Report", schema);
