import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import connectDB from '@/lib/mongodb'
import User from '@/models/User'
import Department from '@/models/Department'

export async function POST(request: NextRequest) {
  try {
    await connectDB()
    
    // Ensure models are registered
    const _ = Department; // This ensures Department model is loaded
    
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      )
    }

    // Find user by email
    const user = await User.findOne({ email }).populate('departmentId', 'name code')
    
    if (!user) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      )
    }

    // Check password
    const isValidPassword = await bcrypt.compare(password, user.passwordHash)
    
    if (!isValidPassword) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      )
    }

    // Update last login
    user.lastLoginAt = new Date()
    await user.save()

    // Return user data (no JWT, no cookies)
    const userData = {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      role: user.role,
      status: user.status,
      department: user.departmentId ? {
        id: user.departmentId._id.toString(),
        name: user.departmentId.name,
        code: user.departmentId.code
      } : null,
      // Include multi-department info if exists
      allDepartments: user.getAllDepartments ? user.getAllDepartments().map((dId: any) => dId.toString()) : [],
      departmentRoles: user.departmentRoles || []
    }

    return NextResponse.json({
      success: true,
      user: userData
    })

  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}