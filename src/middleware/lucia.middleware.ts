import { lucia } from "lucia";
import { express } from "lucia/middleware";
import { prisma } from "@lucia-auth/adapter-prisma";
import { PrismaClient } from "@prisma/client";

const client = new PrismaClient();

export const auth = lucia({
  adapter: prisma(client),
  env: process.env.NODE_ENV === "development" ? "DEV" : "PROD",
  middleware: express(),

  getUserAttributes: (data) => {
    return {
      username: data.username,
      email: data.email,
    };
  },
});

export type Auth = typeof auth;
