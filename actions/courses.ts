"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { CourseStatus, Role } from "@prisma/client";

import { db } from "@/lib/db";
import { authActionClient, assertRole } from "@/lib/safe-action";

export const createCourse = authActionClient
  .schema(
    z.object({
      title: z.string().min(1, "Title is required").max(200),
      description: z.string().max(2000).optional(),
    })
  )
  .action(async ({ parsedInput, ctx }) => {
    assertRole(ctx.user, Role.ADMIN, Role.INSTRUCTOR);

    const course = await db.course.create({
      data: {
        title: parsedInput.title,
        description: parsedInput.description,
        createdById: ctx.user.id,
      },
    });

    revalidatePath("/courses");
    return { course };
  });

export const updateCourse = authActionClient
  .schema(
    z.object({
      courseId: z.string().uuid(),
      title: z.string().min(1, "Title is required").max(200),
      description: z.string().max(2000).optional(),
      status: z.nativeEnum(CourseStatus),
    })
  )
  .action(async ({ parsedInput, ctx }) => {
    assertRole(ctx.user, Role.ADMIN, Role.INSTRUCTOR);

    const course = await db.course.update({
      where: { id: parsedInput.courseId },
      data: {
        title: parsedInput.title,
        description: parsedInput.description,
        status: parsedInput.status,
      },
    });

    revalidatePath("/courses");
    revalidatePath(`/courses/${parsedInput.courseId}`);
    return { course };
  });

export const deleteCourse = authActionClient
  .schema(z.object({ courseId: z.string().uuid() }))
  .action(async ({ parsedInput, ctx }) => {
    assertRole(ctx.user, Role.ADMIN, Role.INSTRUCTOR);

    await db.course.delete({ where: { id: parsedInput.courseId } });

    revalidatePath("/courses");
    return { success: true };
  });
