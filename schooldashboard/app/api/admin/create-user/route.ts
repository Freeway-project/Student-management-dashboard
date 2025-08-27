import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';


export async function POST(req: Request) {
  try {
    await connectDB();

    const body = await req.json();
    const { name, email, password, role, departmentId } = body;

    // Basic validation for required fields
    if (!name || !email || !password || !role) {
      return new NextResponse('Missing required fields: name, email, password, role', { status: 400 });
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
      departmentId,
    });



    // Return user without password hash
    const { passwordHash, ...userWithoutPassword } = user.toObject();
    return NextResponse.json(userWithoutPassword);
  } catch (error) {
    console.error('Error creating user:', error);

    return new NextResponse('Internal Server Error', { status: 500 });
  }
}