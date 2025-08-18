import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import { NextRequest, NextResponse } from 'next/server';

// GET - Fetch student profile
export async function GET(req: NextRequest) {
  try {
    await connectDB();
    
    // Get email from query params (temporary approach)
    const url = new URL(req.url);
    const email = url.searchParams.get('email');
    
    if (!email) {
      return NextResponse.json({ error: "Email required" }, { status: 400 });
    }

    const user = await User.findOne({ email, role: 'STUDENT' });
    if (!user) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 });
    }

    const { passwordHash, ...userWithoutPassword } = user.toObject();
    return NextResponse.json(userWithoutPassword);
    
  } catch (error) {
    console.error('Get profile error:', error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// PUT - Update student profile
export async function PUT(req: NextRequest) {
  try {
    await connectDB();
    
    const body = await req.json();
    const { email, name, otherInfo } = body;

    if (!email) {
      return NextResponse.json({ error: "Email required" }, { status: 400 });
    }

    const user = await User.findOne({ email, role: 'STUDENT' });
    if (!user) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 });
    }

    // Update only allowed fields
    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (otherInfo !== undefined) updateData.otherInfo = otherInfo;

    const updatedUser = await User.findByIdAndUpdate(
      user._id,
      updateData,
      { new: true }
    );

    const { passwordHash, ...userWithoutPassword } = updatedUser.toObject();
    return NextResponse.json(userWithoutPassword);
    
  } catch (error) {
    console.error('Update profile error:', error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}