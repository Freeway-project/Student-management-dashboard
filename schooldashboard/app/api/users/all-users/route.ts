import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    // Get current user from header (sent from frontend)
    const currentUserHeader = request.headers.get('x-current-user');
    if (!currentUserHeader) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    let currentUser;
    try {
      currentUser = JSON.parse(currentUserHeader);
    } catch {
      return NextResponse.json({ error: 'Invalid user data' }, { status: 401 });
    }

    // Hierarchical role check with different access levels
    const roleHierarchy = {
      'PROGRAM_ADMIN': ['PROGRAM_ADMIN', 'CHAIRMAN', 'VICE_CHAIRMAN', 'HOD', 'COORDINATOR', 'PROFESSOR'],
      'CHAIRMAN': ['CHAIRMAN', 'VICE_CHAIRMAN', 'HOD', 'COORDINATOR', 'PROFESSOR'],
      'VICE_CHAIRMAN': ['VICE_CHAIRMAN', 'HOD', 'COORDINATOR', 'PROFESSOR'],
      'HOD': ['HOD', 'COORDINATOR', 'PROFESSOR'],
      'COORDINATOR': ['COORDINATOR', 'PROFESSOR'],
    };

    const allowedRoles = ['PROGRAM_ADMIN', 'CHAIRMAN', 'VICE_CHAIRMAN', 'HOD', 'COORDINATOR'];
    if (!allowedRoles.includes(currentUser.role)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    // Get accessible roles based on current user's role
    const accessibleRoles = roleHierarchy[currentUser.role as keyof typeof roleHierarchy] || [];

    // For HOD and COORDINATOR, we need to limit to their own departments
    let departmentRestriction = null;
    if (currentUser.role === 'HOD' || currentUser.role === 'COORDINATOR') {
      // Get current user's department information
      const currentUserDoc = await User.findOne({ email: currentUser.email }).populate('departmentId');
      if (currentUserDoc?.departmentId) {
        departmentRestriction = currentUserDoc.departmentId._id.toString();
      }
    }

    // Get query parameters for filtering
    const url = new URL(request.url);
    const roleFilter = url.searchParams.get('role');
    const statusFilter = url.searchParams.get('status');
    const departmentFilter = url.searchParams.get('department');
    const search = url.searchParams.get('search');

    // Build query
    const query: any = { deletedAt: null };
    
    // Add hierarchical role filtering - only show users with roles the current user can access
    query.role = { $in: accessibleRoles };
    
    // Add department restriction for HOD and COORDINATOR
    if (departmentRestriction) {
      query.departmentId = departmentRestriction;
    }
    
    if (roleFilter) {
      // If a specific role is requested, make sure it's accessible and apply it
      if (accessibleRoles.includes(roleFilter)) {
        query.role = roleFilter;
      } else {
        // If requested role is not accessible, return empty result
        return NextResponse.json({
          users: [],
          stats: { totalUsers: 0, activeUsers: 0, roleCount: {}, departmentCount: {}, recentLogins: [] },
          filters: { totalResults: 0, appliedFilters: { role: roleFilter, status: statusFilter, department: departmentFilter, search: search } }
        });
      }
    }
    
    if (statusFilter) {
      query.status = statusFilter;
    }

    // Fetch users with filters
    let users = await User.find(query)
      .populate('departmentId', 'name code')
      .populate('supervisorId', 'name email role')
      .select('name email role status departmentId supervisorId lastLoginAt createdAt phone bio departmentRoles')
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

    // Get statistics based on user's access level
    const statsQuery: any = { deletedAt: null, role: { $in: accessibleRoles } };
    if (departmentRestriction) {
      statsQuery.departmentId = departmentRestriction;
    }
    
    const allUsers = await User.find(statsQuery);
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
        bio: user.bio,
        departmentRoles: user.departmentRoles || []
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