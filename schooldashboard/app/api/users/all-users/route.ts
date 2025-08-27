import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import jwt from 'jsonwebtoken';

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    // Get current user from token
    const token = request.cookies.get('token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret') as any;
    const currentUser = await User.findById(decoded.userId);
    
    if (!currentUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 401 });
    }

    // Only Program Admin can access all users
    if (currentUser.role !== 'PROGRAM_ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Get query parameters for filtering
    const url = new URL(request.url);
    const roleFilter = url.searchParams.get('role');
    const statusFilter = url.searchParams.get('status');
    const departmentFilter = url.searchParams.get('department');
    const search = url.searchParams.get('search');

    // Build query
    const query: any = { deletedAt: null };
    
    if (roleFilter) {
      query.role = roleFilter;
    }
    
    if (statusFilter) {
      query.status = statusFilter;
    }

    // Fetch users with filters
    let users = await User.find(query)
      .populate('departmentId', 'name code')
      .populate('supervisorId', 'name email role')
      .select('name email role status departmentId supervisorId lastLoginAt createdAt phone bio')
      .sort({ role: 1, name: 1 });

    // Apply search filter (after fetching to handle populated fields)
    if (search) {
      const searchLower = search.toLowerCase();
      users = users.filter(user => 
        user.name.toLowerCase().includes(searchLower) ||
        user.email.toLowerCase().includes(searchLower) ||
        user.role.toLowerCase().includes(searchLower) ||
        (user.departmentId && user.departmentId.name.toLowerCase().includes(searchLower))
      );
    }

    // Apply department filter (after population)
    if (departmentFilter) {
      users = users.filter(user => 
        user.departmentId && user.departmentId.code === departmentFilter
      );
    }

    // Get statistics
    const allUsers = await User.find({ deletedAt: null });
    const stats = {
      totalUsers: allUsers.length,
      activeUsers: allUsers.filter(u => u.status === 'ACTIVE').length,
      roleCount: allUsers.reduce((acc: any, user) => {
        acc[user.role] = (acc[user.role] || 0) + 1;
        return acc;
      }, {}),
      departmentCount: allUsers.reduce((acc: any, user) => {
        if (user.departmentId) {
          const deptCode = user.departmentId.code || 'Unknown';
          acc[deptCode] = (acc[deptCode] || 0) + 1;
        }
        return acc;
      }, {}),
      recentLogins: allUsers
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
      stats,
      filters: {
        totalResults: users.length,
        appliedFilters: {
          role: roleFilter,
          status: statusFilter,
          department: departmentFilter,
          search: search
        }
      }
    });

  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: 500 }
    );
  }
}