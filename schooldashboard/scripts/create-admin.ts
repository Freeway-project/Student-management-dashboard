
import connectDB from '../lib/mongodb';
import User from '../models/User';
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';

async function createAdmin(name: string, email: string, password: string) {
  try {
    await connectDB();

    const exist = await User.findOne({ email });

    if (exist) {
      console.log('User with this email already exists.');
      return;
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await User.create({
      name,
      email,
      passwordHash: hashedPassword,
      role: 'ADMIN',
    });

    console.log('Admin user created successfully.');
  } catch (error) {
    console.error('Error creating admin user:', error);
  } finally {
    await mongoose.disconnect();
  }
}

const [name, email, password] = process.argv.slice(2);

if (!name || !email || !password) {
  console.log('Please provide name, email, and password as arguments.');
  process.exit(1);
}

createAdmin(name, email, password);
