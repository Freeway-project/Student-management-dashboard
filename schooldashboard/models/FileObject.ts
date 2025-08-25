// src/models/FileObject.ts
import { Schema, model, models, Types } from "mongoose";
const FileObjectSchema = new Schema({
  ownerId:  { type: Types.ObjectId, ref: "User", index: true },
  orgUnitId:{ type: Types.ObjectId, ref: "OrgUnit", index: true },
  courseId: { type: Types.ObjectId, ref: "Course", index: true },
  taskId:   { type: Types.ObjectId, ref: "Task", index: true },
  submissionId: { type: Types.ObjectId, ref: "Submission", index: true },
  // storage
  key:      { type: String, required: true }, // e.g., S3 key / path
  name:     String,
  mimeType: String,
  size:     Number,
  kind:     { type: String, index: true }, // "CS","CR","CV","COVER","OTHER"
  // Google Drive specific fields (deprecated)
  driveFileId: String, // Google Drive file ID
  viewLink:    String, // Google Drive view link
  downloadLink: String, // Google Drive download link
  // Vercel Blob specific fields
  blobUrl:     String, // Vercel Blob URL
  storageType: { type: String, enum: ["s3", "drive", "blob"], default: "blob" },
}, { timestamps: true });

export default models.FileObject || model("FileObject", FileObjectSchema);