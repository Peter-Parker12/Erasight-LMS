// Runs after `prisma migrate deploy` on every `docker compose up` (and can be
// run manually for local dev via `npm run bootstrap-admin`). Creates the
// first ADMIN account from INITIAL_ADMIN_* env vars, but only if the User
// table is still empty — safe to run repeatedly, and a no-op once at least
// one account (created via this script or an invitation) exists.
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const db = new PrismaClient({ adapter });

async function main() {
  const userCount = await db.user.count();
  if (userCount > 0) {
    console.log("Users already exist — skipping initial admin bootstrap.");
    return;
  }

  const email = process.env.INITIAL_ADMIN_EMAIL;
  const password = process.env.INITIAL_ADMIN_PASSWORD;
  const name = process.env.INITIAL_ADMIN_NAME || "Admin";

  if (!email || !password) {
    console.log(
      "No users exist yet, but INITIAL_ADMIN_EMAIL/INITIAL_ADMIN_PASSWORD aren't set — skipping."
    );
    return;
  }

  const passwordHash = await bcrypt.hash(password, 12);

  await db.user.create({
    data: {
      email: email.toLowerCase(),
      name,
      passwordHash,
      role: "ADMIN",
    },
  });

  console.log(`Created initial admin: ${email}`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await db.$disconnect();
  });
