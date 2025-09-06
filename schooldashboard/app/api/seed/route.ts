import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import Department from '@/models/Department';
import bcrypt from 'bcryptjs';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    await connectDB();

    // Check if users already exist
    const existingUser = await User.findOne({ email: 'chair@gmail.com' });
    if (existingUser) {
      return Response.json({
        message: 'Seed data already exists'
      });
    }

    // Create departments
    const departments = [
      { name: 'Computer Science', code: 'CS' },
      { name: 'Mathematics', code: 'MATH' },
      { name: 'Business Administration', code: 'BCA' },
      { name: 'Technology', code: 'BTECH' }
    ];

    const createdDepts = await Department.insertMany(departments);
    const deptMap: Record<string, any> = {};
    createdDepts.forEach(dept => {
      deptMap[dept.code] = dept._id;
    });

    // Create users with simple credentials
    const hashedPassword = await bcrypt.hash('000000', 10);

    const users = [
      {
        name: 'Chairman',
        email: 'chair@gmail.com',
        passwordHash: hashedPassword,
        role: 'CHAIRMAN'
      },
      {
        name: 'CS HOD',
        email: 'cshod@gmail.com',
        passwordHash: hashedPassword,
        role: 'HOD',
        departmentId: deptMap.CS,
        departmentRoles: [
          { departmentId: deptMap.CS, roles: ['HOD', 'PROFESSOR'] }
        ]
      },
      {
        name: 'Multi Dept User',
        email: 'multi@gmail.com',
        passwordHash: hashedPassword,
        role: 'HOD',
        departmentId: deptMap.BCA,
        departmentRoles: [
          { departmentId: deptMap.BCA, roles: ['HOD', 'PROFESSOR'] },
          { departmentId: deptMap.BTECH, roles: ['PROFESSOR'] }
        ]
      },
      {
        name: 'CS Professor',
        email: 'csprof@gmail.com',
        passwordHash: hashedPassword,
        role: 'PROFESSOR',
        departmentId: deptMap.CS,
        departmentRoles: [
          { departmentId: deptMap.CS, roles: ['PROFESSOR'] }
        ]
      }
    ];

    await User.insertMany(users);

    return Response.json({
      message: 'Seed data created successfully',
      users: [
        'chair@gmail.com (CHAIRMAN) - password: 000000',
        'cshod@gmail.com (CS HOD) - password: 000000', 
        'multi@gmail.com (Multi-dept HOD) - password: 000000',
        'csprof@gmail.com (CS Professor) - password: 000000'
      ]
    });
  } catch (error) {
    console.error('Seed error:', error);
    return Response.json({
      error: 'Failed to seed data'
    }, { status: 500 });
  }
}
