import { auth } from "@clerk/nextjs/server";
import { cache } from "react";

import { db } from "@/lib/db";
import type { Role } from "@prisma/client";

export class UnauthorizedError extends Error {
  constructor(message = "Unauthorized") {
    super(message);
    this.name = "UnauthorizedError";
  }
}

// React-cached so multiple calls within one request share a single DB lookup.
export const getCurrentUser = cache(async () => {
  const { userId } = await auth();
  if (!userId) return null;

  return db.user.findUnique({ where: { id: userId } });
});

export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) throw new UnauthorizedError();
  return user;
}

export async function requireRole(...roles: Role[]) {
  const user = await requireUser();
  if (!roles.includes(user.role)) {
    throw new UnauthorizedError("You don't have permission to do this.");
  }
  return user;
}
