import { Schema, model, models, Types } from "mongoose";

const DepartmentSchema = new Schema({
  // Basic department info
  name: { type: String, required: true },
  code: { type: String, required: true, unique: true }, // e.g., "CS", "EE", "ME"
  description: String,
  
  // Hierarchy - departments can have sub-departments
  parentDepartmentId: { type: Types.ObjectId, ref: "Department", default: null },
  
  // Leadership
  hodId: { type: Types.ObjectId, ref: "User" }, // Head of Department
  coordinatorIds: [{ type: Types.ObjectId, ref: "User" }], // Multiple coordinators possible
  
  // Status and settings
  isActive: { type: Boolean, default: true },
  settings: { type: Schema.Types.Mixed, default: {} },
  
  // Contact and location info
  email: String,
  phone: String,
  location: String,
  
  // Metadata
  establishedDate: Date,
  metadata: { type: Schema.Types.Mixed, default: {} },
  
  // Soft delete
  deletedAt: { type: Date, default: null },
  deletedBy: { type: Types.ObjectId, ref: "User" }
}, { 
  timestamps: true,
  indexes: [
    { code: 1 },
    { name: 1 },
    { parentDepartmentId: 1 },
    { hodId: 1 },
    { isActive: 1 }
  ]
});

// Virtual for getting all sub-departments
DepartmentSchema.virtual('subDepartments', {
  ref: 'Department',
  localField: '_id',
  foreignField: 'parentDepartmentId'
});

// Virtual for getting all users in this department
DepartmentSchema.virtual('users', {
  ref: 'User',
  localField: '_id',
  foreignField: 'departmentId'
});

// Instance methods
DepartmentSchema.methods.getHierarchyPath = function() {
  // Returns array of department IDs from root to current
  // Implementation would traverse up the parent chain
  return [];
};

DepartmentSchema.methods.getAllSubDepartmentIds = function() {
  // Returns flat array of all sub-department IDs (recursive)
  return [];
};

export default models.Department || model("Department", DepartmentSchema);