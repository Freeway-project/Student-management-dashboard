// Updated role hierarchy for faculty workflow system
export const Roles = [
  "PROGRAM_ADMIN",

  "CHAIRMAN",
  "VICE_CHAIRMAN",
  "HOD",
  "COORDINATOR",
  "PROFESSOR"
] as const;
export type Role = typeof Roles[number];

// Task workflow statuses
export const TaskStatus = [
  "DRAFT",          // Task created but not assigned
  "ASSIGNED",       // Assigned to professor
  "IN_PROGRESS",    // Professor working on it
  "SUBMITTED",      // Professor submitted
  "UNDER_REVIEW",   // Being reviewed by supervisor
  "REVISION_REQUESTED", // Needs changes
  "APPROVED",       // Approved at current level
  "FORWARDED",      // Sent to next level
  "FINAL_APPROVED", // Fully approved
  "REJECTED",       // Rejected
  "ARCHIVED"        // Closed/archived
] as const;
export type TaskStatus = typeof TaskStatus[number];

// Submission types
export const SubmissionType = [
  "INITIAL",
  "REVISION",
  "FINAL"
] as const;
export type SubmissionType = typeof SubmissionType[number];

// Approval actions
export const ApprovalAction = [
  "APPROVE",
  "REJECT", 
  "REQUEST_REVISION",
  "FORWARD"
] as const;
export type ApprovalAction = typeof ApprovalAction[number];

// User statuses
export const UserStatus = [
  "ACTIVE",
  "INACTIVE", 
  "SUSPENDED"
] as const;
export type UserStatus = typeof UserStatus[number];