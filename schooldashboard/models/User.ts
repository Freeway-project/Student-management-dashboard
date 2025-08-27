import { Schema, model, models, Types } from "mongoose";
import { Role, UserStatus, InvitationStatus } from "./enums";

const UserSchema = new Schema({
  // Basic user info
  name: { type: String, required: true },
  email: { type: String, unique: true, index: true, required: true },
  passwordHash: String, // null for users who haven't set password yet
  
  // Role and hierarchy
  role: { 
    type: String, 
    enum: ["PROGRAM_ADMIN", "COMPANY_ADMIN", "CHAIRMAN", "VICE_CHAIRMAN", "HOD", "COORDINATOR", "PROFESSOR", "STUDENT"], 
    required: true 
  },
  
  // Status management
  status: { 
    type: String, 
    enum: ["ACTIVE", "INACTIVE", "SUSPENDED", "PENDING_ACTIVATION"], 
    default: "PENDING_ACTIVATION" 
  },
  
  // Department association
  departmentId: { type: Types.ObjectId, ref: "Department", required: true },
  
  // Hierarchy relationships
  supervisorId: { type: Types.ObjectId, ref: "User", default: null },
  reportingTo: [{ type: Types.ObjectId, ref: "User" }], // Multiple reporting relationships
  
  // Invitation management
  invitationStatus: { 
    type: String, 
    enum: ["PENDING", "ACCEPTED", "EXPIRED"], 
    default: "PENDING" 
  },
  invitationToken: String, // For password reset/initial setup
  invitationExpiresAt: Date,
  invitedBy: { type: Types.ObjectId, ref: "User" },
  
  // Contact and profile info
  phone: String,
  address: String,
  bio: String,
  
  // Access control
  permissions: [String], // Array of permission strings
  lastLoginAt: Date,
  
  // Additional flexible data
  metadata: { type: Schema.Types.Mixed, default: {} },
  
  // Soft delete
  deletedAt: { type: Date, default: null },
  deletedBy: { type: Types.ObjectId, ref: "User" }
}, { 
  timestamps: true,
  // Add indexes for performance
  indexes: [
    { email: 1 },
    { role: 1 },
    { departmentId: 1 },
    { supervisorId: 1 },
    { status: 1 },
    { invitationToken: 1 }
  ]
});

// Virtual for full hierarchy path
UserSchema.virtual('hierarchyPath').get(function() {
  // Will be populated with actual hierarchy logic
  return [];
});

// Pre-save middleware to handle email normalization
UserSchema.pre('save', function(next) {
  if (this.email) {
    this.email = this.email.toLowerCase().trim();
  }
  next();
});

// Instance methods
UserSchema.methods.canApprove = function(taskCreatorRole: Role): boolean {
  // Define approval hierarchy logic
  const approvalHierarchy = {
    'PROFESSOR': ['COORDINATOR', 'HOD', 'VICE_CHAIRMAN', 'CHAIRMAN'],
    'COORDINATOR': ['HOD', 'VICE_CHAIRMAN', 'CHAIRMAN'],
    'HOD': ['VICE_CHAIRMAN', 'CHAIRMAN'],
    'VICE_CHAIRMAN': ['CHAIRMAN'],
    'CHAIRMAN': []
  };
  
  const canApproveRoles = approvalHierarchy[taskCreatorRole as keyof typeof approvalHierarchy] || [];
  return canApproveRoles.includes(this.role);
};

UserSchema.methods.canViewUser = function(targetUser: any): boolean {
  // Visibility rules based on role hierarchy
  if (this.role === 'CHAIRMAN') return true;
  if (this.role === 'VICE_CHAIRMAN') {
    // Vice-Chairman can see professors only (not Chairman's data)
    return targetUser.role === 'PROFESSOR' || targetUser.role === 'COORDINATOR' || targetUser.role === 'HOD';
  }
  if (this.role === 'HOD') {
    return targetUser.departmentId.equals(this.departmentId) && 
           ['PROFESSOR', 'COORDINATOR'].includes(targetUser.role);
  }
  if (this.role === 'COORDINATOR') {
    return targetUser.departmentId.equals(this.departmentId) && targetUser.role === 'PROFESSOR';
  }
  return targetUser._id.equals(this._id); // Can only see themselves
};

export default models.User || model("User", UserSchema);
