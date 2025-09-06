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
      assignedTo, // Array of user IDs (legacy)
      assignments, // Array of assignment objects (new structure)
      assignedBy,
      departmentId 
    } = body;

    // Support both new and legacy assignment structures
    const hasNewAssignments = assignments && Array.isArray(assignments) && assignments.length > 0;
    const hasLegacyAssignments = assignedTo && Array.isArray(assignedTo) && assignedTo.length > 0;

    // Validate required fields
    if (!title || !description || !assignedBy || (!hasNewAssignments && !hasLegacyAssignments)) {
      return NextResponse.json(
        { error: 'Missing required fields: title, description, assignedBy, and either assignedTo or assignments' },
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

    // Prepare assignee validation
    let assigneeIds = [];
    let assignmentData = [];

    if (hasNewAssignments) {
      // Extract user IDs from new assignments structure
      assigneeIds = assignments.map(assignment => assignment.userId);
      assignmentData = assignments;
    } else {
      // Use legacy assignedTo structure
      assigneeIds = assignedTo;
      assignmentData = assignedTo.map((userId: any) => ({
        userId: userId,
        departmentId: departmentId || null,
        assignedRole: null // Will be populated from user's primary role
      }));
    }

    // Verify assignees exist
    const assignees = await User.find({ _id: { $in: assigneeIds } });
    if (assignees.length !== assigneeIds.length) {
      return NextResponse.json(
        { error: 'One or more assignees not found' },
        { status: 404 }
      );
    }

    // Validate and filter requiredDeliverables
    if (!Array.isArray(requiredDeliverables)) {
      return NextResponse.json(
        { error: 'requiredDeliverables must be an array' },
        { status: 400 }
      );
    }

    // Filter out deliverables with empty or invalid labels
    const validDeliverables = requiredDeliverables.filter(deliverable => 
      deliverable && 
      deliverable.type && 
      deliverable.label && 
      deliverable.label.trim().length > 0
    );



    // Prepare assignments for the embedded structure
    const taskAssignments = assignmentData.map((assignment: any) => {
      const assignee = assignees.find(user => user._id.toString() === assignment.userId);
      return {
        userId: assignment.userId,
        departmentId: assignment.departmentId || assignee.departmentId,
        assignedRole: assignment.assignedRole || assignee.role,
        assignedByUserId: assignedBy,
        reviewerUserId: assignedBy,
        status: "NOT_SUBMITTED"
      };
    });

    // Create the task with embedded assignments
    const task = new Task({
      title,
      description,
      instructions,
      priority,
      dueAt: dueAt ? new Date(dueAt) : undefined,
      requiredDeliverables: validDeliverables,
      assignedTo: assigneeIds, // Keep for backward compatibility
      assignments: taskAssignments, // New embedded structure
      assignedBy,
      departmentId: departmentId || null,
      status: "ASSIGNED"
    });

    await task.save();

    // Create TaskAssignment records for each assignee (for backward compatibility)
    const taskAssignmentRecords = taskAssignments.map((assignment: any) => ({
      taskId: task._id,
      assigneeUserId: assignment.userId,
      assignedByUserId: assignedBy,
      assigneeRoleAtAssign: assignment.assignedRole,
      reviewerUserId: assignedBy,
      departmentId: assignment.departmentId,
      status: "NOT_SUBMITTED"
    }));

    await TaskAssignment.insertMany(taskAssignmentRecords);

    return NextResponse.json({
      success: true,
      task: {
        id: task._id,
        title: task.title,
        status: task.status,
        assignedTo: assignees.map(a => ({ id: a._id, name: a.name, role: a.role })), // Legacy
        assignments: taskAssignments.map((assignment: any) => {
          const assignee = assignees.find(user => user._id.toString() === assignment.userId);
          return {
            userId: assignment.userId,
            userName: assignee.name,
            departmentId: assignment.departmentId,
            assignedRole: assignment.assignedRole,
            status: assignment.status
          };
        }),
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
      let rawTasks;
      
      try {
        // Safer approach: fetch without assignedTo population first
        rawTasks = await Task.find({})
          .populate('assignedBy', 'name role')
          // Remove .populate('assignedTo') - handle manually
          .sort({ createdAt: -1 });
      } catch (populateError) {
        console.log('Task fetch failed:', populateError);
        return NextResponse.json(
          { error: 'Failed to fetch tasks' },
          { status: 500 }
        );
      }
      
      // Manually populate assignment user details and assignedTo if needed
      tasks = await Promise.all(
        rawTasks.map(async (task) => {
          const taskObj = task.toObject();
          
          // Handle new assignments structure
          if (taskObj.assignments && taskObj.assignments.length > 0) {
            const userIds = taskObj.assignments.map((assignment: any) => assignment.userId);
            const users = await User.find({ _id: { $in: userIds } }).select('name email role');
            
            taskObj.assignments = taskObj.assignments.map((assignment: any) => {
              const user = users.find(u => u._id.toString() === assignment.userId.toString());
              return {
                ...assignment,
                user: user ? { id: user._id, name: user.name, email: user.email, role: user.role } : null
              };
            });
          }
          
          // Handle legacy assignedTo - manually populate if not already populated
          if (taskObj.assignedTo && Array.isArray(taskObj.assignedTo) && taskObj.assignedTo.length > 0) {
            // Check if assignedTo is already populated (has name property) or just ObjectIds
            const firstAssignee = taskObj.assignedTo[0];
            if (firstAssignee && !firstAssignee.name) {
              // Not populated, manually populate
              const assignedUserIds = taskObj.assignedTo;
              const assignedUsers = await User.find({ _id: { $in: assignedUserIds } }).select('name email role');
              taskObj.assignedTo = assignedUsers.map(user => ({
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role
              }));
            }
          }
          
          return taskObj;
        })
      );
    } else if (role === 'HOD') {
      console.log('Fetching tasks for HOD');
      const user = await User.findById(userId);
      
      if (!user) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }

      // Get user's departments (both legacy and new structure)
      const userDepartmentIds = [];
      
      // Legacy department support
      if (user.departmentId) {
        userDepartmentIds.push(user.departmentId);
      }
      
      // New multi-department support
      if (user.departmentRoles && user.departmentRoles.length > 0) {
        user.departmentRoles.forEach((deptRole: any) => {
          if (!userDepartmentIds.includes(deptRole.departmentId)) {
            userDepartmentIds.push(deptRole.departmentId);
          }
        });
      }

      // Get users in HOD's departments
      const departmentUsers = await User.find({
        $or: [
          { departmentId: { $in: userDepartmentIds } },
          { 'departmentRoles.departmentId': { $in: userDepartmentIds } }
        ]
      }).distinct('_id');

      let rawTasks = await Task.find({
        $or: [
          { departmentId: { $in: userDepartmentIds } }, // Tasks in HOD's departments
          { assignedBy: userId }, // Tasks assigned by the HOD
          { assignedTo: { $in: departmentUsers } }, // Legacy: Tasks assigned to users in departments
          { 'assignments.userId': { $in: departmentUsers } } // New: Tasks with assignments to department users
        ]
      })
        .populate('assignedBy', 'name role')
        .sort({ createdAt: -1 });

      // Manual population and processing
      tasks = await Promise.all(
        rawTasks.map(async (task) => {
          const taskObj = task.toObject();
          
          // Handle new assignments structure
          if (taskObj.assignments && taskObj.assignments.length > 0) {
            const userIds = taskObj.assignments.map((assignment: any) => assignment.userId);
            const users = await User.find({ _id: { $in: userIds } }).select('name email role');
            
            taskObj.assignments = taskObj.assignments.map((assignment: any) => {
              const user = users.find(u => u._id.toString() === assignment.userId.toString());
              return {
                ...assignment,
                user: user ? { id: user._id, name: user.name, email: user.email, role: user.role } : null
              };
            });
          }
          
          // Handle legacy assignedTo
          if (taskObj.assignedTo && Array.isArray(taskObj.assignedTo) && taskObj.assignedTo.length > 0) {
            const firstAssignee = taskObj.assignedTo[0];
            if (firstAssignee && !firstAssignee.name) {
              const assignedUserIds = taskObj.assignedTo;
              const assignedUsers = await User.find({ _id: { $in: assignedUserIds } }).select('name email role');
              taskObj.assignedTo = assignedUsers.map(user => ({
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role
              }));
            }
          }
          
          return taskObj;
        })
      );
    } else if (role === 'COORDINATOR') {
      console.log('Fetching tasks for COORDINATOR');
      const user = await User.findById(userId);
      
      if (!user) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }

      // Get user's departments (both legacy and new structure)
      const userDepartmentIds = [];
      
      // Legacy department support
      if (user.departmentId) {
        userDepartmentIds.push(user.departmentId);
      }
      
      // New multi-department support
      if (user.departmentRoles && user.departmentRoles.length > 0) {
        user.departmentRoles.forEach((deptRole: any) => {
          if (!userDepartmentIds.includes(deptRole.departmentId)) {
            userDepartmentIds.push(deptRole.departmentId);
          }
        });
      }

      // Get professors in coordinator's departments
      const departmentProfessors = await User.find({
        $or: [
          { departmentId: { $in: userDepartmentIds }, role: 'PROFESSOR' },
          { 'departmentRoles.departmentId': { $in: userDepartmentIds }, 'departmentRoles.roles': 'PROFESSOR' }
        ]
      }).distinct('_id');

      let rawTasks = await Task.find({
        $or: [
          { assignedTo: { $in: [userId] } }, // Tasks assigned to the Coordinator (legacy)
          { 'assignments.userId': userId }, // Tasks assigned to the Coordinator (new)
          { assignedBy: userId }, // Tasks assigned by the Coordinator
          { assignedTo: { $in: departmentProfessors } }, // Legacy: Tasks assigned to professors in department
          { 'assignments.userId': { $in: departmentProfessors } } // New: Tasks with assignments to professors
        ]
      })
        .populate('assignedBy', 'name role')
        .sort({ createdAt: -1 });

      // Manual population and processing
      tasks = await Promise.all(
        rawTasks.map(async (task) => {
          const taskObj = task.toObject();
          
          // Handle new assignments structure
          if (taskObj.assignments && taskObj.assignments.length > 0) {
            const userIds = taskObj.assignments.map((assignment: any) => assignment.userId);
            const users = await User.find({ _id: { $in: userIds } }).select('name email role');
            
            taskObj.assignments = taskObj.assignments.map((assignment: any) => {
              const user = users.find(u => u._id.toString() === assignment.userId.toString());
              return {
                ...assignment,
                user: user ? { id: user._id, name: user.name, email: user.email, role: user.role } : null
              };
            });
          }
          
          // Handle legacy assignedTo
          if (taskObj.assignedTo && Array.isArray(taskObj.assignedTo) && taskObj.assignedTo.length > 0) {
            const firstAssignee = taskObj.assignedTo[0];
            if (firstAssignee && !firstAssignee.name) {
              const assignedUserIds = taskObj.assignedTo;
              const assignedUsers = await User.find({ _id: { $in: assignedUserIds } }).select('name email role');
              taskObj.assignedTo = assignedUsers.map(user => ({
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role
              }));
            }
          }
          
          return taskObj;
        })
      );

    } else if (role === 'PROFESSOR') {
      console.log('Fetching tasks for PROFESSOR');
      
      // Get tasks assigned to this professor (both legacy and new structure)
      let rawTasks = await Task.find({
        $or: [
          { assignedTo: userId }, // Legacy assignment
          { 'assignments.userId': userId } // New assignment structure
        ]
      })
        .populate('assignedBy', 'name role')
        .sort({ createdAt: -1 });

      // Process tasks with assignment messages and proper population
      const tasksWithMessages = await Promise.all(
        rawTasks.map(async (task) => {
          const taskObj = task.toObject();
          
          // Handle new assignments structure
          if (taskObj.assignments && taskObj.assignments.length > 0) {
            const userIds = taskObj.assignments.map((assignment: any) => assignment.userId);
            const users = await User.find({ _id: { $in: userIds } }).select('name email role');
            
            taskObj.assignments = taskObj.assignments.map((assignment: any) => {
              const user = users.find(u => u._id.toString() === assignment.userId.toString());
              return {
                ...assignment,
                user: user ? { id: user._id, name: user.name, email: user.email, role: user.role } : null
              };
            });
          }
          
          // Handle legacy assignedTo
          if (taskObj.assignedTo && Array.isArray(taskObj.assignedTo) && taskObj.assignedTo.length > 0) {
            const firstAssignee = taskObj.assignedTo[0];
            if (firstAssignee && !firstAssignee.name) {
              const assignedUserIds = taskObj.assignedTo;
              const assignedUsers = await User.find({ _id: { $in: assignedUserIds } }).select('name email role');
              taskObj.assignedTo = assignedUsers.map(user => ({
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role
              }));
            }
          }

          // Get assignment message from TaskAssignment
          const assignment = await TaskAssignment.findOne({
            taskId: task._id,
            assigneeUserId: userId
          });

          return {
            ...taskObj,
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