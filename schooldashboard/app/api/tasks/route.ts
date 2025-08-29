import { NextRequest, NextResponse } from 'next/server';
import connectDB from '../../../lib/mongodb';
import Task from '../../../models/Task';
import TaskAssignment from '../../../models/TaskAssignment';
import User from '../../../models/User';
import { ObjectId } from 'mongodb';

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const body = await request.json();
    
    const { 
      title, 
      description, 
      instructions, 
      priority = "MEDIUM",
      dueAt,
      requiredDeliverables = [],
      assignedTo, // Array of user IDs
      assignedBy,
      departmentId 
    } = body;

    // Validate required fields
    if (!title || !description || !assignedBy || !assignedTo?.length) {
      return NextResponse.json(
        { error: 'Missing required fields: title, description, assignedBy, assignedTo' },
        { status: 400 }
      );
    }

    // Validate assignedBy is a valid ObjectId
    if (!ObjectId.isValid(assignedBy)) {
      return NextResponse.json(
        { error: 'Invalid assigner ID' },
        { status: 400 }
      );
    }

    // Verify assigner exists
    const assigner = await User.findById(assignedBy);
    if (!assigner) {
      return NextResponse.json(
        { error: 'Assigner not found' },
        { status: 404 }
      );
    }

    // Verify assignees exist
    const assignees = await User.find({ _id: { $in: assignedTo } });
    if (assignees.length !== assignedTo.length) {
      return NextResponse.json(
        { error: 'One or more assignees not found' },
        { status: 404 }
      );
    }

    // Validate requiredDeliverables
    if (!Array.isArray(requiredDeliverables)) {
      return NextResponse.json(
        { error: 'requiredDeliverables must be an array' },
        { status: 400 }
      );
    }



    // Create the task
    const task = new Task({
      title,
      description,
      instructions,
      priority,
      dueAt: dueAt ? new Date(dueAt) : undefined,
      requiredDeliverables,
      assignedTo,
      assignedBy,
      departmentId: departmentId || null,
      status: "ASSIGNED"
    });

    await task.save();

    // Create TaskAssignment records for each assignee
    const taskAssignments = assignees.map(assignee => ({
      taskId: task._id,
      assigneeUserId: assignee._id,
      assignedByUserId: assignedBy,
      assigneeRoleAtAssign: assignee.role,
      reviewerUserId: assignedBy,
      departmentId: departmentId || assignee.departmentId,
      status: "NOT_SUBMITTED"
    }));

    await TaskAssignment.insertMany(taskAssignments);

    return NextResponse.json({
      success: true,
      task: {
        id: task._id,
        title: task.title,
        status: task.status,
        assignedTo: assignees.map(a => ({ id: a._id, name: a.name, role: a.role })),
        assignedBy: { id: assigner._id, name: assigner.name, role: assigner.role }
      }
    });

  } catch (error) {
    console.error('Task creation error:', error);
    return NextResponse.json(
      { error: 'Failed to create task' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    console.log('GET /api/tasks called');

    await connectDB();
    console.log('Database connected');

    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get('userId');
    const role = searchParams.get('role');

    console.log('Query parameters:', { userId, role });

    if (!userId || !role) {
      console.error('Missing userId or role');
      return NextResponse.json(
        { error: 'userId and role are required' },
        { status: 400 }
      );
    }

    let tasks = [];

    if (role === 'CHAIRMAN' || role === 'VICE_CHAIRMAN') {
      console.log('Fetching tasks for role:', role);
      tasks = await Task.find({})
        .populate('assignedBy', 'name role')
        .populate('assignedTo', 'name role')
        .sort({ createdAt: -1 });
    } else if (role === 'HOD') {
      console.log('Fetching tasks for HOD');
      const user = await User.findById(userId);


      tasks = await Task.find({
        $or: [
          { departmentId: user.departmentId }, // Tasks in the HOD's department
          { assignedBy: userId }, // Tasks assigned by the HOD
          { assignedTo: { $in: await User.find({ departmentId: user.departmentId }).distinct('_id') } } // Tasks assigned to users in the department
        ]
      })
        .populate('assignedBy', 'name role')
        .populate('assignedTo', 'name role')
        .sort({ createdAt: -1 });
    } else if (role === 'COORDINATOR') {
      console.log('Fetching tasks for COORDINATOR');
      const user = await User.findById(userId);
      console.log('User details:', user);

      tasks = await Task.find({
        $or: [
          { assignedTo: { $in: [userId] } }, // Tasks assigned to the Coordinator
          { assignedBy: userId }, // Tasks assigned by the Coordinator
          { assignedTo: { $in: await User.find({ departmentId: user.departmentId, role: 'PROFESSOR' }).distinct('_id') } } 
        ]
      })
        .populate('assignedBy', 'name role')
        .populate('assignedTo', 'name role')
        .sort({ createdAt: -1 });

    } else if (role === 'PROFESSOR') {
      console.log('Fetching tasks for PROFESSOR');
      const baseTasks = await Task.find({ assignedTo: userId })
        .populate('assignedBy', 'name role')
        .populate('assignedTo', 'name role')
        .sort({ createdAt: -1 });

      const tasksWithMessages = await Promise.all(
        baseTasks.map(async (task) => {
          const assignment = await TaskAssignment.findOne({
            taskId: task._id,
            assigneeUserId: userId
          });

          return {
            ...task.toObject(),
            submissionMessage: assignment?.message || null
          };
        })
      );

      tasks = tasksWithMessages;
    }

    console.log('Fetched tasks:', tasks);
    return NextResponse.json({ tasks });

  } catch (error) {
    console.error('Task fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch tasks' },
      { status: 500 }
    );
  }
}