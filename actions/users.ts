"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { Role } from "@prisma/client";

import { db } from "@/lib/db";
import { authActionClient, assertRole, ActionError } from "@/lib/safe-action";

export const updateUserRole = authActionClient
  .schema(z.object({ userId: z.string().min(1), role: z.nativeEnum(Role) }))
  .action(async ({ parsedInput, ctx }) => {
    assertRole(ctx.user, Role.ADMIN);

    if (parsedInput.userId === ctx.user.id) {
      throw new ActionError("You can't change your own role.");
    }

    const user = await db.user.update({
      where: { id: parsedInput.userId },
      data: { role: parsedInput.role },
    });

    revalidatePath("/admin/users");
    return { user };
  });
