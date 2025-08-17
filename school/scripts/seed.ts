// scripts/seed.ts
import "dotenv/config";
import bcrypt from "bcrypt";
import { dbConnect } from "@/lib/db";
import OrgUnit from "@/models/OrgUnit";
import User from "@/models/User";
import Membership from "@/models/Membership";
import Submission from "@/models/Submission";

async function main() {
  await dbConnect();
  await Promise.all([
    OrgUnit.deleteMany({}),
    User.deleteMany({}),
    Membership.deleteMany({}),
    Submission.deleteMany({}),
  ]);

  // Org tree: University -> College -> Dept -> Class
  const uni = await OrgUnit.create({ name: "University", parentId: null, ancestors: [] });
  const college = await OrgUnit.create({ name: "Engineering College", parentId: uni._id, ancestors: [uni._id] });
  const dept = await OrgUnit.create({ name: "Computer Science Dept", parentId: college._id, ancestors: [uni._id, college._id] });
  const klass = await OrgUnit.create({ name: "CS-101 Class", parentId: dept._id, ancestors: [uni._id, college._id, dept._id] });

  // Users
  const [pwdAdmin, pwdHead, pwdTeacher, pwdStudent] = await Promise.all(
    ["admin123", "head123", "teach123", "stud123"].map(p => bcrypt.hash(p, 10))
  );
  const admin = await User.create({ name: "Admin", email: "admin@x.com", passwordHash: pwdAdmin });
  const head = await User.create({ name: "Dept Head", email: "head@x.com", passwordHash: pwdHead });
  const teacher = await User.create({ name: "Teacher T", email: "t@x.com", passwordHash: pwdTeacher });
  const student = await User.create({ name: "Student S", email: "s@x.com", passwordHash: pwdStudent });

  // Memberships
  await Membership.create({ userId: admin._id, orgUnitId: uni._id, role: "ADMIN" });
  await Membership.create({ userId: head._id, orgUnitId: dept._id, role: "HEAD" });
  await Membership.create({ userId: teacher._id, orgUnitId: klass._id, role: "TEACHER" });
  await Membership.create({ userId: student._id, orgUnitId: klass._id, role: "STUDENT" });

  // Sample submission (belongs to class)
  await Submission.create({
    title: "Assignment 1",
    data: { answer: "42" },
    studentId: student._id,
    orgUnitId: klass._id,
  });

  console.log("Seed done. Logins:");
  console.log("admin@x.com / admin123");
  console.log("head@x.com / head123");
  console.log("t@x.com / teach123");
  console.log("s@x.com / stud123");
}

main().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
