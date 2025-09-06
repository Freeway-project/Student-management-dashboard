// models/Task.ts
import { Schema, model, models, Types } from "mongoose";

export const Priority = ["LOW", "MEDIUM", "HIGH", "URGENT"] as const;
export type Priority = typeof Priority[number];

export const DeliverableType = ["PDF", "EXCEL", "URL"] as const;
export type DeliverableType = typeof DeliverableType[number];



const DeliverableSchema = new Schema(
  {
    type: { type: String, enum: DeliverableType, required: true }, // PDF|EXCEL|URL
    label: { type: String, required: true },
    optional: { type: Boolean, default: false },
    fileUrl: { type: String, required: false }, // URL of the uploaded file
  }
);

const AssignmentSchema = new Schema(
  {
    // Assign to a user for their role in a specific department
    userId: { type: Types.ObjectId, ref: "User" },
    departmentId: { type: Types.ObjectId, ref: "Department" },
    
    // What role this assignment is for (e.g. "PROFESSOR", "HOD")
    assignedRole: String, // The specific role this task is assigned for
    
    // Workflow
    assignedByUserId: { type: Types.ObjectId, ref: "User" },
    reviewerUserId: { type: Types.ObjectId, ref: "User" },
    status: { type: String, default: "NOT_SUBMITTED" },
    
    // Simple progress fields
    lastSubmissionId: { type: Types.ObjectId, ref: "Submission" },
    lastSubmittedAt: Date,
    attempts: { type: Number, default: 0 },
    message: String
  },
  { _id: false }
);

const TaskSchema = new Schema(
  {
    departmentId: { type: Types.ObjectId, ref: "Department" }, // task's owning dept
    
    title: String,
    description: String,
    instructions: String,

    priority: { type: String, default: "MEDIUM" }, // LOW | MEDIUM | HIGH | URGENT (not enforced)
    dueAt: Date,

    requiredDeliverables: { type: [DeliverableSchema], default: [] },

    // Embedded assignments (one task → many assignees)
    assignments: { type: [AssignmentSchema], default: [] },
    
    // Optional overall status
    status: { type: String, default: "ASSIGNED" },
    
    // Creator
    assignedBy: { type: Types.ObjectId, ref: "User" }
  },
  { timestamps: true }
);

// Minimal indexes to keep common queries fast
TaskSchema.index({ departmentId: 1, status: 1 });
TaskSchema.index({ dueAt: 1 });
TaskSchema.index({ "assignments.userId": 1 });
TaskSchema.index({ "assignments.reviewerUserId": 1 });
TaskSchema.index({ "assignments.departmentId": 1, "assignments.assignedRole": 1 });

export default models.Task || model("Task", TaskSchema);
