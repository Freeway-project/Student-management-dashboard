import { dbConnect } from "@/lib/db";
import Submission from "@/models/Submission";
import { getCoveredOrgUnitIds } from "@/lib/hierarchy";
import { getServerSession } from "next-auth";
import { Types } from "mongoose";

export async function GET(_: Request, { params }: { params: { id: string } }) {
  await dbConnect();
  const s = await getServerSession();
  if (!s?.user?.id) return Response.json({ error: "Unauthenticated" }, { status: 401 });

  const doc = await Submission.findById(new Types.ObjectId(params.id));
  if (!doc) return Response.json({ error: "Not found" }, { status: 404 });

  const covered = await getCoveredOrgUnitIds(s.user.id as string);
  if (!covered.includes(String(doc.orgUnitId))) return Response.json({ error: "Forbidden" }, { status: 403 });

  return Response.json(doc);
}
