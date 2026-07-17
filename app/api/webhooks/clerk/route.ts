import { verifyWebhook } from "@clerk/nextjs/webhooks";
import type { NextRequest } from "next/server";
import { Role } from "@prisma/client";

import { db } from "@/lib/db";

// Bootstrap mechanism: comma-separated emails in ADMIN_EMAILS are created as
// ADMIN on first sign-in. Every other new user starts as STUDENT; promotion
// to INSTRUCTOR/ADMIN after that happens from /admin/users.
const ADMIN_EMAILS = (process.env.ADMIN_EMAILS ?? "")
  .split(",")
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);

export async function POST(req: NextRequest) {
  let evt;
  try {
    evt = await verifyWebhook(req);
  } catch {
    return new Response("Invalid webhook signature", { status: 400 });
  }

  if (evt.type === "user.created" || evt.type === "user.updated") {
    const { id, email_addresses, primary_email_address_id, first_name, last_name, image_url } =
      evt.data;

    const primaryEmail =
      email_addresses.find((e) => e.id === primary_email_address_id)?.email_address ??
      email_addresses[0]?.email_address;

    if (!primaryEmail) {
      return new Response("No email on user", { status: 400 });
    }

    const name = [first_name, last_name].filter(Boolean).join(" ") || primaryEmail;
    const role = ADMIN_EMAILS.includes(primaryEmail.toLowerCase()) ? Role.ADMIN : undefined;

    await db.user.upsert({
      where: { id },
      create: {
        id,
        email: primaryEmail,
        name,
        imageUrl: image_url,
        ...(role ? { role } : {}),
      },
      update: {
        email: primaryEmail,
        name,
        imageUrl: image_url,
        ...(role ? { role } : {}),
      },
    });
  }

  if (evt.type === "user.deleted" && evt.data.id) {
    await db.user.deleteMany({ where: { id: evt.data.id } });
  }

  return new Response("OK", { status: 200 });
}
