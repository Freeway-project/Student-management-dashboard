import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import AuditLog from '@/models/AuditLog';

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

    // Log the role switch for audit trail
    if (currentUserId) {
      try {
        await AuditLog.create({
          action: 'DEV_ROLE_SWITCH',
          entity: 'User',
          entityId: targetUser._id,
          userId: currentUserId,
          userRole: 'DEV',
          description: `Development role switch to ${targetUser.role} (${targetUser.email})`,
          metadata: {
            targetUserId: targetUser._id,
            targetRole: targetUser.role,
            targetEmail: targetUser.email,
            switchType: 'development_testing'
          },
          riskLevel: 'MEDIUM'
        });
      } catch (logError) {
        console.error('Failed to create audit log:', logError);
        // Don't fail the role switch if logging fails
      }
    }

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

    // Set the new token as httpOnly cookie
    response.cookies.set('token', newToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 86400 // 24 hours
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