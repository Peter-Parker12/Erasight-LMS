"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { Role } from "@prisma/client";

import { db } from "@/lib/db";
import { authActionClient, assertRole, ActionError } from "@/lib/safe-action";

async function nextOrder(courseId: string) {
  const last = await db.courseModule.findFirst({
    where: { courseId },
    orderBy: { order: "desc" },
    select: { order: true },
  });
  return (last?.order ?? -1) + 1;
}

export const createModule = authActionClient
  .schema(
    z.object({
      courseId: z.string().uuid(),
      title: z.string().min(1, "Title is required").max(200),
    })
  )
  .action(async ({ parsedInput, ctx }) => {
    assertRole(ctx.user, Role.ADMIN, Role.INSTRUCTOR);

    const module_ = await db.courseModule.create({
      data: {
        courseId: parsedInput.courseId,
        title: parsedInput.title,
        order: await nextOrder(parsedInput.courseId),
      },
    });

    revalidatePath(`/courses/${parsedInput.courseId}`);
    return { module: module_ };
  });

export const updateModule = authActionClient
  .schema(z.object({ moduleId: z.string().uuid(), title: z.string().min(1).max(200) }))
  .action(async ({ parsedInput, ctx }) => {
    assertRole(ctx.user, Role.ADMIN, Role.INSTRUCTOR);

    const module_ = await db.courseModule.update({
      where: { id: parsedInput.moduleId },
      data: { title: parsedInput.title },
    });

    revalidatePath(`/courses/${module_.courseId}`);
    return { module: module_ };
  });

export const deleteModule = authActionClient
  .schema(z.object({ moduleId: z.string().uuid() }))
  .action(async ({ parsedInput, ctx }) => {
    assertRole(ctx.user, Role.ADMIN, Role.INSTRUCTOR);

    const module_ = await db.courseModule.delete({ where: { id: parsedInput.moduleId } });

    revalidatePath(`/courses/${module_.courseId}`);
    return { success: true };
  });

export const moveModule = authActionClient
  .schema(z.object({ moduleId: z.string().uuid(), direction: z.enum(["up", "down"]) }))
  .action(async ({ parsedInput, ctx }) => {
    assertRole(ctx.user, Role.ADMIN, Role.INSTRUCTOR);

    const current = await db.courseModule.findUnique({ where: { id: parsedInput.moduleId } });
    if (!current) throw new ActionError("Module not found.");

    const neighbor = await db.courseModule.findFirst({
      where: {
        courseId: current.courseId,
        order: parsedInput.direction === "up" ? { lt: current.order } : { gt: current.order },
      },
      orderBy: { order: parsedInput.direction === "up" ? "desc" : "asc" },
    });
    if (!neighbor) return { success: true };

    await db.$transaction([
      db.courseModule.update({ where: { id: current.id }, data: { order: neighbor.order } }),
      db.courseModule.update({ where: { id: neighbor.id }, data: { order: current.order } }),
    ]);

    revalidatePath(`/courses/${current.courseId}`);
    return { success: true };
  });
