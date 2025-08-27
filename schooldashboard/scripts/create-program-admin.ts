import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import bcrypt from 'bcryptjs';

async function createProgramAdmin() {
  try {
    await connectDB();

    const email = 'admin@university.edu';
    const existingUser = await User.findOne({ email });

    if (existingUser) {
      console.log('Program Admin already exists:', existingUser);
      return;
    }

    const hashedPassword = await bcrypt.hash('securepassword', 10);

    const programAdmin = await User.create({
      name: 'Program Admin',
      email,
      passwordHash: hashedPassword,
      role: 'PROGRAM_ADMIN',
      departmentId: null // Assign department if needed
    });

    console.log('Program Admin created successfully:', programAdmin);
  } catch (error) {
    console.error('Error creating Program Admin:', error);
  }
}

createProgramAdmin();
