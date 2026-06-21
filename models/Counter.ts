import { Schema, model, models, type Model } from "mongoose";
interface ICounter { key: string; sequence: number }
const schema = new Schema<ICounter>({ key: { type: String, unique: true }, sequence: { type: Number, default: 0 } });
export default (models.Counter as Model<ICounter>) || model<ICounter>("Counter", schema);
