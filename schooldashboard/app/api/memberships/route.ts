import connectDB from "@/lib/mongodb";
import Membership from "@/models/Membership";
export async function POST(req: Request) {
  await connectDB();
  const body = await req.json(); // { userId, orgUnitId, role }
  const m = await Membership.create(body);
  return Response.json(m);
}
export async function DELETE(req: Request) {
  await connectDB();
  const { userId, orgUnitId } = await req.json();
  await Membership.deleteOne({ userId, orgUnitId });
  return Response.json({ ok: true });
}
