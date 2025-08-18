import connectDB from "@/lib/mongodb";
import OrgUnit from "@/models/OrgUnit";
export async function POST(req: Request) {
  await connectDB();
  const { orgUnitId } = await req.json();
  const nodes = await OrgUnit.find({
    $or: [{ _id: orgUnitId }, { ancestors: { $in: [orgUnitId] } }],
  });
  return Response.json(nodes);
}
