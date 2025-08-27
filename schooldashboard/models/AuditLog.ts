import { Schema, model, models, Types } from "mongoose";

const AuditLogSchema = new Schema({
  // What happened
  action: { type: String, required: true, index: true }, // e.g., "CREATE_TASK", "APPROVE_SUBMISSION", "UPDATE_USER"
  entity: { type: String, required: true, index: true }, // e.g., "Task", "User", "Submission"
  entityId: { type: Types.ObjectId, required: true, index: true }, // ID of the affected entity
  
  // Who did it
  userId: { type: Types.ObjectId, ref: "User", required: true, index: true },
  userRole: { type: String, required: true }, // Role at time of action
  userEmail: String, // Cached for historical records
  userName: String, // Cached for historical records
  
  // When and where
  timestamp: { type: Date, default: Date.now, index: true },
  ipAddress: String,
  userAgent: String,
  sessionId: String,
  
  // Context information
  departmentId: { type: Types.ObjectId, ref: "Department", index: true },
  organizationContext: String, // Additional organizational context
  
  // What changed
  changes: [{
    field: String,
    oldValue: Schema.Types.Mixed,
    newValue: Schema.Types.Mixed
  }],
  
  // Additional details
  description: String, // Human-readable description of the action
  metadata: { type: Schema.Types.Mixed, default: {} }, // Additional context data
  
  // Related entities (for complex operations)
  relatedEntities: [{
    type: String, // Entity type
    id: Types.ObjectId, // Entity ID
    relationship: String // How it's related to the main entity
  }],
  
  // Risk and compliance
  riskLevel: { type: String, enum: ["LOW", "MEDIUM", "HIGH", "CRITICAL"], default: "LOW" },
  complianceFlags: [String], // e.g., ["GDPR", "SOX", "HIPAA"]
  
  // System information
  applicationVersion: String,
  module: String, // Which part of the system
  feature: String, // Specific feature used
  
  // Result and outcome
  success: { type: Boolean, default: true },
  errorMessage: String, // If action failed
  errorCode: String,
  
  // Additional security context
  authMethod: String, // How user was authenticated
  permissions: [String], // User permissions at time of action
  
  // Batch operation context
  batchId: String, // For grouping related actions
  batchSequence: Number, // Order within batch
  
  // Retention and archival
  retentionDate: Date, // When this log can be deleted
  archived: { type: Boolean, default: false },
  archivedAt: Date
}, { 
  timestamps: true,
  // Optimize for common query patterns
  indexes: [
    { timestamp: -1 }, // Most recent first
    { userId: 1, timestamp: -1 }, // User activity timeline
    { entity: 1, entityId: 1, timestamp: -1 }, // Entity change history
    { action: 1, timestamp: -1 }, // Action-based queries
    { departmentId: 1, timestamp: -1 }, // Department activity
    { riskLevel: 1, timestamp: -1 }, // Security monitoring
    { success: 1, timestamp: -1 }, // Error tracking
    { batchId: 1, batchSequence: 1 }, // Batch operations
    
    // Compound indexes for complex queries
    { entity: 1, action: 1, timestamp: -1 },
    { userId: 1, entity: 1, timestamp: -1 },
    { departmentId: 1, entity: 1, timestamp: -1 },
    { riskLevel: 1, entity: 1, timestamp: -1 }
  ],
  
  // Optimize storage for high-volume logging
  capped: false, // Set to true with size limit if needed
  
  // Add MongoDB time-series collection optimization if available
  timeseries: {
    timeField: 'timestamp',
    metaField: 'userId',
    granularity: 'minutes'
  }
});

// Pre-save middleware to set retention date
AuditLogSchema.pre('save', function(next) {
  if (!this.retentionDate) {
    // Default retention: 7 years for compliance
    const retentionDate = new Date();
    retentionDate.setFullYear(retentionDate.getFullYear() + 7);
    this.retentionDate = retentionDate;
  }
  next();
});

// Static methods for common logging patterns
AuditLogSchema.statics.logUserAction = function(
  userId: string, 
  action: string, 
  entity: string, 
  entityId: string, 
  details: any = {}
) {
  return this.create({
    userId,
    action,
    entity,
    entityId,
    ...details
  });
};

AuditLogSchema.statics.logTaskAction = function(
  userId: string, 
  action: string, 
  taskId: string, 
  changes: any[] = [],
  metadata: any = {}
) {
  return this.create({
    userId,
    action,
    entity: 'Task',
    entityId: taskId,
    changes,
    metadata
  });
};

AuditLogSchema.statics.logApprovalAction = function(
  userId: string, 
  action: string, 
  approvalId: string, 
  submissionId: string,
  decision: string,
  feedback?: string
) {
  return this.create({
    userId,
    action,
    entity: 'Approval',
    entityId: approvalId,
    relatedEntities: [{ type: 'Submission', id: submissionId, relationship: 'approves' }],
    metadata: { decision, feedback }
  });
};

// Instance methods
AuditLogSchema.methods.anonymize = function() {
  // Remove personally identifiable information for compliance
  this.userEmail = '[REDACTED]';
  this.userName = '[REDACTED]';
  this.ipAddress = '[REDACTED]';
  this.userAgent = '[REDACTED]';
  return this.save();
};

AuditLogSchema.methods.archive = function() {
  this.archived = true;
  this.archivedAt = new Date();
  return this.save();
};

// Virtual for human-readable timestamp
AuditLogSchema.virtual('displayTimestamp').get(function() {
  return this.timestamp.toLocaleString();
});

// Virtual for time since action
AuditLogSchema.virtual('timeAgo').get(function() {
  const now = new Date();
  const diffMs = now.getTime() - this.timestamp.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  
  if (diffDays < 1) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 30) return `${diffDays} days ago`;
  if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
  return `${Math.floor(diffDays / 365)} years ago`;
});

export default models.AuditLog || model("AuditLog", AuditLogSchema);