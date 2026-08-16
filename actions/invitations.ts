"use server";

import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { Role } from "@prisma/client";

import { db } from "@/lib/db";
import { authActionClient, publicActionClient, assertRole, ActionError } from "@/lib/safe-action";
import { createInvitationRecord } from "@/lib/invitations";

const classGrantSchema = z.object({
  classId: z.string().uuid(),
  accessExpiresAt: z.string().optional(), // "" | undefined = no expiry
});

export const createInvitation = authActionClient
  .schema(
    z.object({
      email: z.string().email(),
      name: z.string().min(1, "Name is required").max(200),
      role: z.nativeEnum(Role),
      classGrants: z.array(classGrantSchema).default([]),
    })
  )
  .action(async ({ parsedInput, ctx }) => {
    assertRole(ctx.user, Role.ADMIN);

    const invitation = await createInvitationRecord({
      email: parsedInput.email,
      name: parsedInput.name,
      role: parsedInput.role,
      classGrants: parsedInput.classGrants.map((g) => ({
        classId: g.classId,
        accessExpiresAt: g.accessExpiresAt ? new Date(g.accessExpiresAt) : null,
      })),
      invitedById: ctx.user.id,
      invitedByName: ctx.user.name,
    });

    revalidatePath("/admin/users");
    return { invitation };
  });

export const revokeInvitation = authActionClient
  .schema(z.object({ invitationId: z.string().uuid() }))
  .action(async ({ parsedInput, ctx }) => {
    assertRole(ctx.user, Role.ADMIN);

    await db.invitation.delete({ where: { id: parsedInput.invitationId } });

    revalidatePath("/admin/users");
    return { success: true };
  });

export const acceptInvitation = publicActionClient
  .schema(
    z.object({
      token: z.string().min(1),
      name: z.string().min(1, "Name is required").max(200),
      password: z.string().min(8, "Password must be at least 8 characters"),
    })
  )
  .action(async ({ parsedInput }) => {
    const invitation = await db.invitation.findUnique({
      where: { token: parsedInput.token },
      include: { classGrants: true },
    });
    if (!invitation) throw new ActionError("Invalid or expired invitation.");
    if (invitation.acceptedAt) throw new ActionError("This invitation has already been used.");
    if (invitation.expiresAt < new Date()) throw new ActionError("This invitation has expired.");

    const existingUser = await db.user.findUnique({ where: { email: invitation.email } });
    if (existingUser) throw new ActionError("An account with this email already exists.");

    const passwordHash = await bcrypt.hash(parsedInput.password, 12);

    await db.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email: invitation.email,
          name: parsedInput.name,
          role: invitation.role,
          passwordHash,
        },
      });

      if (invitation.classGrants.length > 0) {
        // Re-verify the granted classes still exist — guards the race where a
        // class was deleted between invite and accept.
        const survivingClasses = await tx.class.findMany({
          where: { id: { in: invitation.classGrants.map((g) => g.classId) } },
          select: { id: true },
        });
        const survivingIds = new Set(survivingClasses.map((c) => c.id));
        const grantsToApply = invitation.classGrants.filter((g) => survivingIds.has(g.classId));

        if (grantsToApply.length > 0) {
          await tx.enrollment.createMany({
            data: grantsToApply.map((g) => ({
              classId: g.classId,
              studentId: user.id,
              accessExpiresAt: g.accessExpiresAt,
            })),
            skipDuplicates: true,
          });
        }
      }

      await tx.invitation.update({ where: { id: invitation.id }, data: { acceptedAt: new Date() } });
    });

    return { email: invitation.email };
  });
