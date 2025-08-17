import { dbConnect } from "@/lib/db";
import OrgUnit from "@/models/OrgUnit";
export async function GET() {
  await dbConnect();
  const roots = await OrgUnit.find({ parentId: null });
  return Response.json(roots);
}
export async function POST(req: Request) {
  await dbConnect();
  const body = await req.json(); // { name, parentId? }
  const parent = body.parentId ? await OrgUnit.findById(body.parentId) : null;
  const node = await OrgUnit.create({
    name: body.name,
    parentId: parent?._id ?? null,
    ancestors: parent ? [...parent.ancestors, parent._id] : [],
  });
  return Response.json(node);
}
