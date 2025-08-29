import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Task from '@/models/Task';
import Submission from '@/models/Submission';
import TaskAssignment from '@/models/TaskAssignment';
import { ObjectId } from 'mongodb';

export async function GET(req: NextRequest, context: any) {
  try {
    await connectDB();
    const { params } = context;
    const { id: taskId } = params;

    // Validate task ID
    if (!ObjectId.isValid(taskId)) {
      return NextResponse.json(
        { error: 'Invalid task ID' },
        { status: 400 }
      );
    }

    // Find the task
    const task = await Task.findById(taskId)
      .populate('assignedBy', 'name email role')
      .populate('assignedTo', 'name email role');

    if (!task) {
      return NextResponse.json(
        { error: 'Task not found' },
        { status: 404 }
      );
    }

    // Get all submissions for this task
    const submissions = await Submission.find({ taskId })
      .populate('submittedBy', 'name email role')
      .populate('reviewedBy', 'name email role')
      .sort({ submittedAt: -1 });

    // Get task assignments to show who hasn't submitted yet
    const taskAssignments = await TaskAssignment.find({ taskId })
      .populate('assigneeUserId', 'name email role')
      .populate('assignedByUserId', 'name email role');

    return NextResponse.json({
      task: {
        _id: task._id,
        title: task.title,
        description: task.description,
        instructions: task.instructions,
        priority: task.priority,
        status: task.status,
        dueAt: task.dueAt,
        assignedBy: task.assignedBy,
        assignedTo: task.assignedTo,
        requiredDeliverables: task.requiredDeliverables,
        createdAt: task.createdAt,
        updatedAt: task.updatedAt
      },
      submissions: submissions.map(sub => ({
        _id: sub._id,
        submittedBy: sub.submittedBy,
        submissionType: sub.submissionType,
        version: sub.version,
        title: sub.title,
        description: sub.description,
        content: sub.content,
        notes: sub.notes,
        attachments: sub.attachments,
        status: sub.status,
        submittedAt: sub.submittedAt,
        reviewedBy: sub.reviewedBy,
        reviewFeedback: sub.reviewFeedback,
        reviewScore: sub.reviewScore,
        createdAt: sub.createdAt,
        updatedAt: sub.updatedAt
      })),
      assignments: taskAssignments.map(assignment => ({
        _id: assignment._id,
        assignee: assignment.assigneeUserId,
        assigneeRole: assignment.assigneeRoleAtAssign,
        status: assignment.status,
        lastSubmittedAt: assignment.lastSubmittedAt,
        attempts: assignment.attempts
      }))
    });

  } catch (error) {
    console.error('Task submissions fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch task submissions' },
      { status: 500 }
    );
  }
}