import { Schema, model, models, Types } from "mongoose";
import { SubmissionType } from "./enums";

const SubmissionSchema = new Schema({
  // Task relationship
  taskId: { type: Types.ObjectId, ref: "Task", required: true, index: true },
  
  // Submission info
  submittedBy: { type: Types.ObjectId, ref: "User", required: true },
  submissionType: { 
    type: String, 
    enum: ["INITIAL", "REVISION", "FINAL"], 
    default: "INITIAL" 
  },
  version: { type: Number, default: 1 }, // Incremental version number
  
  // Content
  title: String,
  description: String,
  content: String, // Main submission content/text
  notes: String, // Professor's notes with the submission
  
  // Files and attachments
  attachments: [{
    filename: String,
    originalName: String,
    mimeType: String,
    size: Number,
    uploadedAt: { type: Date, default: Date.now },
    driveFileId: String // Google Drive file ID
  }],
  
  // Status tracking
  status: { 
    type: String, 
    enum: ["DRAFT", "SUBMITTED", "UNDER_REVIEW", "APPROVED", "REVISION_REQUESTED", "REJECTED"],
    default: "DRAFT" 
  },
  
  // Timeline
  submittedAt: Date,
  reviewStartedAt: Date,
  reviewCompletedAt: Date,
  dueDate: Date, // If different from task due date
  
  // Review and feedback
  reviewedBy: { type: Types.ObjectId, ref: "User" },
  reviewFeedback: String,
  reviewScore: Number, // If scoring is used
  reviewCriteria: [{
    name: String,
    score: Number,
    feedback: String,
    maxScore: Number
  }],
  
  // Workflow tracking
  currentReviewLevel: Number, // Which approval level is being reviewed
  approvalHistory: [{
    level: Number,
    reviewerId: { type: Types.ObjectId, ref: "User" },
    action: String, // "APPROVED", "REJECTED", "REVISION_REQUESTED"
    feedback: String,
    timestamp: Date
  }],
  
  // Links to previous versions
  previousSubmissionId: { type: Types.ObjectId, ref: "Submission" },
  isLatestVersion: { type: Boolean, default: true },
  
  // Revision tracking
  revisionRequested: {
    by: { type: Types.ObjectId, ref: "User" },
    at: Date,
    reason: String,
    specificChanges: [String] // List of specific changes requested
  },
  
  // Collaboration
  collaborators: [{ type: Types.ObjectId, ref: "User" }],
  
  // Additional metadata
  metadata: { type: Schema.Types.Mixed, default: {} },
  
  // Soft delete
  deletedAt: { type: Date, default: null },
  deletedBy: { type: Types.ObjectId, ref: "User" }
}, { 
  timestamps: true,
  indexes: [
    { taskId: 1 },
    { submittedBy: 1 },
    { status: 1 },
    { submittedAt: -1 },
    { reviewedBy: 1 },
    { version: 1 },
    { isLatestVersion: 1 },
    { submissionType: 1 }
  ]
});

// Virtual for checking if overdue
SubmissionSchema.virtual('isOverdue').get(function() {
  return this.dueDate && new Date() > this.dueDate && !['APPROVED', 'REJECTED'].includes(this.status);
});

// Virtual for getting total review time
SubmissionSchema.virtual('reviewDuration').get(function() {
  if (!this.reviewStartedAt || !this.reviewCompletedAt) return null;
  return this.reviewCompletedAt.getTime() - this.reviewStartedAt.getTime();
});

// Instance methods
SubmissionSchema.methods.canUserView = function(userId: string, userRole: string) {
  // Visibility logic - submitter, reviewers, and supervisors can view
  if (this.submittedBy.equals(userId)) return true;
  if (this.reviewedBy && this.reviewedBy.equals(userId)) return true;
  if (this.collaborators.some((id: any) => id.equals(userId))) return true;
  if (['CHAIRMAN', 'VICE_CHAIRMAN', 'HOD', 'COORDINATOR'].includes(userRole)) return true;
  return false;
};

SubmissionSchema.methods.canUserEdit = function(userId: string, userRole: string) {
  // Edit permissions - only submitter can edit, and only in certain states
  if (!this.submittedBy.equals(userId)) return false;
  return ['DRAFT', 'REVISION_REQUESTED'].includes(this.status);
};

SubmissionSchema.methods.getNextVersion = function() {
  return this.version + 1;
};

export default models.Submission || model("Submission", SubmissionSchema);