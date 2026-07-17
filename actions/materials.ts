"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { MaterialType, Role } from "@prisma/client";

import { db } from "@/lib/db";
import { authActionClient, assertRole, ActionError } from "@/lib/safe-action";

async function nextOrder(sessionId: string) {
  const last = await db.material.findFirst({
    where: { sessionId },
    orderBy: { order: "desc" },
    select: { order: true },
  });
  return (last?.order ?? -1) + 1;
}

const baseSchema = z.object({
  sessionId: z.string().uuid(),
  title: z.string().min(1, "Title is required").max(200),
});

export const createMaterial = authActionClient
  .schema(
    z.discriminatedUnion("type", [
      baseSchema.extend({
        type: z.literal(MaterialType.LINK),
        url: z.string().url("Enter a valid URL"),
      }),
      baseSchema.extend({
        type: z.literal(MaterialType.TEXT),
        content: z.string().min(1, "Content is required").max(20000),
      }),
      baseSchema.extend({
        type: z.enum([MaterialType.VIDEO, MaterialType.DOCUMENT]),
        fileKey: z.string().min(1),
        fileType: z.string().min(1),
        fileSize: z.number().int().positive(),
      }),
    ])
  )
  .action(async ({ parsedInput, ctx }) => {
    assertRole(ctx.user, Role.ADMIN, Role.INSTRUCTOR);

    const session = await db.session.findUnique({
      where: { id: parsedInput.sessionId },
      include: { module: true },
    });
    if (!session) throw new ActionError("Session not found.");

    const material = await db.material.create({
      data: {
        sessionId: parsedInput.sessionId,
        title: parsedInput.title,
        type: parsedInput.type,
        url: parsedInput.type === MaterialType.LINK ? parsedInput.url : undefined,
        content: parsedInput.type === MaterialType.TEXT ? parsedInput.content : undefined,
        fileKey: "fileKey" in parsedInput ? parsedInput.fileKey : undefined,
        fileType: "fileType" in parsedInput ? parsedInput.fileType : undefined,
        fileSize: "fileSize" in parsedInput ? parsedInput.fileSize : undefined,
        order: await nextOrder(parsedInput.sessionId),
      },
    });

    revalidatePath(`/courses/${session.module.courseId}`);
    return { material };
  });

export const deleteMaterial = authActionClient
  .schema(z.object({ materialId: z.string().uuid() }))
  .action(async ({ parsedInput, ctx }) => {
    assertRole(ctx.user, Role.ADMIN, Role.INSTRUCTOR);

    const material = await db.material.delete({
      where: { id: parsedInput.materialId },
      include: { session: { include: { module: true } } },
    });

    revalidatePath(`/courses/${material.session.module.courseId}`);
    return { success: true };
  });

export const moveMaterial = authActionClient
  .schema(z.object({ materialId: z.string().uuid(), direction: z.enum(["up", "down"]) }))
  .action(async ({ parsedInput, ctx }) => {
    assertRole(ctx.user, Role.ADMIN, Role.INSTRUCTOR);

    const current = await db.material.findUnique({
      where: { id: parsedInput.materialId },
      include: { session: { include: { module: true } } },
    });
    if (!current) throw new ActionError("Material not found.");

    const neighbor = await db.material.findFirst({
      where: {
        sessionId: current.sessionId,
        order: parsedInput.direction === "up" ? { lt: current.order } : { gt: current.order },
      },
      orderBy: { order: parsedInput.direction === "up" ? "desc" : "asc" },
    });
    if (!neighbor) return { success: true };

    await db.$transaction([
      db.material.update({ where: { id: current.id }, data: { order: neighbor.order } }),
      db.material.update({ where: { id: neighbor.id }, data: { order: current.order } }),
    ]);

    revalidatePath(`/courses/${current.session.module.courseId}`);
    return { success: true };
  });
