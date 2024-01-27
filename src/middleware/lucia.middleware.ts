import { Lucia } from "lucia";
import { prisma } from "./prisma.middleware.js";
import { PrismaAdapter } from "@lucia-auth/adapter-prisma";

interface DatabaseUserAttributes {
  username: string;
  email: string;
}

const [session, user] = prisma.adapt();
const adapter = new PrismaAdapter(session, user);

export const lucia = new Lucia(adapter, {
  sessionCookie: {
    attributes: {
      secure: process.env.NODE_ENV === "production",
    },
  },

  getUserAttributes: (attributes) => {
    return {
      username: attributes.username,
      email: attributes.email,
    };
  },
});

declare module "lucia" {
  interface Register {
    Lucia: typeof lucia;
    DatabaseUserAttributes: DatabaseUserAttributes;
  }
}
