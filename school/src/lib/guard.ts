// src/lib/guard.ts
import { getServerSession } from "next-auth";
import { getCoveredOrgUnitIds } from "./hierarchy";

export async function requireAuth() {
  const session = await getServerSession();
  if (!session?.user?.id) {
    throw Object.assign(new Error("Unauthenticated"), { status: 401 });
  }
  return session.user as { id: string };
}

export async function requireAccessToOrgUnit(orgUnitId: string) {
  const user = await requireAuth();
  const covered = await getCoveredOrgUnitIds(user.id);
  if (!covered.includes(orgUnitId.toString())) {
    throw Object.assign(new Error("Forbidden"), { status: 403 });
  }
  return user;
}
