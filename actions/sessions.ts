"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { Role } from "@prisma/client";

import { db } from "@/lib/db";
import { authActionClient, assertRole, ActionError } from "@/lib/safe-action";

async function nextOrder(moduleId: string) {
  const last = await db.session.findFirst({
    where: { moduleId },
    orderBy: { order: "desc" },
    select: { order: true },
  });
  return (last?.order ?? -1) + 1;
}

export const createSession = authActionClient
  .schema(
    z.object({
      moduleId: z.string().uuid(),
      title: z.string().min(1, "Title is required").max(200),
      description: z.string().max(2000).optional(),
    })
  )
  .action(async ({ parsedInput, ctx }) => {
    assertRole(ctx.user, Role.ADMIN, Role.INSTRUCTOR);

    const module_ = await db.courseModule.findUnique({ where: { id: parsedInput.moduleId } });
    if (!module_) throw new ActionError("Module not found.");

    const session = await db.session.create({
      data: {
        moduleId: parsedInput.moduleId,
        title: parsedInput.title,
        description: parsedInput.description,
        order: await nextOrder(parsedInput.moduleId),
      },
    });

    revalidatePath(`/courses/${module_.courseId}`);
    return { session };
  });

export const updateSession = authActionClient
  .schema(
    z.object({
      sessionId: z.string().uuid(),
      title: z.string().min(1).max(200),
      description: z.string().max(2000).optional(),
    })
  )
  .action(async ({ parsedInput, ctx }) => {
    assertRole(ctx.user, Role.ADMIN, Role.INSTRUCTOR);

    const session = await db.session.update({
      where: { id: parsedInput.sessionId },
      data: { title: parsedInput.title, description: parsedInput.description },
      include: { module: true },
    });

    revalidatePath(`/courses/${session.module.courseId}`);
    return { session };
  });

export const deleteSession = authActionClient
  .schema(z.object({ sessionId: z.string().uuid() }))
  .action(async ({ parsedInput, ctx }) => {
    assertRole(ctx.user, Role.ADMIN, Role.INSTRUCTOR);

    const session = await db.session.delete({
      where: { id: parsedInput.sessionId },
      include: { module: true },
    });

    revalidatePath(`/courses/${session.module.courseId}`);
    return { success: true };
  });

export const moveSession = authActionClient
  .schema(z.object({ sessionId: z.string().uuid(), direction: z.enum(["up", "down"]) }))
  .action(async ({ parsedInput, ctx }) => {
    assertRole(ctx.user, Role.ADMIN, Role.INSTRUCTOR);

    const current = await db.session.findUnique({
      where: { id: parsedInput.sessionId },
      include: { module: true },
    });
    if (!current) throw new ActionError("Session not found.");

    const neighbor = await db.session.findFirst({
      where: {
        moduleId: current.moduleId,
        order: parsedInput.direction === "up" ? { lt: current.order } : { gt: current.order },
      },
      orderBy: { order: parsedInput.direction === "up" ? "desc" : "asc" },
    });
    if (!neighbor) return { success: true };

    await db.$transaction([
      db.session.update({ where: { id: current.id }, data: { order: neighbor.order } }),
      db.session.update({ where: { id: neighbor.id }, data: { order: current.order } }),
    ]);

    revalidatePath(`/courses/${current.module.courseId}`);
    return { success: true };
  });
