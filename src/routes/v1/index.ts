import { Router } from "express";
import authrouter from "./auth.route.js";

const router = Router();

router.use("/auth", authrouter);

export default router;
