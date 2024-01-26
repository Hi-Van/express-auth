import express, { Router, Request, Response } from "express";
import { LuciaError } from "lucia";
import { auth } from "../../../middleware/lucia.middleware.js";
import { LoginRequest, RegisterRequest } from "./types.js";

const authRouter: Router = express.Router();

interface SignUpRequest extends Request {
  body: {
    username: string;
    email: string;
    password: string;
  };
}

authRouter.get("/health", (req: Request, res: Response) => {
  res.sendStatus(200);
});

authRouter.post("/login", async (req: LoginRequest, res: Response) => {
  const { username, password } = req.body;

  const invalidUsername = username.length < 1 || username.length > 31;
  const invalidPassword = password.length < 1 || password.length > 255;

  // basic check
  if (invalidUsername) {
    return res.status(400).send("Invalid username");
  }
  if (invalidPassword) {
    return res.status(400).send("Invalid password");
  }

  try {
    // find user by key
    // and validate password
    const key = await auth.useKey("username", username.toLowerCase(), password);
    const session = await auth.createSession({
      userId: key.userId,
      attributes: {},
    });

    // redirect to profile page
    return res.status(200).send({ token: session.sessionId });
  } catch (e) {
    // check for unique constraint error in user table
    if (
      e instanceof LuciaError &&
      (e.message === "AUTH_INVALID_KEY_ID" ||
        e.message === "AUTH_INVALID_PASSWORD")
    ) {
      // user does not exist
      // or invalid password
      return res.status(400).send("Incorrect username or password");
    }

    return res.status(500).send("An unknown error occurred");
  }
});

authRouter.post("/logout", async (req: Request, res: Response) => {
  const token = req.headers.authorization?.slice(7) ?? "";

  try {
    await auth.getSession(token);
    await auth.invalidateSession(token);
    // redirect back to login page
    return res.sendStatus(200);
  } catch (e) {
    if (e instanceof LuciaError && e.message === "AUTH_INVALID_SESSION_ID") {
      // session does not exist
      return res.status(400).send("Invalid session token");
    }

    return res.status(500).send("An unknown error occurred");
  }
});

authRouter.post("/register", async (req: Request, res: Response) => {
  const { username, email, password } = req.body as {
    username: string;
    email: string;
    password: string;
  };

  // basic check
  const invalidUsername =
    typeof username !== "string" || username.length < 1 || username.length > 31;
  const invalidEmail =
    typeof email !== "string" ||
    email.length < 1 ||
    email.length > 60 ||
    !email.includes("@") ||
    !email.includes(".");
  const invalidPassword =
    typeof password !== "string" ||
    password.length < 1 ||
    password.length > 255;

  // basic check
  if (invalidUsername) {
    return res.status(400).json({ data: `invalid username: ${username}` });
  }
  if (invalidEmail) {
    return res.status(400).json({ data: `invalid email: ${email}` });
  }
  if (invalidPassword) {
    return res.status(400).json({ data: `invalid password: ${password}` });
  }
  try {
    const user = await auth.createUser({
      key: {
        providerId: "username", // auth method
        providerUserId: username.toLowerCase(), // unique id when using "username" auth method
        password, // hashed by Lucia
      },
      attributes: {
        username,
        email,
      },
    });
    const session = await auth.createSession({
      userId: user.userId,
      attributes: {},
    });

    // redirect to profile page
    return res.status(200).json({ success: true, token: session.sessionId });
  } catch (e: any) {
    // this part depends on the database you're using
    // check for unique constraint error in user table
    return res
      .status(500)
      .json({ error: e, message: e.message, success: false });
  }
});

authRouter.get("/authorize", async (req: Request, res: Response) => {
  const token = req.headers.authorization?.slice(7) ?? ""; 

  try {
    const session = await auth.getSession(token);
    const user = await auth.getUser(session.userId);

    // redirect to profile page
    return res.status(200).json({ success: true, user });
  } catch (e) {
    if (e instanceof LuciaError && e.message === "AUTH_INVALID_SESSION_ID") {
      // session does not exist
      return res.status(400).json({ success: false });
    }

    return res.status(500).json({ success: false });
  }
});

export default authRouter;
