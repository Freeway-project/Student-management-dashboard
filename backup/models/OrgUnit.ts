// src/models/OrgUnit.ts
import { Schema, model, models, Types } from "mongoose";
const OrgUnitSchema = new Schema({
  name: { type: String, required: true },
  parentId: { type: Types.ObjectId, ref: "OrgUnit", default: null },
  ancestors: [{ type: Types.ObjectId, ref: "OrgUnit", index: true }],
}, { timestamps: true });
export default models.OrgUnit || model("OrgUnit", OrgUnitSchema);
