// src/lib/hierarchy.ts
import OrgUnit from " @/models/OrgUnit";
import Membership from " @/models/Membership";
import { Types } from "mongoose";

export async function getCoveredOrgUnitIds(userId: string) {
  const memberships = await Membership.find({ userId });
  const myUnitIds = memberships.map(m => m.orgUnitId as Types.ObjectId);

  if (myUnitIds.length === 0) return [];
  const descendants = await OrgUnit.find({
    $or: [
      { _id: { $in: myUnitIds } },       // include own nodes
      { ancestors: { $in: myUnitIds } }, // include all descendants
    ],
  }).select("_id");

  return descendants.map(d => d._id.toString());
}
