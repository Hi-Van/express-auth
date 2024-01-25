import express, { Router, Request, Response } from "express";
import { LuciaError } from "lucia";
import { auth } from "../../middleware/lucia.middleware.js";

const authRouter: Router = express.Router();

authRouter.get("/health", (req: Request, res: Response) => {
  res.status(200).send(null);
});

authRouter.post("/login", async (req: Request, res: Response) => {
  const { username, email, password } = req.body;

  const invalidUsername =
    typeof username !== "string" || username.length < 1 || username.length > 31;
  const invalidEmail =
    typeof email !== "string" ||
    username.length < 1 ||
    username.length > 60 ||
    !username.includes("@") ||
    !username.includes(".");
  const invalidPassword =
    typeof password !== "string" ||
    password.length < 1 ||
    password.length > 255;

  // basic check
  if (invalidUsername) {
    return res.status(400).send("Invalid username");
  }
  if (invalidEmail) {
    return res.status(400).send("Invalid email");
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
    const authRequest = auth.handleRequest(req, res);
    authRequest.setSession(session);
    // redirect to profile page
    return res.status(302).setHeader("Location", "/").end();
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
  const authRequest = auth.handleRequest(req, res);
  const session = await authRequest.validate(); // or `authRequest.validateBearerToken()`
  if (!session) {
    return res.sendStatus(401);
  }
  await auth.invalidateSession(session.sessionId);

  authRequest.setSession(null); // for session cookie

  // redirect back to login page
  return res.status(302).setHeader("Location", "/login").end();
});

authRouter.post("/register", async (req: Request, res: Response) => {
  const { username, email, password } = req.body;

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
    return res.status(400).json({data: `invalid username: ${username}`});
  }
  if (invalidEmail) {
    return res.status(400).json({data: `invalid email: ${email}`});
  }
  if (invalidPassword) {
    return res.status(400).json({data: `invalid password: ${password}`});
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
        email
      },
    });
    const session = await auth.createSession({
      userId: user.userId,
      attributes: {},
    });
    const authRequest = auth.handleRequest(req, res);
    authRequest.setSession(session);
    // redirect to profile page
    return res.status(200).json({success: true});
  } catch (e: any) {
    // this part depends on the database you're using
    // check for unique constraint error in user table
    return res.status(500).json({error: e.message, success: false});
  }
});

export default authRouter;
