import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';

export async function GET() {
  try {
    await connectDB();
    console.log('✅ Connected to MongoDB');

    // Fetch all users (simplified, no auth check for testing)
    const users = await User.find({ deletedAt: null })
      .populate('departmentId', 'name code')
      .populate('supervisorId', 'name email role')
      .select('name email role status departmentId supervisorId lastLoginAt createdAt phone bio')
      .sort({ role: 1, name: 1 });

    console.log(`📊 Found ${users.length} users`);

    // Get statistics
    const stats = {
      totalUsers: users.length,
      activeUsers: users.filter(u => u.status === 'ACTIVE').length,
      roleCount: users.reduce((acc: any, user) => {
        acc[user.role] = (acc[user.role] || 0) + 1;
        return acc;
      }, {}),
      recentLogins: users
        .filter(u => u.lastLoginAt)
        .sort((a, b) => new Date(b.lastLoginAt).getTime() - new Date(a.lastLoginAt).getTime())
        .slice(0, 10)
    };

    return NextResponse.json({
      users: users.map(user => ({
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status,
        department: user.departmentId ? {
          id: user.departmentId._id,
          name: user.departmentId.name,
          code: user.departmentId.code
        } : null,
        supervisor: user.supervisorId ? {
          id: user.supervisorId._id,
          name: user.supervisorId.name,
          email: user.supervisorId.email,
          role: user.supervisorId.role
        } : null,
        lastLoginAt: user.lastLoginAt,
        createdAt: user.createdAt,
        phone: user.phone,
        bio: user.bio
      })),
      stats
    });

  } catch (error) {
    console.error('❌ Error fetching users:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch users',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}