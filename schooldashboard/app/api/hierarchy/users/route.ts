import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import { NextRequest, NextResponse } from 'next/server';

// Role hierarchy definition - higher roles can see lower roles
const ROLE_HIERARCHY: Record<string, string[]> = {
  'PROGRAM_ADMIN': ['COMPANY_ADMIN', 'CHAIRMAN', 'VICE_CHAIRMAN', 'HOD', 'COORDINATOR', 'PROFESSOR', 'STUDENT'],
  'COMPANY_ADMIN': ['CHAIRMAN', 'VICE_CHAIRMAN', 'HOD', 'COORDINATOR', 'PROFESSOR', 'STUDENT'],
  'CHAIRMAN': ['VICE_CHAIRMAN', 'HOD', 'COORDINATOR', 'PROFESSOR', 'STUDENT'],
  'VICE_CHAIRMAN': ['HOD', 'COORDINATOR', 'PROFESSOR', 'STUDENT'],
  'HOD': ['COORDINATOR', 'PROFESSOR', 'STUDENT'],
  'COORDINATOR': ['PROFESSOR', 'STUDENT'],
  'PROFESSOR': ['STUDENT'],
  'STUDENT': []
};

// GET - Fetch users based on hierarchy
export async function GET(req: NextRequest) {
  try {
    await connectDB();
    
    const url = new URL(req.url);
    const requesterEmail = url.searchParams.get('email');
    const targetRole = url.searchParams.get('role');
    
    if (!requesterEmail) {
      return NextResponse.json({ error: "Requester email required" }, { status: 400 });
    }

    // Get the requester's role
    const requester = await User.findOne({ email: requesterEmail });
    if (!requester) {
      return NextResponse.json({ error: "Requester not found" }, { status: 404 });
    }

    const requesterRole = requester.role;
    const allowedRoles = ROLE_HIERARCHY[requesterRole] || [];

    // Build query based on hierarchy permissions
    let query: any = {};
    
    if (targetRole) {
      // Specific role requested - check if allowed
      if (!allowedRoles.includes(targetRole)) {
        return NextResponse.json({ error: "Access denied to this role" }, { status: 403 });
      }
      query.role = targetRole;
    } else {
      // All accessible roles
      if (allowedRoles.length > 0) {
        query.role = { $in: allowedRoles };
      } else {
        // No access to any other roles
        return NextResponse.json([]);
      }
    }

    // For teachers, also filter by parentId if set up
    if (requesterRole === 'TEACHER' && targetRole === 'STUDENT') {
      query.parentId = requester._id;
    }

    const users = await User.find(query)
      .select('-passwordHash') // Exclude password
      .sort({ name: 1 });

    return NextResponse.json(users);
    
  } catch (error) {
    console.error('Get hierarchy users error:', error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// PUT - Assign users to hierarchy (set parentId)
export async function PUT(req: NextRequest) {
  try {
    await connectDB();
    
    const body = await req.json();
    const { requesterEmail, userId, parentId } = body;

    if (!requesterEmail || !userId) {
      return NextResponse.json({ error: "Requester email and user ID required" }, { status: 400 });
    }

    // Get the requester's role
    const requester = await User.findOne({ email: requesterEmail });
    if (!requester) {
      return NextResponse.json({ error: "Requester not found" }, { status: 404 });
    }

    // Only admin, dean, vice_dean, and head can modify hierarchy
    const allowedToModify = ['ADMIN', 'DEAN', 'VICE_DEAN', 'HEAD'];
    if (!allowedToModify.includes(requester.role)) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // Update the user's parentId
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { parentId: parentId || null },
      { new: true }
    ).select('-passwordHash');

    return NextResponse.json(updatedUser);
    
  } catch (error) {
    console.error('Update hierarchy error:', error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}