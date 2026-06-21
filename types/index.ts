export type Role = "super_admin" | "admin" | "staff";
export type ReportStatus = "active" | "archived" | "revoked";

export interface SessionUser { id: string; name: string; email: string; role: Role }
export interface PatientDTO { _id: string; fullName: string; mobile: string; email?: string; gender: string; age: number; address?: string; reportCount?: number; createdAt: string }
export type QRPosition = "cns-psychiatry" | "bottom-right" | "bottom-left" | "top-right" | "top-left" | "custom";
export interface ReportDTO { _id: string; uid: string; patient: PatientDTO; patientName: string; mobileNumber: string; reportName: string; reportType: string; reportUrl: string; qrImageUrl: string; qrSvgUrl: string; originalPdfUrl: string; qrEmbeddedPdfUrl: string; qrPosition: QRPosition; qrSize: number; qrMargin: number; status: ReportStatus; views: number; downloads: number; fileSize: number; createdAt: string }
