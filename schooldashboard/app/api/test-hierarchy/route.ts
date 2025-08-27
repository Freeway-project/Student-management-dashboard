import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';

export async function GET() {
  try {
    await connectDB();
    console.log('✅ Connected to MongoDB');

    // Get count of users
    const userCount = await User.countDocuments();
    console.log(`📊 Total users: ${userCount}`);
    
    // Get sample users
    const users = await User.find().limit(3).select('name email role');
    console.log('👥 Sample users:', users);

    return NextResponse.json({
      success: true,
      message: 'Database connection working',
      userCount,
      sampleUsers: users
    });

  } catch (error) {
    console.error('❌ Test failed:', error);
    return NextResponse.json(
      { 
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}