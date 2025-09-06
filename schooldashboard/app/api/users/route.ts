import { NextRequest, NextResponse } from 'next/server';
import connectDB from '../../../lib/mongodb';
import User from '../../../models/User';

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    
    const searchParams = request.nextUrl.searchParams;
    const role = searchParams.get('role');
    const departmentId = searchParams.get('departmentId');
    const includeDeleted = searchParams.get('includeDeleted') === 'true';

    // Build query filter
    let query: any = {};
    
    // Filter out deleted users unless specifically requested
    if (!includeDeleted) {
      query.deletedAt = null;
    }
    
    // Filter by role if provided
    if (role) {
      query.$or = [
        { role: role }, // Legacy role field
        { 'departmentRoles.roles': role } // New multi-role structure
      ];
    }
    
    // Filter by department if provided
    if (departmentId) {
      query.$or = [
        ...(query.$or || []),
        { departmentId: departmentId }, // Legacy department field
        { 'departmentRoles.departmentId': departmentId } // New multi-department structure
      ];
      
      // If we already have $or from role, combine them properly
      if (role) {
        query.$and = [
          {
            $or: [
              { role: role },
              { 'departmentRoles.roles': role }
            ]
          },
          {
            $or: [
              { departmentId: departmentId },
              { 'departmentRoles.departmentId': departmentId }
            ]
          }
        ];
        delete query.$or;
      }
    }

    console.log('Users query:', JSON.stringify(query, null, 2));

    // Fetch users with population
    const users = await User.find(query)
      .populate('departmentId', 'name code')
      .populate('supervisorId', 'name email role')
      .populate('createdBy', 'name email')
      .select('-passwordHash') // Exclude password hash
      .sort({ createdAt: -1 });

    // Transform users to include proper department information
    const transformedUsers = users.map(user => {
      const userObj = user.toObject();
      
      // Transform department information
      let department = null;
      if (userObj.departmentId) {
        department = {
          id: userObj.departmentId._id || userObj.departmentId,
          name: userObj.departmentId.name || 'Unknown',
          code: userObj.departmentId.code || 'N/A'
        };
      }
      
      // Transform supervisor information
      let supervisor = null;
      if (userObj.supervisorId) {
        supervisor = {
          id: userObj.supervisorId._id || userObj.supervisorId,
          name: userObj.supervisorId.name || 'Unknown',
          email: userObj.supervisorId.email || '',
          role: userObj.supervisorId.role || 'Unknown'
        };
      }

      return {
        id: userObj._id,
        _id: userObj._id, // Keep both for compatibility
        name: userObj.name,
        email: userObj.email,
        role: userObj.role,
        department,
        supervisor,
        departmentRoles: userObj.departmentRoles || [],
        phone: userObj.phone,
        bio: userObj.bio,
        lastLoginAt: userObj.lastLoginAt,
        createdAt: userObj.createdAt,
        updatedAt: userObj.updatedAt,
        createdBy: userObj.createdBy
      };
    });

    console.log(`Found ${transformedUsers.length} users`);

    return NextResponse.json({
      users: transformedUsers,
      total: transformedUsers.length
    });

  } catch (error) {
    console.error('Users fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    
    const body = await request.json();
    const {
      name,
      email,
      password,
      role,
      departmentId,
      departmentRoles,
      supervisorId,
      phone,
      bio,
      createdBy
    } = body;

    // Validate required fields
    if (!name || !email || !password) {
      return NextResponse.json(
        { error: 'Name, email, and password are required' },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 400 }
      );
    }

    // Hash password
    const bcrypt = require('bcryptjs');
    const passwordHash = await bcrypt.hash(password, 10);

    // Create user data
    const userData: any = {
      name,
      email: email.toLowerCase(),
      passwordHash,
      role,
      departmentId,
      departmentRoles: departmentRoles || [],
      supervisorId,
      phone,
      bio,
      createdBy
    };

    // Remove undefined fields
    Object.keys(userData).forEach(key => {
      if (userData[key] === undefined) {
        delete userData[key];
      }
    });

    const newUser = new User(userData);
    await newUser.save();

    // Populate the created user for response
    await newUser.populate('departmentId', 'name code');
    await newUser.populate('supervisorId', 'name email role');

    const userObj = newUser.toObject();
    delete userObj.passwordHash; // Remove password hash from response

    // Transform for response
    const transformedUser = {
      id: userObj._id,
      _id: userObj._id,
      name: userObj.name,
      email: userObj.email,
      role: userObj.role,
      department: userObj.departmentId ? {
        id: userObj.departmentId._id,
        name: userObj.departmentId.name,
        code: userObj.departmentId.code
      } : null,
      supervisor: userObj.supervisorId ? {
        id: userObj.supervisorId._id,
        name: userObj.supervisorId.name,
        email: userObj.supervisorId.email,
        role: userObj.supervisorId.role
      } : null,
      departmentRoles: userObj.departmentRoles || [],
      phone: userObj.phone,
      bio: userObj.bio,
      createdAt: userObj.createdAt,
      updatedAt: userObj.updatedAt
    };

    return NextResponse.json({
      message: 'User created successfully',
      user: transformedUser
    }, { status: 201 });

  } catch (error) {
    console.error('User creation error:', error);
    return NextResponse.json(
      { error: 'Failed to create user' },
      { status: 500 }
    );
  }
}
