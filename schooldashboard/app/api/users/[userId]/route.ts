import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import { NextResponse } from 'next/server';

export async function DELETE(req: Request, context: { params: { userId: string } }) {
  try {
    await connectDB();

    const { userId } = await context.params;

    if (!userId) {
      return new NextResponse('User ID is required', { status: 400 });
    }

    const deletedUser = await User.findByIdAndDelete(userId);

    if (!deletedUser) {
      return new NextResponse('User not found', { status: 404 });
    }

    return new NextResponse('User deleted successfully', { status: 200 });
  } catch (error) {
    console.error('Error deleting user:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
