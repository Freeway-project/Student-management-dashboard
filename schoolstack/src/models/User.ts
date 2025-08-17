import { Schema, model, models } from "mongoose";
const UserSchema = new Schema({
  name: String,
  email: { type: String, unique: true, index: true },
  passwordHash: String,
}, { timestamps: true });
export default models.User || model("User", UserSchema);
