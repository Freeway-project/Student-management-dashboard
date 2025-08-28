import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Task from '@/models/Task';
import TaskAssignment from '@/models/TaskAssignment';
import { ObjectId } from 'mongodb';

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB();
    
    const { id: taskId } = params;
    const body = await req.json();
    const { status } = body;

    // Validate task ID
    if (!ObjectId.isValid(taskId)) {
      return NextResponse.json(
        { error: 'Invalid task ID' },
        { status: 400 }
      );
    }

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

      // Also update corresponding TaskAssignment status
      const assignmentStatus = status === 'SUBMITTED' ? 'IN_REVIEW' : 'NOT_SUBMITTED';
      await TaskAssignment.updateMany(
        { taskId: taskId },
        { 
          status: assignmentStatus,
          lastSubmittedAt: status === 'SUBMITTED' ? new Date() : undefined
        }
      );
    }

    // Populate the task with related data for response
    await task.populate('assignedBy', 'name email role');
    await task.populate('assignedTo', 'name email role');

    return NextResponse.json({ 
      message: 'Task updated successfully',
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
      }
    });

  } catch (error) {
    console.error('Task update error:', error);
    return NextResponse.json(
      { error: 'Failed to update task' },
      { status: 500 }
    );
  }
}

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB();
    
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
      }
    });

  } catch (error) {
    console.error('Task fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch task' },
      { status: 500 }
    );
  }
}