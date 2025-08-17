import { dbConnect } from "@/lib/db";
import Membership from "@/models/Membership";
export async function POST(req: Request) {
  await dbConnect();
  const body = await req.json(); // { userId, orgUnitId, role }
  const m = await Membership.create(body);
  return Response.json(m);
}
export async function DELETE(req: Request) {
  await dbConnect();
  const { userId, orgUnitId } = await req.json();
  await Membership.deleteOne({ userId, orgUnitId });
  return Response.json({ ok: true });
}
