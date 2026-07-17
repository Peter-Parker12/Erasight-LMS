import { createSafeActionClient } from "next-safe-action";
import { auth } from "@clerk/nextjs/server";

import { db } from "@/lib/db";
import type { Role } from "@prisma/client";

export class ActionError extends Error {}

const actionClient = createSafeActionClient({
  handleServerError(e) {
    if (e instanceof ActionError) return e.message;
    console.error("Action error:", e);
    return "Something went wrong.";
  },
});

// Any signed-in user with a synced local User row.
export const authActionClient = actionClient.use(async ({ next }) => {
  const { userId } = await auth();
  if (!userId) throw new ActionError("Unauthorized");

  const user = await db.user.findUnique({ where: { id: userId } });
  if (!user) throw new ActionError("Unauthorized");

  return next({ ctx: { user } });
});

// Throws inside an action's server code function when the current user's role isn't allowed.
export function assertRole(user: { role: Role }, ...roles: Role[]) {
  if (!roles.includes(user.role)) {
    throw new ActionError("You don't have permission to do this.");
  }
}
