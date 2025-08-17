// src/models/Committee.ts
import { Schema, model, models, Types } from "mongoose";
const CommitteeSchema = new Schema({
  name: { type: String, required: true }, // e.g., Teaching & Learning, Exam Review
  orgUnitId: { type: Types.ObjectId, ref: "OrgUnit", required: true, index: true },
  members: [{ type: Types.ObjectId, ref: "User", index: true }],
}, { timestamps: true });

CommitteeSchema.index({ name: 1, orgUnitId: 1 }, { unique: true });
export default models.Committee || model("Committee", CommitteeSchema);