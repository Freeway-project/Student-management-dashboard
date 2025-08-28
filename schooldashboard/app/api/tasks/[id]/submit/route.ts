import { NextRequest, NextResponse } from 'next/server';
import Task from '@/models/Task';
import Submission from '@/models/Submission';
import TaskAssignment from '@/models/TaskAssignment';
import connectDB from '@/lib/mongodb';

export async function POST(
  req: NextRequest,
  context: RouteHandlerContext<{ id: string }>
) {
  const { params } = context;
  try {
    await connectDB();
    
    const { id: taskId } = params;
    const body = await req.json();
    const { status, deliverables, message } = body;

    // Find the task
    const task = await Task.findById(taskId);
    if (!task) {
      return NextResponse.json(
        { error: 'Task not found' },
        { status: 404 }
      );
    }

    // Update task status
    if (status) {
      task.status = status;
      await task.save();
    }

    // Create submission record if deliverables are provided
    if (deliverables && deliverables.length > 0) {
      // Check if there's an existing submission
      const existingSubmission = await Submission.findOne({
        taskId,
        submittedBy: req.headers.get('x-user-id'), // You'll need to pass user ID in headers
        isLatestVersion: true
      });

      const submissionData = {
        taskId,
        submittedBy: req.headers.get('x-user-id'), // You'll need to pass user ID in headers
        submissionType: existingSubmission ? 'REVISION' : 'INITIAL',
        version: existingSubmission ? existingSubmission.version + 1 : 1,
        title: `${task.title} - Submission`,
        description: message || undefined,
        notes: message || undefined,
        status: 'SUBMITTED',
        submittedAt: new Date(),
        deliverables
      };

      // Mark existing submission as not latest
      if (existingSubmission) {
        existingSubmission.isLatestVersion = false;
        await existingSubmission.save();
      }

      // Save new submission
      const newSubmission = new Submission(submissionData);
      await newSubmission.save();

      // Update task assignment status
      await TaskAssignment.updateOne(
        { taskId, userId: req.headers.get('x-user-id') },
        { status: 'SUBMITTED' }
      );
    }

    return NextResponse.json({ message: 'Submission successful' });

  } catch (error) {
    console.error('Submission error:', error);
    return NextResponse.json(
      { error: 'Failed to submit task' },
      { status: 500 }
    );
  }
}