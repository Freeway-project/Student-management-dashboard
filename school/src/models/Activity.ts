// src/models/Activity.ts
import { Schema, model, models, Types } from "mongoose";
const ActivitySchema = new Schema({
  kind:     { type: String, required: true }, // "TASK_CREATE","ASSIGN","SUBMIT","FORWARD","APPROVE","REVISE","COMMENT"
  actorId:  { type: Types.ObjectId, ref: "User", index: true },
  taskId:   { type: Types.ObjectId, ref: "Task", index: true },
  submissionId: { type: Types.ObjectId, ref: "Submission", index: true },
  orgUnitId:{ type: Types.ObjectId, ref: "OrgUnit", index: true },
  meta:     { type: Schema.Types.Mixed }, // arbitrary details (old->new status etc.)
}, { timestamps: true });

ActivitySchema.index({ taskId: 1, createdAt: -1 });
export default models.Activity || model("Activity", ActivitySchema);