import { dbConnect } from "@/lib/db";
import Submission from "@/models/Submission";
import { getCoveredOrgUnitIds } from "@/lib/hierarchy";
import { getServerSession } from "next-auth";
import { z } from "zod";

export async function GET() {
  await dbConnect();
  const s = await getServerSession();
  if (!s?.user?.id) return Response.json({ error: "Unauthenticated" }, { status: 401 });
  const covered = await getCoveredOrgUnitIds(s.user.id as string);
  const list = await Submission.find({ orgUnitId: { $in: covered } }).sort({ createdAt: -1 });
  return Response.json(list);
}

const CreateSchema = z.object({
  title: z.string().min(1),
  data: z.any(),
  studentId: z.string(),
  orgUnitId: z.string(),
});

export async function POST(req: Request) {
  await dbConnect();
  const s = await getServerSession();
  if (!s?.user?.id) return Response.json({ error: "Unauthenticated" }, { status: 401 });

  const body = await req.json();
  const parsed = CreateSchema.safeParse(body);
  if (!parsed.success) return Response.json({ error: parsed.error.flatten() }, { status: 400 });

  // Optional: check writer has access to orgUnitId
  const covered = await getCoveredOrgUnitIds(s.user.id as string);
  if (!covered.includes(parsed.data.orgUnitId)) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const newDoc = await Submission.create(parsed.data);
  return Response.json(newDoc);
}