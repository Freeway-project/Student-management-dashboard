import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import Department from '@/models/Department';
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

    // Only Program Admin can access full hierarchy
    if (currentUser.role !== 'PROGRAM_ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Fetch all users with their departments
    const users = await User.find({ deletedAt: null })
      .populate('departmentId', 'name code')
      .populate('supervisorId', 'name email role')
      .populate('createdBy', 'name email')
      .select('name email role status departmentId supervisorId createdBy lastLoginAt createdAt phone bio')
      .sort({ role: 1, name: 1 });

    // Fetch all departments
    const departments = await Department.find({ deletedAt: null })
      .populate('hodId', 'name email')
      .populate('coordinatorIds', 'name email')
      .select('name code description hodId coordinatorIds isActive');

    // Build hierarchy structure
    const hierarchy = buildHierarchy(users);
    
    // Get statistics
    const stats = {
      totalUsers: users.length,
      activeUsers: users.filter(u => u.status === 'ACTIVE').length,
      totalDepartments: departments.length,
      roleCount: users.reduce((acc: any, user) => {
        acc[user.role] = (acc[user.role] || 0) + 1;
        return acc;
      }, {}),
      departmentCount: users.reduce((acc: any, user) => {
        const deptName = user.departmentId?.name || 'No Department';
        acc[deptName] = (acc[deptName] || 0) + 1;
        return acc;
      }, {}),
      recentLogins: users
        .filter(u => u.lastLoginAt)
        .sort((a, b) => new Date(b.lastLoginAt).getTime() - new Date(a.lastLoginAt).getTime())
        .slice(0, 10)
    };

    return NextResponse.json({
      hierarchy,
      departments,
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
        createdBy: user.createdBy ? {
          name: user.createdBy.name,
          email: user.createdBy.email
        } : null,
        lastLoginAt: user.lastLoginAt,
        createdAt: user.createdAt,
        phone: user.phone,
        bio: user.bio
      })),
      stats
    });

  } catch (error) {
    console.error('Error fetching hierarchy:', error);
    return NextResponse.json(
      { error: 'Failed to fetch hierarchy' },
      { status: 500 }
    );
  }
}

function buildHierarchy(users: any[]) {
  // Create a map of users by ID for quick lookup
  const userMap = new Map();
  users.forEach(user => {
    userMap.set(user._id.toString(), {
      ...user.toObject(),
      children: []
    });
  });

  // Build the hierarchy
  const roots: any[] = [];
  
  userMap.forEach(user => {
    if (user.supervisorId) {
      const supervisor = userMap.get(user.supervisorId.toString());
      if (supervisor) {
        supervisor.children.push(user);
      } else {
        // If supervisor not found, treat as root
        roots.push(user);
      }
    } else {
      // No supervisor, this is a root user
      roots.push(user);
    }
  });

  // Sort roots by role hierarchy
  const roleOrder = ['PROGRAM_ADMIN', 'COMPANY_ADMIN', 'CHAIRMAN', 'VICE_CHAIRMAN', 'HOD', 'COORDINATOR', 'PROFESSOR', 'STUDENT'];
  
  roots.sort((a, b) => {
    const aIndex = roleOrder.indexOf(a.role);
    const bIndex = roleOrder.indexOf(b.role);
    if (aIndex !== bIndex) return aIndex - bIndex;
    return a.name.localeCompare(b.name);
  });

  // Recursively sort children
  function sortChildren(node: any) {
    if (node.children && node.children.length > 0) {
      node.children.sort((a: any, b: any) => {
        const aIndex = roleOrder.indexOf(a.role);
        const bIndex = roleOrder.indexOf(b.role);
        if (aIndex !== bIndex) return aIndex - bIndex;
        return a.name.localeCompare(b.name);
      });
      node.children.forEach(sortChildren);
    }
  }

  roots.forEach(sortChildren);

  return roots;
}