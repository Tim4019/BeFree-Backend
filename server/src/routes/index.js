import { Router } from "express";
import authRouter from "./auth.routes.js";
import logsRouter from "./logs.routes.js";
import milestonesRouter from "./milestones.routes.js";
import usersRouter from "./users.routes.js";

const router = Router();

router.use("/auth", authRouter);
router.use("/logs", logsRouter);
router.use("/milestones", milestonesRouter);
router.use("/users", usersRouter);

export default router;
