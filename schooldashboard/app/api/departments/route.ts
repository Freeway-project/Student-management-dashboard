import connectDB from '@/lib/mongodb';
import Department from '@/models/Department';
import { NextRequest, NextResponse } from 'next/server';

// POST - Create a new department
export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const body = await req.json();
    const { name, code, description, email, establishedDate, isActive } = body;
    if (!name || !code) {
      return NextResponse.json({ error: 'Name and code are required' }, { status: 400 });
    }
    const department = await Department.create({
      name,
      code,
      description,
      email,
      establishedDate,
      isActive: isActive ?? true
    });
    return NextResponse.json(department);
  } catch (error) {
    console.error('Create department error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// GET - List all departments
export async function GET() {
  try {
    await connectDB();
    const departments = await Department.find().sort({ name: 1 });
    return NextResponse.json({ departments });
  } catch (error) {
    console.error('List departments error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// PUT - Update a department
export async function PUT(req: NextRequest) {
  try {
    await connectDB();
    const body = await req.json();
    const { id, ...updateData } = body;
    if (!id) {
      return NextResponse.json({ error: 'Department ID required' }, { status: 400 });
    }
    const updated = await Department.findByIdAndUpdate(id, updateData, { new: true });
    return NextResponse.json(updated);
  } catch (error) {
    console.error('Update department error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
