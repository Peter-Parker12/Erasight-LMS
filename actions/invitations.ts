"use server";

import { randomBytes } from "crypto";
import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { Role } from "@prisma/client";

import { db } from "@/lib/db";
import { authActionClient, publicActionClient, assertRole, ActionError } from "@/lib/safe-action";
import { sendInvitationEmail } from "@/lib/mail";

const INVITE_EXPIRY_DAYS = 7;

export const createInvitation = authActionClient
  .schema(z.object({ email: z.string().email(), role: z.nativeEnum(Role) }))
  .action(async ({ parsedInput, ctx }) => {
    assertRole(ctx.user, Role.ADMIN);

    const email = parsedInput.email.toLowerCase();

    const existingUser = await db.user.findUnique({ where: { email } });
    if (existingUser) throw new ActionError("A user with this email already exists.");

    // Superseding any prior unaccepted invite keeps at most one pending invite per email.
    await db.invitation.deleteMany({ where: { email, acceptedAt: null } });

    const token = randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + INVITE_EXPIRY_DAYS * 24 * 60 * 60 * 1000);

    const invitation = await db.invitation.create({
      data: { email, role: parsedInput.role, token, invitedById: ctx.user.id, expiresAt },
    });

    const inviteUrl = `${process.env.NEXT_PUBLIC_APP_URL}/invite/${token}`;
    await sendInvitationEmail({
      to: email,
      role: parsedInput.role,
      inviteUrl,
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
    const invitation = await db.invitation.findUnique({ where: { token: parsedInput.token } });
    if (!invitation) throw new ActionError("Invalid or expired invitation.");
    if (invitation.acceptedAt) throw new ActionError("This invitation has already been used.");
    if (invitation.expiresAt < new Date()) throw new ActionError("This invitation has expired.");

    const existingUser = await db.user.findUnique({ where: { email: invitation.email } });
    if (existingUser) throw new ActionError("An account with this email already exists.");

    const passwordHash = await bcrypt.hash(parsedInput.password, 12);

    await db.$transaction([
      db.user.create({
        data: {
          email: invitation.email,
          name: parsedInput.name,
          role: invitation.role,
          passwordHash,
        },
      }),
      db.invitation.update({ where: { id: invitation.id }, data: { acceptedAt: new Date() } }),
    ]);

    return { email: invitation.email };
  });
