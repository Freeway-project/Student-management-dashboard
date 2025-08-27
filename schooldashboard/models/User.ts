import { Schema, model, models, Types } from "mongoose";
import { Role, UserStatus } from "./enums";
import Department from '@/models/Department';
const UserSchema = new Schema({
  // Basic user info
  name: { type: String, required: true },
  email: { type: String, unique: true, index: true, required: true },
  passwordHash: { type: String, required: true },
  
  // Role and hierarchy
  role: { 
    type: String, 
    enum: ["PROGRAM_ADMIN", "CHAIRMAN", "VICE_CHAIRMAN", "HOD", "COORDINATOR", "PROFESSOR"], 
    required: true 
  },
  

  
  // Department association
  departmentId: { type: Types.ObjectId, ref: "Department", required: false },
  
  // Simple hierarchy
  supervisorId: { type: Types.ObjectId, ref: "User", default: null },
  
  // Contact info (optional)
  phone: String,
  bio: String,
  
  // Login tracking
  lastLoginAt: Date,
  
  // Additional data
  metadata: { type: Schema.Types.Mixed, default: {} },
  
  // Admin management
  createdBy: { type: Types.ObjectId, ref: "User" },
  
  // Soft delete
  deletedAt: { type: Date, default: null },
  deletedBy: { type: Types.ObjectId, ref: "User" }
}, { 
  timestamps: true,
  indexes: [
    { email: 1 },
    { role: 1 },
    { departmentId: 1 },
    { supervisorId: 1 },

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
  
  const canApproveRoles = approvalHierarchy[taskCreatorRole as keyof typeof approvalHierarchy];
  if (!canApproveRoles) {
    return false;
  }
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
