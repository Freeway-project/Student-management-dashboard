import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';


export async function POST(request: NextRequest) {
  // Only allow in development or for admin users
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Not available in production' }, { status: 403 });
  }

  try {
    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    await connectDB();

    // Get the target user
    const targetUser = await User.findById(userId).populate('departmentId');
    if (!targetUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get current user from token (for logging)
    const token = request.cookies.get('token')?.value;
    let currentUserId = null;
    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret') as any;
        currentUserId = decoded.userId;
      } catch (error) {
        // Ignore token errors for dev environment
      }
    }

    // Create new JWT token for the target user
    const newToken = jwt.sign(
      { 
        userId: targetUser._id, 
        email: targetUser.email, 
        role: targetUser.role 
      },
      process.env.JWT_SECRET || 'fallback-secret',
      { expiresIn: '24h' }
    );



    // Create response with new user data
    const response = NextResponse.json({
      success: true,
      user: {
        id: targetUser._id,
        name: targetUser.name,
        email: targetUser.email,
        role: targetUser.role,
        department: targetUser.departmentId?.name
      }
    });



    return response;
  } catch (error) {
    console.error('Error switching role:', error);
    return NextResponse.json(
      { error: 'Failed to switch role' },
      { status: 500 }
    );
  }
}