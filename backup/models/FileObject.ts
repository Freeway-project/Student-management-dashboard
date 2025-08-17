// src/models/FileObject.ts
import { Schema, model, models, Types } from "mongoose";
const FileObjectSchema = new Schema({
  ownerId:  { type: Types.ObjectId, ref: "User", index: true },
  orgUnitId:{ type: Types.ObjectId, ref: "OrgUnit", index: true },
  courseId: { type: Types.ObjectId, ref: "Course", index: true },
  // storage
  key:      { type: String, required: true }, // e.g., S3 key / path
  name:     String,
  mimeType: String,
  size:     Number,
  kind:     { type: String, index: true }, // "CS","CR","CV","COVER","OTHER"
}, { timestamps: true });

export default models.FileObject || model("FileObject", FileObjectSchema);