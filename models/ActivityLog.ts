import { Schema, model, models, type Model, type Types } from "mongoose";

export type ActivityAction = "login" | "upload_report" | "edit_report" | "delete_report" | "download_report" | "create_patient" | "edit_patient" | "delete_patient" | "settings_update";
export interface IActivityLog { actor?: Types.ObjectId; action: ActivityAction; entityType?: string; entityId?: Types.ObjectId; metadata?: Record<string, unknown>; ip?: string; userAgent?: string; createdAt: Date; updatedAt: Date }
const schema = new Schema<IActivityLog>({
  actor: { type: Schema.Types.ObjectId, ref: "User", index: true }, action: { type: String, required: true, index: true }, entityType: String,
  entityId: { type: Schema.Types.ObjectId }, metadata: Schema.Types.Mixed, ip: String, userAgent: String
}, { timestamps: true });
schema.index({ createdAt: -1 });
export default (models.ActivityLog as Model<IActivityLog>) || model<IActivityLog>("ActivityLog", schema);
