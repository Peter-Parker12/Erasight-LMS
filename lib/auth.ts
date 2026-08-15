import NextAuth from "next-auth";
import type { DefaultSession } from "next-auth";
import type { JWT } from "next-auth/jwt";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { cache } from "react";

import { db } from "@/lib/db";
import type { Role } from "@prisma/client";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: Role;
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: Role;
  }
}

const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const { handlers, auth, signIn, signOut } = NextAuth({
  // Self-hosted behind Caddy — trust the forwarded Host header.
  trustHost: true,
  session: { strategy: "jwt" },
  pages: { signIn: "/sign-in" },
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      authorize: async (raw) => {
        const parsed = credentialsSchema.safeParse(raw);
        if (!parsed.success) return null;

        const user = await db.user.findUnique({
          where: { email: parsed.data.email.toLowerCase() },
        });
        if (!user) return null;

        const valid = await bcrypt.compare(parsed.data.password, user.passwordHash);
        if (!valid) return null;

        return { id: user.id, email: user.email, name: user.name, role: user.role };
      },
    }),
  ],
  callbacks: {
    // Role is embedded into the JWT at sign-in and persists for the life of
    // the session cookie — a role change (e.g. promoting a Student to
    // Instructor) takes effect the next time that user signs in, not
    // instantly. Acceptable trade-off for an internal tool at this scale.
    jwt: async ({ token, user }): Promise<JWT> => {
      if (user) {
        token.id = user.id as string;
        token.role = (user as { role: Role }).role;
      }
      return token;
    },
    session: async ({ session, token }) => {
      session.user.id = token.id;
      session.user.role = token.role;
      return session;
    },
  },
});

export class UnauthorizedError extends Error {
  constructor(message = "Unauthorized") {
    super(message);
    this.name = "UnauthorizedError";
  }
}

// React-cached so multiple calls within one request share a single session lookup.
export const getCurrentUser = cache(async () => {
  const session = await auth();
  if (!session?.user) return null;
  return session.user;
});

export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) throw new UnauthorizedError();
  return user;
}

export async function requireRole(...roles: Role[]) {
  const user = await requireUser();
  if (!roles.includes(user.role)) {
    throw new UnauthorizedError("You don't have permission to do this.");
  }
  return user;
}
