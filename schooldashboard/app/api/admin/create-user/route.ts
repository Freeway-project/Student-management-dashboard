import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { Roles } from '@/models/enums';

export async function POST(req: Request) {
  try {
    await connectDB();

    // Get current user from header (sent from frontend)
    const currentUserHeader = req.headers.get('x-current-user');
    if (!currentUserHeader) {
      return new NextResponse('Authentication required', { status: 401 });
    }

    let currentUser;
    try {
      currentUser = JSON.parse(currentUserHeader);
    } catch {
      return new NextResponse('Invalid user data', { status: 401 });
    }

    // Allow PROGRAM_ADMIN, HOD, and PROFESSOR to create users
    const allowedRoles = ['PROGRAM_ADMIN', 'HOD', 'PROFESSOR'];
    if (!allowedRoles.includes(currentUser.role)) {
      return new NextResponse('Forbidden: Admin, HOD, or Professor access required', { status: 403 });
    }

    const body = await req.json();
    const { name, email, password, role, departmentId } = body;

    if (!name || !email || !password || !role) {
      return new NextResponse('Missing required fields: name, email, password, role', { status: 400 });
    }

    // Validate role
    if (!Roles.includes(role as any)) {
      return new NextResponse(`Invalid role. Must be one of: ${Roles.join(', ')}`, { status: 400 });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return new NextResponse('User with this email already exists', { status: 400 });
    }

    // Get creator for tracking purposes
    const creator = await User.findOne({ email: currentUser.email });
    if (!creator) {
      return new NextResponse('Creator not found', { status: 400 });
    }

    // Use provided departmentId or fallback to creator's department
    let assignedDepartmentId = departmentId;
    if (!assignedDepartmentId) {
      const creatorWithDept = await User.findOne({ email: currentUser.email }).populate('departmentId');
      if (!creatorWithDept || !creatorWithDept.departmentId) {
        return new NextResponse('Department ID required or creator department not found', { status: 400 });
      }
      assignedDepartmentId = creatorWithDept.departmentId;
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      name,
      email,
      passwordHash: hashedPassword,
      role,
      departmentId: assignedDepartmentId, // Assign to specified or creator's department
      createdBy: creator._id, // Track who created this user
    });

    // Return user without password hash
    const { passwordHash, ...userWithoutPassword } = user.toObject();
    return NextResponse.json(userWithoutPassword);
    
  } catch (error) {
    console.error('Admin create user error:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}