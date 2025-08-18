import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';

export async function POST(req: Request) {
  try {
    await connectDB();
    const body = await req.json();
    const { name, email, password } = body;

    if (!name || !email || !password) {
      return new NextResponse('Missing name, email, or password', { status: 400 });
    }

    const exist = await User.findOne({
      email: email,
    });

    if (exist) {
      return new NextResponse('User already exists', { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      name,
      email,
      passwordHash: hashedPassword,
      role: 'STUDENT', // Signup is only for students
    });

    return NextResponse.json(user);
  } catch (error) {
    console.log(error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}