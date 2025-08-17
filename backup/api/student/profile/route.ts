import { dbConnect } from "@/lib/db";
import User from "@/models/User";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  await dbConnect();
  const session = await getServerSession();
  if (!session?.user?.id) return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  const { name, studentId, age, bio } = await req.json();
  await User.findByIdAndUpdate(session.user.id, { name, studentId, age, bio });
  return NextResponse.json({ ok: true });
}

export async function GET(req: NextRequest) {
    await dbConnect();
    const session = await getServerSession();
    if (!session?.user?.id) return NextResponse.json({ error: "Not signed in" }, { status: 401 });
    const user = await User.findById(session.user.id);
    return NextResponse.json(user);
}