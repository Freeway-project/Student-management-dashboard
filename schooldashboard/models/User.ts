import { Schema, model, models, Types } from "mongoose";

const UserSchema = new Schema({
  // Basic user info
  name: { type: String, required: true },
  email: { type: String, unique: true, index: true, required: true },
  passwordHash: { type: String, required: true },
  
  // Multi-department roles (unified structure)
  departmentRoles: [{
    departmentId: { type: Types.ObjectId, ref: "Department" },
    roles: [String] // e.g. ["HOD"], ["PROFESSOR"], ["COORDINATOR"]
  }],
  
  // Legacy fields for backward compatibility
  role: String,
  departmentId: { type: Types.ObjectId, ref: "Department" },
  
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
    { "departmentRoles.departmentId": 1 },
    { "departmentRoles.roles": 1 }
  ]
});


// Pre-save middleware to handle email normalization
UserSchema.pre('save', function(next) {
  if (this.email) {
    this.email = this.email.toLowerCase().trim();
  }
  next();
});



// Simple helper methods for multi-department roles
UserSchema.methods.getRolesInDepartment = function(departmentId: any): string[] {
  // Check departmentRoles array
  const deptRole = this.departmentRoles.find((r: any) => 
    r.departmentId.equals(departmentId)
  );
  if (deptRole) return deptRole.roles;
  
  // Fallback to legacy fields for backward compatibility
  if (this.departmentId && this.departmentId.equals(departmentId) && this.role) {
    return [this.role];
  }
  
  return [];
};

UserSchema.methods.getAllDepartments = function(): any[] {
  const departments: any[] = [];
  
  // Get from departmentRoles
  this.departmentRoles.forEach((r: any) => {
    if (!departments.some((d: any) => d.equals(r.departmentId))) {
      departments.push(r.departmentId);
    }
  });
  
  // Add legacy department if not already included
  if (this.departmentId && !departments.some((d: any) => d.equals(this.departmentId))) {
    departments.push(this.departmentId);
  }
  
  return departments;
};

UserSchema.methods.canViewUser = function(targetUser: any): boolean {
  // Visibility rules based on role hierarchy
  if (this.role === 'CHAIRMAN') return true;
  if (this.role === 'VICE_CHAIRMAN') {
    // Vice-Chairman can see professors only (not Chairman's data)
    return targetUser.role === 'PROFESSOR' || targetUser.role === 'COORDINATOR' || targetUser.role === 'HOD';
  }
  if (this.role === 'HOD') {
    // HOD can see users in their primary department OR departments where they have HOD role
    const myDepartments = this.getAllDepartments();
    const targetDepartments = targetUser.getAllDepartments();
    const hasCommonDept = myDepartments.some((myDept: any) => 
      targetDepartments.some((targetDept: any) => targetDept.equals(myDept))
    );
    
    return hasCommonDept && ['PROFESSOR', 'COORDINATOR'].includes(targetUser.role);
  }
  if (this.role === 'COORDINATOR') {
    const myDepartments = this.getAllDepartments();
    const targetDepartments = targetUser.getAllDepartments();
    const hasCommonDept = myDepartments.some((myDept: any) => 
      targetDepartments.some((targetDept: any) => targetDept.equals(myDept))
    );
    
    return hasCommonDept && targetUser.role === 'PROFESSOR';
  }
  return targetUser._id.equals(this._id); // Can only see themselves
};

export default models.User || model("User", UserSchema);
