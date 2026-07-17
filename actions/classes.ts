"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { Role } from "@prisma/client";

import { db } from "@/lib/db";
import { authActionClient, assertRole } from "@/lib/safe-action";

const dateOrEmpty = z
  .string()
  .optional()
  .transform((v) => (v ? new Date(v) : undefined));

export const createClass = authActionClient
  .schema(
    z.object({
      courseId: z.string().uuid(),
      name: z.string().min(1, "Name is required").max(200),
      instructorId: z.string().optional(),
      startDate: dateOrEmpty,
      endDate: dateOrEmpty,
    })
  )
  .action(async ({ parsedInput, ctx }) => {
    assertRole(ctx.user, Role.ADMIN);

    const klass = await db.class.create({
      data: {
        courseId: parsedInput.courseId,
        name: parsedInput.name,
        instructorId: parsedInput.instructorId || null,
        startDate: parsedInput.startDate,
        endDate: parsedInput.endDate,
      },
    });

    revalidatePath("/classes");
    return { class: klass };
  });

export const updateClass = authActionClient
  .schema(
    z.object({
      classId: z.string().uuid(),
      name: z.string().min(1, "Name is required").max(200),
      instructorId: z.string().optional(),
      startDate: dateOrEmpty,
      endDate: dateOrEmpty,
    })
  )
  .action(async ({ parsedInput, ctx }) => {
    assertRole(ctx.user, Role.ADMIN);

    const klass = await db.class.update({
      where: { id: parsedInput.classId },
      data: {
        name: parsedInput.name,
        instructorId: parsedInput.instructorId || null,
        startDate: parsedInput.startDate,
        endDate: parsedInput.endDate,
      },
    });

    revalidatePath("/classes");
    revalidatePath(`/classes/${parsedInput.classId}`);
    return { class: klass };
  });

export const deleteClass = authActionClient
  .schema(z.object({ classId: z.string().uuid() }))
  .action(async ({ parsedInput, ctx }) => {
    assertRole(ctx.user, Role.ADMIN);

    await db.class.delete({ where: { id: parsedInput.classId } });

    revalidatePath("/classes");
    return { success: true };
  });
