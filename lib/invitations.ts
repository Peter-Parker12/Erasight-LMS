import { randomBytes } from "crypto";
import { Role } from "@prisma/client";

import { db } from "@/lib/db";
import { sendInvitationEmail } from "@/lib/mail";
import { ActionError } from "@/lib/safe-action";

const INVITE_EXPIRY_DAYS = 7;

export type ClassGrantInput = { classId: string; accessExpiresAt: Date | null };

// Shared by the single-invite action (actions/invitations.ts) and the bulk
// Excel import route, so both paths create invitations identically —
// dedupe/validation rules, token generation, and the email all live here once.
export async function createInvitationRecord({
  email,
  name,
  role,
  classGrants,
  invitedById,
  invitedByName,
}: {
  email: string;
  name: string;
  role: Role;
  classGrants: ClassGrantInput[];
  invitedById: string;
  invitedByName: string;
}) {
  const normalizedEmail = email.toLowerCase();

  if (role !== Role.STUDENT && classGrants.length > 0) {
    throw new ActionError("Class access can only be granted to students.");
  }

  const classIds = classGrants.map((g) => g.classId);
  if (new Set(classIds).size !== classIds.length) {
    throw new ActionError("Duplicate class selected.");
  }

  if (classIds.length > 0) {
    const foundClasses = await db.class.findMany({
      where: { id: { in: classIds } },
      select: { id: true },
    });
    if (foundClasses.length !== classIds.length) {
      throw new ActionError("One or more selected classes could not be found.");
    }
  }

  const existingUser = await db.user.findUnique({ where: { email: normalizedEmail } });
  if (existingUser) throw new ActionError("A user with this email already exists.");

  // Superseding any prior unaccepted invite keeps at most one pending invite per email.
  await db.invitation.deleteMany({ where: { email: normalizedEmail, acceptedAt: null } });

  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + INVITE_EXPIRY_DAYS * 24 * 60 * 60 * 1000);

  const invitation = await db.invitation.create({
    data: {
      email: normalizedEmail,
      name,
      role,
      token,
      invitedById,
      expiresAt,
      classGrants: {
        create: classGrants.map((g) => ({
          classId: g.classId,
          accessExpiresAt: g.accessExpiresAt,
        })),
      },
    },
    include: {
      classGrants: {
        include: { class: { include: { course: { select: { title: true } } } } },
      },
    },
  });

  const classNames = invitation.classGrants.map((g) => `${g.class.course.title} — ${g.class.name}`);

  const inviteUrl = `${process.env.NEXT_PUBLIC_APP_URL}/invite/${token}`;
  await sendInvitationEmail({
    to: normalizedEmail,
    role,
    inviteUrl,
    invitedByName,
    classNames: classNames.length > 0 ? classNames : undefined,
  });

  return invitation;
}
