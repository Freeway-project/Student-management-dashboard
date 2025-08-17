// src/models/Task.ts
import { Schema, model, models, Types } from "mongoose";

const TaskSchema = new Schema({
  title:       { type: String, required: true }, // e.g., "Course Specification approval"
  description: { type: String },
  courseId:    { type: Types.ObjectId, ref: "Course", index: true },
  orgUnitId:   { type: Types.ObjectId, ref: "OrgUnit", required: true, index: true },

  // who created it
  createdBy:   { type: Types.ObjectId, ref: "User", required: true, index: true },

  // assignment (either user or committee)
  assignedToUserId:     { type: Types.ObjectId, ref: "User", index: true, default: null },
  assignedToCommitteeId:{ type: Types.ObjectId, ref: "Committee", index: true, default: null },

  dueDate:     { type: Date, index: true },
  status:      { type: String, required: true, index: true }, // TaskStatus
  labels:      [{ type: String }], // e.g., "Standard 3"
  tags:        [{ type: String }], // arbitrary tags

  // attachments to the task itself (e.g., forwarded with files)
  attachmentIds: [{ type: Types.ObjectId, ref: "FileObject" }],

  // quick counters (denormalized for dashboard performance)
  counters: {
    submittedCount: { type: Number, default: 0 },
    approvedCount:  { type: Number, default: 0 },
    pendingCount:   { type: Number, default: 0 },
    assignedCount:  { type: Number, default: 0 },
  },
}, { timestamps: true });

TaskSchema.index({ status: 1, orgUnitId: 1, dueDate: 1 });
export default models.Task || model("Task", TaskSchema);