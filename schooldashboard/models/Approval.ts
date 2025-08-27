import { Schema, model, models, Types } from "mongoose";
import { ApprovalAction } from "./enums";

const ApprovalSchema = new Schema({
  // What's being approved
  taskId: { type: Types.ObjectId, ref: "Task", required: true },
  submissionId: { type: Types.ObjectId, ref: "Submission", required: true },
  
  // Approval workflow info
  level: { type: Number, required: true }, // 1, 2, 3... for multi-level approvals
  approvalOrder: Number, // For ordering approvals at the same level
  
  // Who needs to approve and who did approve
  requiredApproverId: { type: Types.ObjectId, ref: "User", required: true },
  requiredRole: String, // The role that needs to approve (for validation)
  actualApproverId: { type: Types.ObjectId, ref: "User" }, // Who actually approved (if different)
  
  // Approval decision
  action: { 
    type: String, 
    enum: ["APPROVE", "REJECT", "REQUEST_REVISION", "FORWARD"],
    required: function() { return this.status === "COMPLETED"; }
  },
  status: { 
    type: String, 
    enum: ["PENDING", "COMPLETED", "SKIPPED", "EXPIRED"],
    default: "PENDING" 
  },
  
  // Feedback and comments
  feedback: String, // Detailed feedback from approver
  publicComment: String, // Comment visible to task creator
  privateComment: String, // Internal comment for supervisors only
  
  // Revision requests
  revisionRequests: [{
    category: String, // e.g., "Content", "Format", "Data"
    description: String,
    priority: { type: String, enum: ["LOW", "MEDIUM", "HIGH"], default: "MEDIUM" },
    resolved: { type: Boolean, default: false }
  }],
  
  // Timeline
  assignedAt: { type: Date, default: Date.now },
  dueDate: Date,
  completedAt: Date,
  remindersSent: [Date], // Track when reminders were sent
  
  // Delegation and substitution
  delegatedTo: { type: Types.ObjectId, ref: "User" },
  delegatedBy: { type: Types.ObjectId, ref: "User" },
  delegationReason: String,
  delegatedAt: Date,
  
  // Approval conditions
  conditions: [{
    description: String,
    met: { type: Boolean, default: false },
    evidence: String // Evidence that condition is met
  }],
  
  // Workflow routing
  forwardedTo: { type: Types.ObjectId, ref: "User" },
  forwardedReason: String,
  forwardedAt: Date,
  
  // Attachments and evidence
  attachments: [{
    filename: String,
    originalName: String,
    mimeType: String,
    size: Number,
    uploadedAt: { type: Date, default: Date.now },
    driveFileId: String
  }],
  
  // Scoring and evaluation (if used)
  score: Number,
  maxScore: Number,
  evaluationCriteria: [{
    criterion: String,
    score: Number,
    maxScore: Number,
    weight: Number,
    comments: String
  }],
  
  // Department and organizational context
  departmentId: { type: Types.ObjectId, ref: "Department", required: true },
  
  // Additional metadata
  metadata: { type: Schema.Types.Mixed, default: {} },
  
  // Soft delete
  deletedAt: { type: Date, default: null },
  deletedBy: { type: Types.ObjectId, ref: "User" }
}, { 
  timestamps: true,
  indexes: [
    { taskId: 1 },
    { submissionId: 1 },
    { requiredApproverId: 1 },
    { status: 1 },
    { level: 1 },
    { dueDate: 1 },
    { completedAt: -1 },
    { departmentId: 1 },
    // Compound indexes for common queries
    { taskId: 1, level: 1, status: 1 },
    { requiredApproverId: 1, status: 1, dueDate: 1 }
  ]
});

// Virtual for checking if approval is overdue
ApprovalSchema.virtual('isOverdue').get(function() {
  return this.dueDate && 
         new Date() > this.dueDate && 
         this.status === 'PENDING';
});

// Virtual for days remaining
ApprovalSchema.virtual('daysRemaining').get(function() {
  if (!this.dueDate) return null;
  const now = new Date();
  const due = new Date(this.dueDate);
  const diffTime = due.getTime() - now.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});

// Instance methods
ApprovalSchema.methods.canUserApprove = function(userId: string, userRole: string) {
  // Check if user can approve this item
  if (this.status !== 'PENDING') return false;
  if (this.requiredApproverId.equals(userId)) return true;
  if (this.delegatedTo && this.delegatedTo.equals(userId)) return true;
  
  // Role-based approval rights
  if (this.requiredRole && userRole === this.requiredRole) return true;
  
  // Higher-level roles can approve lower-level approvals
  const hierarchy = ['PROFESSOR', 'COORDINATOR', 'HOD', 'VICE_CHAIRMAN', 'CHAIRMAN'];
  const userLevel = hierarchy.indexOf(userRole);
  const requiredLevel = hierarchy.indexOf(this.requiredRole);
  
  return userLevel > requiredLevel;
};

ApprovalSchema.methods.complete = function(userId: string, action: string, feedback?: string) {
  this.actualApproverId = userId;
  this.action = action;
  this.status = 'COMPLETED';
  this.completedAt = new Date();
  if (feedback) this.feedback = feedback;
  return this.save();
};

ApprovalSchema.methods.delegate = function(fromUserId: string, toUserId: string, reason: string) {
  this.delegatedBy = fromUserId;
  this.delegatedTo = toUserId;
  this.delegationReason = reason;
  this.delegatedAt = new Date();
  return this.save();
};

export default models.Approval || model("Approval", ApprovalSchema);