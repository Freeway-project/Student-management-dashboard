import { Schema, model, models } from "mongoose";
import { Role } from "./enums";

const UserSchema = new Schema({
  name: String,
  email: { type: String, unique: true, index: true },
  passwordHash: String,
  role: { type: String, enum: ["STUDENT","TEACHER","HEAD","COLLEGE_QC","VICE_DEAN","DEAN","ADMIN"], default: "STUDENT" },
}, { timestamps: true });

export default models.User || model("User", UserSchema);
