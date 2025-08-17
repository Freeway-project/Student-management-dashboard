// src/models/enums.ts
export const Roles = [
  "STUDENT","TEACHER","HEAD","COLLEGE_QC","VICE_DEAN","DEAN","ADMIN"
] as const;
export type Role = typeof Roles[number];

export const TaskStatus = [
  // mirrors PDF actions/states
  "ASSIGNED",      // created/assigned
  "SUBMITTED",     // submit done
  "PENDING_REVIEW",// waiting for reviewer (Head/QC/etc.)
  "REVISE",        // sent back (Revise/Redirect)
  "UPDATED",       // re-submitted after revise
  "FORWARDED",     // forwarded upward (with optional comment/attachment)
  "APPROVED",      // final approve
  "CLOSED"         // archived/closed
] as const;
export type TaskStatus = typeof TaskStatus[number];