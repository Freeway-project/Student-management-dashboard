// models/Task.ts
import { Schema, model, models, Types } from "mongoose";
import { TaskStatus } from "./enums";

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
  },

);

const TaskSchema = new Schema(
  {
    departmentId: { type: Types.ObjectId, ref: "Department" },
    
    title: { type: String, required: true },
    description: { type: String, required: true },
    instructions: String,

    priority: { type: String, enum: Priority, default: "MEDIUM" },
    dueAt: Date,

    requiredDeliverables: { type: [DeliverableSchema], default: [] },

    // Current assignees
    assignedTo: [{ type: Types.ObjectId, ref: "User", required: true }],
    
    // Who assigned this task
    assignedBy: { type: Types.ObjectId, ref: "User", required: true },

    status: { type: String, enum: TaskStatus, default: "ASSIGNED" },
  },
  { timestamps: true }
);

TaskSchema.index({ departmentId: 1, status: 1 });
TaskSchema.index({ dueAt: 1 });
TaskSchema.index({ assignedTo: 1 });
TaskSchema.index({ assignedBy: 1 });

export default models.Task || model("Task", TaskSchema);
