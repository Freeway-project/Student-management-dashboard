// src/models/Comment.ts
import { Schema, model, models, Types } from "mongoose";
const CommentSchema = new Schema({
  taskId:       { type: Types.ObjectId, ref: "Task", index: true },
  submissionId: { type: Types.ObjectId, ref: "Submission", index: true },
  authorId:     { type: Types.ObjectId, ref: "User", required: true, index: true },
  body:         { type: String, required: true },
  attachments:  [{ type: Types.ObjectId, ref: "FileObject" }],
}, { timestamps: true });

export default models.Comment || model("Comment", CommentSchema);