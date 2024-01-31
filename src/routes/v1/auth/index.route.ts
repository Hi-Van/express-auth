import express, { Router, Request, Response } from "express";
import * as z from "zod";
import { prisma, lucia } from "../../../middleware/index.middleware.js";
import { generateId } from "lucia";
import { Argon2id } from "oslo/password";
import { LoginRequest } from "./types.js";

const authRouter: Router = express.Router();
const argon = new Argon2id();

authRouter.get("/health", (req: Request, res: Response) => {
  res.sendStatus(200);
});

authRouter.post("/register", async (req: LoginRequest, res: Response) => {
  const schema = z.object({
    username: z.string().min(3).max(32),
    email: z.string().email(),
    password: z.string().min(8).max(32),
  });
  const result = schema.safeParse(req.body);

  if (!result.success) {
    return res.status(400).send(result.error);
  }

  const { username, email, password } = result.data;
  const hashedPassword = await argon.hash(password);
  const userId = generateId(16);

  const user = await prisma.createUser(userId, username, email, hashedPassword);
  const session = await lucia.createSession(user.id, {});

  return res.status(200).json({token: session.id, userId: user.id, username});
});

authRouter.post("/login", async (req: LoginRequest, res: Response) => {
  const schema = z.object({
    username: z.string().min(3).max(32),
    password: z.string().min(8).max(32),
  });
  const result = schema.safeParse(req.body);

  if (!result.success) {
    return res.status(400).send(result.error);
  }

  const { username, password } = result.data;
  const user = await prisma.findUserByUsername(username);

  if (!user) {
    return res.status(400).send("User not found");
  }

  const validatePassword = await argon.verify(user.hashed_password, password);
  if (!validatePassword) {
    return res.status(400).send("Invalid password");
  }

  const session = await lucia.createSession(user.id, {});
  return res.status(200).json({token: session.id, userId: user.id, username});
});

authRouter.post("/logout", async (req: Request, res: Response) => {
  const token = req.headers.authorization?.slice(7) ?? "";
  const userId = req.headers["user-id"] ? req.headers["user-id"] as string : "";

  if (token === "" || userId === "") {
    return res.sendStatus(403);
  }

  const { user, session } = await lucia.validateSession(token);

  if (!user || !session || user.id !== userId) {
    return res.sendStatus(400);
  }

  await lucia.invalidateSession(session.id);
  return res.sendStatus(200);
});

authRouter.get("/validate", async (req: Request, res: Response) => {
  const token = req.headers.authorization?.slice(7) ?? "";
  const userId = req.headers["user-id"] ? req.headers["user-id"] as string : "";
  if (token === "" || userId === "") {
    return res.sendStatus(403);
  }

  const { user, session } = await lucia.validateSession(token);

  return res.status(200).json({isAuthorized: session && user && user.id === userId});
});

export default authRouter;
