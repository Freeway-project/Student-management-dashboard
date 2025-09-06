import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import Department from '@/models/Department';

// Simple departments
const departments = [
  { name: 'Computer Science', code: 'CS' },
  { name: 'Mathematics', code: 'MATH' },
  { name: 'Physics', code: 'PHY' },
  { name: 'Chemistry', code: 'CHEM' },
  { name: 'Business Administration', code: 'BCA' },
  { name: 'Technology', code: 'BTECH' }
];

// Simple users with easy credentials
const users = [
  {
    name: 'Chairman',
    email: 'chair@gmail.com',
    password: '000000',
    role: 'CHAIRMAN',
    departmentRoles: [] // Chairman has access to all
  },
  {
    name: 'Vice Chairman', 
    email: 'vice@gmail.com',
    password: '000000',
    role: 'VICE_CHAIRMAN',
    departmentRoles: []
  },
  {
    name: 'CS HOD',
    email: 'cshod@gmail.com', 
    password: '000000',
    role: 'HOD',
    primaryDept: 'CS',
    departmentRoles: [
      { department: 'CS', roles: ['HOD', 'PROFESSOR'] }
    ]
  },
  {
    name: 'Math HOD',
    email: 'mathhod@gmail.com',
    password: '000000', 
    role: 'HOD',
    primaryDept: 'MATH',
    departmentRoles: [
      { department: 'MATH', roles: ['HOD', 'PROFESSOR'] }
    ]
  },
  {
    name: 'Multi Dept User',
    email: 'multi@gmail.com',
    password: '000000',
    role: 'HOD', // Primary role
    primaryDept: 'BCA',
    departmentRoles: [
      { department: 'BCA', roles: ['HOD', 'PROFESSOR'] },
      { department: 'BTECH', roles: ['PROFESSOR'] },
      { department: 'CS', roles: ['COORDINATOR'] }
    ]
  },
  {
    name: 'CS Coordinator',
    email: 'cscoord@gmail.com',
    password: '000000',
    role: 'COORDINATOR',
    primaryDept: 'CS',
    departmentRoles: [
      { department: 'CS', roles: ['COORDINATOR', 'PROFESSOR'] }
    ]
  },
  {
    name: 'CS Professor',
    email: 'csprof@gmail.com',
    password: '000000',
    role: 'PROFESSOR',
    primaryDept: 'CS',
    departmentRoles: [
      { department: 'CS', roles: ['PROFESSOR'] }
    ]
  },
  {
    name: 'Math Professor',
    email: 'mathprof@gmail.com',
    password: '000000',
    role: 'PROFESSOR', 
    primaryDept: 'MATH',
    departmentRoles: [
      { department: 'MATH', roles: ['PROFESSOR'] }
    ]
  },
  {
    name: 'Program Admin',
    email: 'admin@gmail.com',
    password: '000000',
    role: 'PROGRAM_ADMIN',
    departmentRoles: [] // System-wide access
  }
];

async function seedDatabase() {
  try {
    console.log('Connecting to database...');
    await connectDB();
    console.log('Connected successfully');

    // Clear existing data
    console.log('Clearing existing data...');
    await User.deleteMany({});
    await Department.deleteMany({});

    // Create departments
    console.log('Creating departments...');
    const createdDepartments = await Department.insertMany(departments);
    console.log(`Created ${createdDepartments.length} departments`);

    // Create department lookup map
    const deptMap: Record<string, any> = {};
    createdDepartments.forEach(dept => {
      deptMap[dept.code] = dept._id;
    });

    // Create users with hashed passwords
    console.log('Creating users...');
    for (const userData of users) {
      const hashedPassword = await bcrypt.hash(userData.password, 10);
      
      const user = {
        name: userData.name,
        email: userData.email,
        passwordHash: hashedPassword,
        role: userData.role,
        departmentId: userData.primaryDept ? deptMap[userData.primaryDept] : null,
        departmentRoles: userData.departmentRoles.map(dr => ({
          departmentId: deptMap[dr.department],
          roles: dr.roles
        }))
      };

      await User.create(user);
      console.log(`✓ Created user: ${userData.email} (${userData.role})`);
    }

    console.log('\n🎉 SEED DATA CREATED SUCCESSFULLY!');
    console.log('\n📧 Test Users (all with password: 000000):');
    console.log('==========================================');
    users.forEach(user => {
      console.log(`${user.email.padEnd(20)} - ${user.role}${user.primaryDept ? ` (${user.primaryDept})` : ''}`);
      if (user.departmentRoles && user.departmentRoles.length > 1) {
        console.log(`${''.padEnd(22)} Multi-dept: ${user.departmentRoles.map(r => `${r.department}:${r.roles.join(',')}`).join('; ')}`);
      }
    });
    console.log('==========================================');

    console.log('\n🏢 Departments:');
    console.log('===============');
    departments.forEach(dept => {
      console.log(`${dept.code.padEnd(8)} - ${dept.name}`);
    });

    console.log('\n✨ Ready to test! Login with any email above and password: 000000');

  } catch (error) {
    console.error('❌ Seed error:', error);
    throw error;
  } finally {
    await mongoose.disconnect();
    console.log('\n👋 Database connection closed');
  }
}

// Run the seed function
seedDatabase()
  .then(() => {
    console.log('🏁 Seeding completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Seeding failed:', error);
    process.exit(1);
  });