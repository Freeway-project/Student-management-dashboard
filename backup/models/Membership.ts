import { Schema, model, models, Types } from "mongoose";
import { Roles } from "./enums";

const MembershipSchema = new Schema({
  userId:    { type: Types.ObjectId, ref: "User", required: true, index: true },
  orgUnitId: { type: Types.ObjectId, ref: "OrgUnit", required: true, index: true },
  role:      { type: String, required: true, enum: Roles }, // Role
}, { timestamps: true });
MembershipSchema.index({ userId: 1, orgUnitId: 1 }, { unique: true });
export default models.Membership || model("Membership", MembershipSchema);
