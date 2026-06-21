import { Schema, model, models, type Model, type Types } from "mongoose";

export interface IPatient { fullName: string; mobile: string; email?: string; gender: "male" | "female" | "other"; age: number; address?: string; createdBy: Types.ObjectId; createdAt: Date; updatedAt: Date }
const schema = new Schema<IPatient>({
  fullName: { type: String, required: true, trim: true, index: true }, mobile: { type: String, required: true, trim: true, index: true },
  email: { type: String, lowercase: true, trim: true, sparse: true }, gender: { type: String, enum: ["male", "female", "other"], required: true },
  age: { type: Number, min: 0, max: 130, required: true }, address: { type: String, trim: true }, createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true }
}, { timestamps: true });
schema.index({ fullName: "text", mobile: "text", email: "text" });
export default (models.Patient as Model<IPatient>) || model<IPatient>("Patient", schema);
