// models/TaskAssignment.ts
import { Schema, model, models, Types } from "mongoose";
import { AssignmentStatus, DeptRoles } from "./enums";

const TaskAssignmentSchema = new Schema(
  {
    departmentId: { type: Types.ObjectId, ref: "Department" },

    taskId: { type: Types.ObjectId, ref: "Task", required: true },
    assigneeUserId: { type: Types.ObjectId, ref: "User", required: true },
    assignedByUserId: { type: Types.ObjectId, ref: "User", required: true },

    // Role at time of assignment
    assigneeRoleAtAssign: {
      type: String,
      enum: DeptRoles,
      required: true
    },

    status: {
      type: String,
      enum: AssignmentStatus,
      default: "NOT_SUBMITTED",
      required: true
    },

    // Submission tracking
    lastSubmissionId: { type: Types.ObjectId, ref: "Submission" },
    lastSubmittedAt: Date,
    attempts: { type: Number, default: 0 },
    itemsCount: { type: Number, default: 0 },

    // Who can review this assignment
    reviewerUserId: { type: Types.ObjectId, ref: "User", required: true }
  },
  { timestamps: true }
);

TaskAssignmentSchema.index({ taskId: 1, assigneeUserId: 1 }, { unique: true });
TaskAssignmentSchema.index({ departmentId: 1, status: 1 });
TaskAssignmentSchema.index({ assigneeUserId: 1, status: 1 });
TaskAssignmentSchema.index({ assignedByUserId: 1 });
TaskAssignmentSchema.index({ lastSubmittedAt: -1 });

export default models.TaskAssignment || model("TaskAssignment", TaskAssignmentSchema);
