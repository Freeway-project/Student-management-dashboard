import { Schema, model, models } from "mongoose";
import { Role } from "./enums";

const UserSchema = new Schema({
  name: String,
  email: { type: String, unique: true, index: true },
  passwordHash: String,
  role: { type: String, enum: ["STUDENT","TEACHER","HEAD","COLLEGE_QC","VICE_DEAN","DEAN","ADMIN"], default: "STUDENT" },
  otherInfo: { type: Schema.Types.Mixed, default: {} }, // JSON field for additional info
  parentId: { type: Schema.Types.ObjectId, ref: "User", default: null }, // For hierarchy
}, { timestamps: true });

export default models.User || model("User", UserSchema);
