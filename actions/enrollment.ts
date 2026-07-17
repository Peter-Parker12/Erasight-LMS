"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { Role } from "@prisma/client";

import { db } from "@/lib/db";
import { authActionClient, assertRole, ActionError } from "@/lib/safe-action";

export const enrollStudent = authActionClient
  .schema(z.object({ classId: z.string().uuid(), studentId: z.string().min(1) }))
  .action(async ({ parsedInput, ctx }) => {
    assertRole(ctx.user, Role.ADMIN);

    const existing = await db.enrollment.findUnique({
      where: { classId_studentId: { classId: parsedInput.classId, studentId: parsedInput.studentId } },
    });
    if (existing) throw new ActionError("Student is already enrolled in this class.");

    const enrollment = await db.enrollment.create({
      data: { classId: parsedInput.classId, studentId: parsedInput.studentId },
    });

    revalidatePath(`/classes/${parsedInput.classId}`);
    return { enrollment };
  });

export const removeEnrollment = authActionClient
  .schema(z.object({ enrollmentId: z.string().uuid() }))
  .action(async ({ parsedInput, ctx }) => {
    assertRole(ctx.user, Role.ADMIN);

    const enrollment = await db.enrollment.delete({ where: { id: parsedInput.enrollmentId } });

    revalidatePath(`/classes/${enrollment.classId}`);
    return { success: true };
  });
