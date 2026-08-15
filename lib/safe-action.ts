import { createSafeActionClient } from "next-safe-action";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import type { Role } from "@prisma/client";

export class ActionError extends Error {}

// Unauthenticated-safe base client — only for actions that must work before a
// session exists, like accepting an invitation. Everything else should use
// authActionClient below.
export const publicActionClient = createSafeActionClient({
  handleServerError(e) {
    if (e instanceof ActionError) return e.message;
    console.error("Action error:", e);
    return "Something went wrong.";
  },
});

// Any signed-in user.
export const authActionClient = publicActionClient.use(async ({ next }) => {
  const session = await auth();
  if (!session?.user) throw new ActionError("Unauthorized");

  const user = await db.user.findUnique({ where: { id: session.user.id } });
  if (!user) throw new ActionError("Unauthorized");

  return next({ ctx: { user } });
});

// Throws inside an action's server code function when the current user's role isn't allowed.
export function assertRole(user: { role: Role }, ...roles: Role[]) {
  if (!roles.includes(user.role)) {
    throw new ActionError("You don't have permission to do this.");
  }
}
