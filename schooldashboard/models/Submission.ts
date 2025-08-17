// src/models/Submission.ts
import { Schema, model, models, Types } from "mongoose";

const SubmissionSchema = new Schema({
  taskId:    { type: Types.ObjectId, ref: "Task", required: true, index: true },
  courseId:  { type: Types.ObjectId, ref: "Course", index: true },
  orgUnitId: { type: Types.ObjectId, ref: "OrgUnit", required: true, index: true },

  // who submitted
  submitterId: { type: Types.ObjectId, ref: "User", required: true, index: true },

  // files included
  fileIds:     [{ type: Types.ObjectId, ref: "FileObject" }],

  // status of this submission
  status:      { type: String, required: true, index: true }, // TaskStatus subset: SUBMITTED|PENDING_REVIEW|REVISE|UPDATED|APPROVED
  comment:     { type: String },       // optional note on submit/update
  reviewerNote:{ type: String },       // last reviewer’s note (e.g., why revise)

  // timeline for dashboards
  submittedAt: { type: Date, index: true },
  reviewedAt:  { type: Date, index: true },
}, { timestamps: true });

SubmissionSchema.index({ orgUnitId: 1, status: 1, submittedAt: -1 });
export default models.Submission || model("Submission", SubmissionSchema);
