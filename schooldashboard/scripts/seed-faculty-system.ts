import connectDB from '../lib/mongodb';
import User from '../models/User';
import Department from '../models/Department';
import Task from '../models/Task';
import AuditLog from '../models/AuditLog';
import bcrypt from 'bcryptjs';

// Seed data for the faculty workflow system
async function seedFacultySystem() {
  console.log('🌱 Starting faculty system seed...');

  try {
    await connectDB();
    console.log('✅ Connected to MongoDB');

    // Clear existing data (optional - remove in production)
    console.log('🧹 Clearing existing data...');
    await Promise.all([
      User.deleteMany({}),
      Department.deleteMany({}),
      Task.deleteMany({}),
      AuditLog.deleteMany({})
    ]);

    // 1. Create Departments
    console.log('🏢 Creating departments...');

    const departments = await Department.insertMany([
      {
        name: 'Computer Science',
        code: 'CS',
        description: 'Computer Science and Engineering Department',
        isActive: true,
        email: 'cs@university.edu',
        establishedDate: new Date('2000-01-01')
      },
      {
        name: 'Electrical Engineering',
        code: 'EE',
        description: 'Electrical and Electronics Engineering Department',
        isActive: true,
        email: 'ee@university.edu',
        establishedDate: new Date('1995-01-01')
      },
      {
        name: 'Mechanical Engineering',
        code: 'ME',
        description: 'Mechanical Engineering Department',
        isActive: true,
        email: 'me@university.edu',
        establishedDate: new Date('1990-01-01')
      }
    ]);

    const [csDept, eeDept, meDept] = departments;
    console.log(`✅ Created ${departments.length} departments`);

    // 2. Create Users with role hierarchy
    console.log('👥 Creating users...');

    const defaultPassword = await bcrypt.hash('faculty123', 10);

    // Program Admin (top level)
    const programAdmin = await User.create({
      name: 'Program Administrator',
      email: 'admin@university.edu',
      passwordHash: defaultPassword,
      role: 'PROGRAM_ADMIN',
      status: 'ACTIVE',
      departmentId: csDept._id,
      metadata: { isSystemAdmin: true }
    });

    // Company Admin
    const companyAdmin = await User.create({
      name: 'Company Administrator',
      email: 'company@university.edu',
      passwordHash: defaultPassword,
      role: 'COMPANY_ADMIN',
      status: 'ACTIVE',
      departmentId: csDept._id,
      supervisorId: programAdmin._id,
      createdBy: programAdmin._id,
    });

    // Chairman
    const chairman = await User.create({
      name: 'Dr. John Chairman',
      email: 'chairman@university.edu',
      passwordHash: defaultPassword,
      role: 'CHAIRMAN',
      status: 'ACTIVE',
      departmentId: csDept._id,
      supervisorId: companyAdmin._id,
      phone: '+1-555-0001',
      bio: 'Chairman with 20+ years of academic leadership experience'
    });

    // Vice Chairman  
    const viceChairman = await User.create({
      name: 'Dr. Jane Vice-Chairman',
      email: 'vice.chairman@university.edu',
      passwordHash: defaultPassword,
      role: 'VICE_CHAIRMAN',
      status: 'ACTIVE',
      departmentId: csDept._id,
      supervisorId: chairman._id,
      phone: '+1-555-0002',
      bio: 'Vice Chairman overseeing academic operations'
    });

    // HODs for each department
    const hodCS = await User.create({
      name: 'Dr. Alice HOD-CS',
      email: 'hod.cs@university.edu',
      passwordHash: defaultPassword,
      role: 'HOD',
      status: 'ACTIVE',
      departmentId: csDept._id,
      supervisorId: viceChairman._id,
      phone: '+1-555-0003',
      bio: 'Head of Computer Science Department'
    });

    const hodEE = await User.create({
      name: 'Dr. Bob HOD-EE',
      email: 'hod.ee@university.edu',
      passwordHash: defaultPassword,
      role: 'HOD',
      status: 'ACTIVE',
      departmentId: eeDept._id,
      supervisorId: viceChairman._id,
      phone: '+1-555-0004'
    });

    const hodME = await User.create({
      name: 'Dr. Carol HOD-ME',
      email: 'hod.me@university.edu',
      passwordHash: defaultPassword,
      role: 'HOD',
      status: 'ACTIVE',
      departmentId: meDept._id,
      supervisorId: viceChairman._id,
      phone: '+1-555-0005'
    });

    // Coordinators
    const coordinatorCS = await User.create({
      name: 'Dr. David Coordinator-CS',
      email: 'coordinator.cs@university.edu',
      passwordHash: defaultPassword,
      role: 'COORDINATOR',
      status: 'ACTIVE',
      departmentId: csDept._id,
      supervisorId: hodCS._id,
      phone: '+1-555-0006'
    });

    const coordinatorEE = await User.create({
      name: 'Dr. Eva Coordinator-EE',
      email: 'coordinator.ee@university.edu',
      passwordHash: defaultPassword,
      role: 'COORDINATOR',
      status: 'ACTIVE',
      departmentId: eeDept._id,
      supervisorId: hodEE._id,
      phone: '+1-555-0007'
    });

    // Professors
    const professors = await User.insertMany([
      {
        name: 'Dr. Emily Professor-CS1',
        email: 'prof.cs1@university.edu',
        passwordHash: defaultPassword,
        role: 'PROFESSOR',
        status: 'ACTIVE',
        departmentId: csDept._id,
        supervisorId: coordinatorCS._id,
        phone: '+1-555-0010',
        bio: 'Specializes in Machine Learning and AI'
      },
      {
        name: 'Dr. Frank Professor-CS2',
        email: 'prof.cs2@university.edu',
        passwordHash: defaultPassword,
        role: 'PROFESSOR',
        status: 'ACTIVE',
        departmentId: csDept._id,
        supervisorId: coordinatorCS._id,
        phone: '+1-555-0011',
        bio: 'Expert in Software Engineering and Databases'
      },
      {
        name: 'Dr. Grace Professor-EE1',
        email: 'prof.ee1@university.edu',
        passwordHash: defaultPassword,
        role: 'PROFESSOR',
        status: 'ACTIVE',
        departmentId: eeDept._id,
        supervisorId: coordinatorEE._id,
        phone: '+1-555-0012',
        bio: 'Power Systems and Renewable Energy'
      },
      {
        name: 'Dr. Henry Professor-EE2',
        email: 'prof.ee2@university.edu',
        passwordHash: defaultPassword,
        role: 'PROFESSOR',
        status: 'ACTIVE',
        departmentId: eeDept._id,
        supervisorId: coordinatorEE._id,
        phone: '+1-555-0013'
      }
    ]);



    console.log(`✅ Created ${await User.countDocuments()} users`);

    // Update department HODs
    await Department.findByIdAndUpdate(csDept._id, { hodId: hodCS._id, coordinatorIds: [coordinatorCS._id] });
    await Department.findByIdAndUpdate(eeDept._id, { hodId: hodEE._id, coordinatorIds: [coordinatorEE._id] });
    await Department.findByIdAndUpdate(meDept._id, { hodId: hodME._id });

    // 3. Create Sample Tasks
    console.log('📋 Creating sample tasks...');

    const tasks = await Task.insertMany([
      {
        title: 'Course Curriculum Review - CS 101',
        description: 'Review and update the curriculum for Introduction to Computer Science course',
        instructions: 'Please review the current curriculum, suggest improvements, and align with industry standards',
        type: 'academic',
        category: 'curriculum_review',
        priority: 'HIGH',
        assignedTo: professors[0]._id, // CS Professor 1
        assignedBy: coordinatorCS._id,
        departmentId: csDept._id,
        status: 'ASSIGNED',
        dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 2 weeks from now
        startDate: new Date(),
        requiredDeliverables: [
          { name: 'Updated Curriculum Document', description: 'Complete curriculum with learning outcomes', required: true },
          { name: 'Assessment Plan', description: 'Detailed assessment and grading rubric', required: true }
        ],
        currentReviewerIds: [coordinatorCS._id],
        approvalWorkflow: [
          { level: 1, roleRequired: 'COORDINATOR', userId: coordinatorCS._id, status: 'PENDING' },
          { level: 2, roleRequired: 'HOD', userId: hodCS._id, status: 'PENDING' },
          { level: 3, roleRequired: 'VICE_CHAIRMAN', userId: viceChairman._id, status: 'PENDING' }
        ],
        tags: ['curriculum', 'review', 'cs101'],
        labels: ['Academic Year 2024']
      },
      {
        title: 'Research Paper Publication - AI Ethics',
        description: 'Prepare and submit research paper on AI Ethics to IEEE conference',
        instructions: 'Complete the research paper and ensure it meets publication standards',
        type: 'research',
        category: 'publication',
        priority: 'MEDIUM',
        assignedTo: professors[0]._id,
        assignedBy: hodCS._id,
        departmentId: csDept._id,
        status: 'IN_PROGRESS',
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 1 month from now
        startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Started 1 week ago
        completionPercentage: 35,
        currentReviewerIds: [hodCS._id],
        approvalWorkflow: [
          { level: 1, roleRequired: 'HOD', userId: hodCS._id, status: 'PENDING' },
          { level: 2, roleRequired: 'VICE_CHAIRMAN', userId: viceChairman._id, status: 'PENDING' }
        ],
        tags: ['research', 'ai', 'ethics', 'ieee'],
        labels: ['Research 2024']
      },
      {
        title: 'Lab Equipment Procurement Request',
        description: 'Submit request for new electrical engineering lab equipment',
        instructions: 'Prepare detailed equipment list with specifications and budget estimation',
        type: 'administrative',
        category: 'procurement',
        priority: 'URGENT',
        assignedTo: professors[2]._id, // EE Professor 1
        assignedBy: coordinatorEE._id,
        departmentId: eeDept._id,
        status: 'SUBMITTED',
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 1 week from now
        submittedAt: new Date(),
        currentReviewerIds: [coordinatorEE._id, hodEE._id],
        approvalWorkflow: [
          { level: 1, roleRequired: 'COORDINATOR', userId: coordinatorEE._id, status: 'APPROVED', approvedAt: new Date(), approvedBy: coordinatorEE._id },
          { level: 2, roleRequired: 'HOD', userId: hodEE._id, status: 'PENDING' },
          { level: 3, roleRequired: 'VICE_CHAIRMAN', userId: viceChairman._id, status: 'PENDING' },
          { level: 4, roleRequired: 'CHAIRMAN', userId: chairman._id, status: 'PENDING' }
        ],
        tags: ['procurement', 'lab', 'equipment'],
        labels: ['Budget 2024', 'High Priority']
      }
    ]);

    console.log(`✅ Created ${tasks.length} sample tasks`);

    // 4. Create Audit Log entries for the seed operation
    console.log('📝 Creating audit logs...');

    await AuditLog.create({
      action: 'SEED_DATABASE',
      entity: 'System',
      entityId: programAdmin._id,
      userId: programAdmin._id,
      userRole: 'PROGRAM_ADMIN',
      userEmail: 'admin@university.edu',
      userName: 'Program Administrator',
      description: 'Initial database seeding with faculty workflow system data',
      success: true,
      metadata: {
        usersCreated: await User.countDocuments(),
        departmentsCreated: departments.length,
        tasksCreated: tasks.length,
        seedVersion: '1.0.0'
      }
    });

    // Summary
    console.log('\n🎉 Faculty System Seed Complete!');
    console.log('=======================================');
    console.log(`📊 Summary:`);
    console.log(`   • Users: ${await User.countDocuments()}`);
    console.log(`   • Departments: ${await Department.countDocuments()}`);
    console.log(`   • Tasks: ${await Task.countDocuments()}`);
    console.log(`   • Audit Logs: ${await AuditLog.countDocuments()}`);

    console.log(`\n🔑 Login Credentials (password: faculty123):`);
    console.log(`   • Program Admin: admin@university.edu`);
    console.log(`   • Company Admin: company@university.edu`);
    console.log(`   • Chairman: chairman@university.edu`);
    console.log(`   • Vice Chairman: vice.chairman@university.edu`);
    console.log(`   • HOD CS: hod.cs@university.edu`);
    console.log(`   • Coordinator CS: coordinator.cs@university.edu`);
    console.log(`   • Professor CS1: prof.cs1@university.edu`);
    console.log(`   • Professor EE1: prof.ee1@university.edu`);

    console.log(`\n🎯 Next Steps:`);
    console.log(`   1. Test login with different role accounts`);
    console.log(`   2. Create and assign new tasks`);
    console.log(`   3. Test the approval workflow`);
    console.log(`   4. Verify role-based permissions`);

  } catch (error) {
    console.error('❌ Seed failed:', error);
    throw error;
  }
}

// Remove 'status' field from all User documents in MongoDB
// Usage: npx ts-node scripts/remove-user-status.ts

import mongoose from 'mongoose';



const MONGO_URI = "mongodb+srv://admin:admin@cluster0.pnf3ajy.mongodb.net/test?retryWrites=true&w=majority";

async function main() {
  await mongoose.connect(MONGO_URI);
  const result = await User.updateMany({}, { $unset: { status: "" } });
  console.log(`Removed 'status' field from ${result.modifiedCount} users.`);
  await mongoose.disconnect();
}


async function createProgramAdmin() {
  try {
    await connectDB();




 const defaultPassword = await bcrypt.hash('password123', 10);

    // const viceChairman = await User.create({
    //   name: 'Dr. -Chairman',
    //   email: 'chairman@university.edu',
    //   passwordHash: defaultPassword,
    //   role: 'VICE_CHAIRMAN',
    //   status: 'ACTIVE',
    //   supervisorId: '68ae9e388207ffa0d98bd40c',
    //   phone: '+1-555-0002',
    //   bio: 'Vice Chairman overseeing academic operations'
    // });

    const viceChairman = await User.create({
      name: 'Dr. Jane Vice-Chairman',
      email: 'vice.chairman@university.edu',
      passwordHash: defaultPassword,
      role: 'VICE_CHAIRMAN',
      status: 'ACTIVE',
      supervisorId: '68af3179e37f39c5fe31593c',
      phone: '+1-555-0002',
      bio: 'Vice Chairman overseeing academic operations'
    });
    console.log('Chairman created:', viceChairman);


  } catch (error) {
    console.error('Error creating Program Admin:', error);
  }
}



// main().catch(err => {
//   console.error('Error removing status field:', err);
//   process.exit(1);
// });


// Allow running this script directly
if (require.main === module) {
  // seedFacultySystem()
  //   .then(() => {
  //     console.log('✅ Seed completed successfully');
  //     process.exit(0);
  //   })
  //   .catch((error) => {
  //     console.error('❌ Seed failed:', error);
  //     process.exit(1);
  //   });
  createProgramAdmin();
}

export default seedFacultySystem;