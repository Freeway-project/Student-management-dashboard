import { Schema, model, models, Types } from "mongoose";
import { TaskStatus } from "./enums";

const TaskSchema = new Schema({
  // Basic task info
  title: { type: String, required: true },
  description: { type: String, required: true },
  instructions: String, // Detailed instructions for the professor
  
  // Task metadata
  type: String, // e.g., "research", "teaching", "administrative"
  category: String, // Custom categorization
  priority: { type: String, enum: ["LOW", "MEDIUM", "HIGH", "URGENT"], default: "MEDIUM" },
  
  // Assignment info
  assignedTo: { type: Types.ObjectId, ref: "User", required: true }, // Professor
  assignedBy: { type: Types.ObjectId, ref: "User", required: true }, // Creator
  departmentId: { type: Types.ObjectId, ref: "Department", required: true },
  
  // Workflow status
  status: { 
    type: String, 
    enum: ["DRAFT", "ASSIGNED", "IN_PROGRESS", "SUBMITTED", "UNDER_REVIEW", 
           "REVISION_REQUESTED", "APPROVED", "FORWARDED", "FINAL_APPROVED", 
           "REJECTED", "ARCHIVED"],
    default: "DRAFT" 
  },
  
  // Timeline
  dueDate: Date,
  startDate: Date,
  completedAt: Date,
  
  // Current workflow position
  currentReviewerIds: [{ type: Types.ObjectId, ref: "User" }], // Who needs to review now
  reviewerHistory: [{
    userId: { type: Types.ObjectId, ref: "User" },
    action: String,
    timestamp: Date,
    comments: String
  }],
  
  // Requirements and deliverables
  requiredDeliverables: [{
    name: String,
    description: String,
    required: { type: Boolean, default: true }
  }],
  
  // Attachments and resources
  attachments: [{
    filename: String,
    originalName: String,
    mimeType: String,
    size: Number,
    uploadedBy: { type: Types.ObjectId, ref: "User" },
    uploadedAt: { type: Date, default: Date.now },
    driveFileId: String // Google Drive file ID if using Drive integration
  }],
  
  // Progress tracking
  progressNotes: String,
  completionPercentage: { type: Number, default: 0, min: 0, max: 100 },
  
  // Approval workflow
  approvalWorkflow: [{
    level: Number, // 1, 2, 3... for multi-level approval
    roleRequired: String, // Role that needs to approve at this level
    userId: { type: Types.ObjectId, ref: "User" }, // Specific user if assigned
    status: { type: String, enum: ["PENDING", "APPROVED", "REJECTED"], default: "PENDING" },
    approvedAt: Date,
    approvedBy: { type: Types.ObjectId, ref: "User" },
    comments: String
  }],
  
  // Tags and labels
  tags: [String],
  labels: [String],
  
  // Notifications and reminders
  remindersSent: [{
    type: String, // "DUE_SOON", "OVERDUE", etc.
    sentAt: Date,
    sentTo: [{ type: Types.ObjectId, ref: "User" }]
  }],
  
  // Additional metadata
  metadata: { type: Schema.Types.Mixed, default: {} },
  
  // Soft delete
  deletedAt: { type: Date, default: null },
  deletedBy: { type: Types.ObjectId, ref: "User" }
}, { 
  timestamps: true,
  indexes: [
    { assignedTo: 1 },
    { assignedBy: 1 },
    { departmentId: 1 },
    { status: 1 },
    { dueDate: 1 },
    { "currentReviewerIds": 1 },
    { tags: 1 },
    { createdAt: -1 }
  ]
});

// Virtual for overdue status
TaskSchema.virtual('isOverdue').get(function() {
  return this.dueDate && new Date() > this.dueDate && !['FINAL_APPROVED', 'ARCHIVED', 'REJECTED'].includes(this.status);
});

// Virtual for time remaining
TaskSchema.virtual('timeRemaining').get(function() {
  if (!this.dueDate) return null;
  const now = new Date();
  const due = new Date(this.dueDate);
  return due.getTime() - now.getTime(); // milliseconds
});

// Instance methods
TaskSchema.methods.getNextApprovalLevel = function() {
  const pendingApprovals = this.approvalWorkflow.filter(a => a.status === 'PENDING');
  return pendingApprovals.length > 0 ? pendingApprovals[0] : null;
};

TaskSchema.methods.canUserView = function(userId: string, userRole: string) {
  // Task visibility logic based on user role and relationship
  if (this.assignedTo.equals(userId)) return true;
  if (this.assignedBy.equals(userId)) return true;
  if (this.currentReviewerIds.some((id: any) => id.equals(userId))) return true;
  if (['CHAIRMAN', 'VICE_CHAIRMAN'].includes(userRole)) return true;
  return false;
};

TaskSchema.methods.canUserEdit = function(userId: string, userRole: string) {
  // Edit permissions logic
  if (this.assignedBy.equals(userId) && ['DRAFT', 'REVISION_REQUESTED'].includes(this.status)) return true;
  if (this.assignedTo.equals(userId) && ['ASSIGNED', 'IN_PROGRESS', 'REVISION_REQUESTED'].includes(this.status)) return true;
  if (['CHAIRMAN', 'COMPANY_ADMIN', 'PROGRAM_ADMIN'].includes(userRole)) return true;
  return false;
};

export default models.Task || model("Task", TaskSchema);