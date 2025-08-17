// src/models/Course.ts
import { Schema, model, models, Types } from "mongoose";
const CourseSchema = new Schema({
  code: { type: String, index: true },   // e.g., PEDO 514
  name: String,
  orgUnitId: { type: Types.ObjectId, ref: "OrgUnit", required: true, index: true },
  coordinators: [{ type: Types.ObjectId, ref: "User" }], // Course Coordinator(s)
}, { timestamps: true });

CourseSchema.index({ code: 1, orgUnitId: 1 }, { unique: true });
export default models.Course || model("Course", CourseSchema);