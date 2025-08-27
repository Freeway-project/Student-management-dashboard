import connectDB from '../lib/mongodb';
import User from '../models/User';

// Script to remove 'status' field from all users, similar to seed-faculty-system
async function removeUserStatusField() {
  console.log('🧹 Removing status field from all users...');
  try {
    await connectDB();
    const result = await User.updateMany({}, { $unset: { status: "" } });
    console.log(`✅ Removed 'status' field from ${result.modifiedCount} users.`);
    process.exit(0);
  } catch (err) {
    console.error('❌ Error removing status field:', err);
    process.exit(1);
  }
}

removeUserStatusField();
