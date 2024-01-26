import { Router } from "express";
import authrouter from "./auth/index.route.js";

const router = Router();

router.use("/auth", authrouter);

export default router;
