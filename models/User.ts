import { Schema, model, models, type Model } from "mongoose";
import type { Role } from "@/types";

export interface IUser { name: string; email: string; passwordHash: string; role: Role; active: boolean; lastLoginAt?: Date }
const schema = new Schema<IUser>({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
  passwordHash: { type: String, required: true, select: false },
  role: { type: String, enum: ["super_admin", "admin", "staff"], default: "staff", index: true },
  active: { type: Boolean, default: true }, lastLoginAt: Date
}, { timestamps: true });
export default (models.User as Model<IUser>) || model<IUser>("User", schema);
