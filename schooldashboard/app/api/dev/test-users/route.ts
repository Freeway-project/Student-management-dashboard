import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import Department from '@/models/Department';

export async function GET() {
  // Only allow in development or for admin users
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Not available in production' }, { status: 403 });
  }

  try {
    await connectDB();
    
    // Get all users with their departments
    const users = await User.find({
      status: 'ACTIVE',
      role: { $in: ['PROGRAM_ADMIN', 'COMPANY_ADMIN', 'CHAIRMAN', 'VICE_CHAIRMAN', 'HOD', 'COORDINATOR', 'PROFESSOR'] }
    })
    .populate('departmentId', 'name code')
    .select('name email role departmentId')
    .sort({ role: 1, name: 1 });

    const testUsers = users.map(user => ({
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      role: user.role,
      department: user.departmentId ? `${user.departmentId.name} (${user.departmentId.code})` : undefined
    }));

    return NextResponse.json(testUsers);
  } catch (error) {
    console.error('Error fetching test users:', error);
    return NextResponse.json({ error: 'Failed to fetch test users' }, { status: 500 });
  }
}