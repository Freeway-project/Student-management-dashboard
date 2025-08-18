import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { Roles } from '@/models/enums';

export async function POST(req: Request) {
  try {
    // Check if user is authenticated and is admin using our custom auth
    const token = req.headers.get('cookie')?.split('token=')[1]?.split(';')[0];
    if (!token) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    let userEmail: string;
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret') as any;
      await connectDB();
      const user = await User.findById(decoded.userId);
      if (!user) {
        return new NextResponse('Unauthorized', { status: 401 });
      }
      userEmail = user.email;
    } catch (error) {
      return new NextResponse('Unauthorized', { status: 401 });
    }
    
    // Verify the requesting user is an admin
    const requestingUser = await User.findOne({ email: userEmail });
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