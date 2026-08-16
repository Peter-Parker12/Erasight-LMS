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

// Reconciles a student's entire set of class memberships in one save (add,
// remove, and/or re-date several at once) — distinct from enrollStudent /
// removeEnrollment above, which stay scoped to one class's own roster UI.
export const setStudentClassAccess = authActionClient
  .schema(
    z.object({
      studentId: z.string().min(1),
      grants: z.array(
        z.object({
          classId: z.string().uuid(),
          accessExpiresAt: z.string().optional(),
        })
      ),
    })
  )
  .action(async ({ parsedInput, ctx }) => {
    assertRole(ctx.user, Role.ADMIN);

    const student = await db.user.findUnique({ where: { id: parsedInput.studentId } });
    if (!student || student.role !== Role.STUDENT) {
      throw new ActionError("This user is not a student.");
    }

    const classIds = parsedInput.grants.map((g) => g.classId);
    if (new Set(classIds).size !== classIds.length) {
      throw new ActionError("Duplicate class selected.");
    }

    const desired = new Map(
      parsedInput.grants.map((g) => [g.classId, g.accessExpiresAt ? new Date(g.accessExpiresAt) : null])
    );

    const existing = await db.enrollment.findMany({ where: { studentId: parsedInput.studentId } });

    const toDelete = existing.filter((e) => !desired.has(e.classId)).map((e) => e.id);
    const toUpdate = existing.filter((e) => desired.has(e.classId));
    const toCreate = [...desired.keys()].filter(
      (classId) => !existing.some((e) => e.classId === classId)
    );

    await db.$transaction([
      ...(toDelete.length ? [db.enrollment.deleteMany({ where: { id: { in: toDelete } } })] : []),
      ...toUpdate.map((e) =>
        db.enrollment.update({
          where: { id: e.id },
          data: { accessExpiresAt: desired.get(e.classId)! },
        })
      ),
      ...(toCreate.length
        ? [
            db.enrollment.createMany({
              data: toCreate.map((classId) => ({
                classId,
                studentId: parsedInput.studentId,
                accessExpiresAt: desired.get(classId)!,
              })),
            }),
          ]
        : []),
    ]);

    revalidatePath("/admin/users");
    revalidatePath("/classes");
    return { success: true };
  });
