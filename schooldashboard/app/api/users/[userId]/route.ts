import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import Department from '@/models/Department';
import { NextResponse } from 'next/server';

export async function PATCH(req: Request, context: any) {
  try {
    await connectDB();
    
    // Ensure models are registered
    const _ = Department;

    const { userId } = context.params;
    const updateData = await req.json();

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    // Validate required fields
    if (!updateData.name || !updateData.email || !updateData.role || !updateData.departmentId) {
      return NextResponse.json({ 
        error: 'Name, email, role, and primary department are required' 
      }, { status: 400 });
    }

    // Find the user to update
    const existingUser = await User.findById(userId);
    if (!existingUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Prepare update object
    const updateFields: any = {
      name: updateData.name,
      email: updateData.email.toLowerCase(),
      role: updateData.role,
      departmentId: updateData.departmentId,
    };

    // Handle multi-department roles
    if (updateData.departmentRoles && Array.isArray(updateData.departmentRoles)) {
      // Filter out empty role assignments
      const validDepartmentRoles = updateData.departmentRoles.filter((dr: any) => 
        dr.departmentId && dr.roles && dr.roles.length > 0
      );
      updateFields.departmentRoles = validDepartmentRoles;
    }

    // Update the user
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      updateFields,
      { new: true, runValidators: true }
    ).populate('departmentId', 'name code');

    if (!updatedUser) {
      return NextResponse.json({ error: 'Failed to update user' }, { status: 500 });
    }

    // Return updated user data in the format expected by the frontend
    const userData = {
      id: updatedUser._id.toString(),
      name: updatedUser.name,
      email: updatedUser.email,
      role: updatedUser.role,
      department: updatedUser.departmentId ? {
        id: updatedUser.departmentId._id.toString(),
        name: updatedUser.departmentId.name,
        code: updatedUser.departmentId.code
      } : null,
      supervisor: updatedUser.supervisorId || null,
      lastLoginAt: updatedUser.lastLoginAt || null,
      createdAt: updatedUser.createdAt,
      phone: updatedUser.phone || '',
      bio: updatedUser.bio || '',
      // Include multi-department info
      allDepartments: updatedUser.getAllDepartments ? updatedUser.getAllDepartments().map((dId: any) => dId.toString()) : [],
      departmentRoles: updatedUser.departmentRoles || []
    };

    return NextResponse.json(userData);

  } catch (error: any) {
    console.error('Error updating user:', error);
    
    // Handle specific error types
    if (error.code === 11000) {
      return NextResponse.json({ error: 'Email already exists' }, { status: 400 });
    }
    
    if (error.name === 'ValidationError') {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    
    if (error.name === 'CastError') {
      return NextResponse.json({ error: 'Invalid user ID format' }, { status: 400 });
    }

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(req: Request, context: any) {
  try {
    await connectDB();

    const { userId } = context.params;

    if (!userId) {
      return new NextResponse('User ID is required', { status: 400 });
    }

    const deletedUser = await User.findByIdAndDelete(userId);

    if (!deletedUser) {
      return new NextResponse('User not found', { status: 404 });
    }

    return new NextResponse('User deleted successfully', { status: 200 });
  } catch (error) {
    console.error('Error deleting user:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
