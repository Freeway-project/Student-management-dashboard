import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { Roles } from '@/models/enums';

export async function POST(req: Request) {
  try {
    // Check if user is authenticated and is admin
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    await connectDB();
    
    // Verify the requesting user is an admin
    const requestingUser = await User.findOne({ email: session.user.email });
    if (!requestingUser || requestingUser.role !== 'ADMIN') {
      return new NextResponse('Forbidden: Admin access required', { status: 403 });
    }

    const body = await req.json();
    const { name, email, password, role } = body;

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

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      name,
      email,
      passwordHash: hashedPassword,
      role,
    });

    // Return user without password hash
    const { passwordHash, ...userWithoutPassword } = user.toObject();
    return NextResponse.json(userWithoutPassword);
    
  } catch (error) {
    console.error('Admin create user error:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}