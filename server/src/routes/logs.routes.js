import { Router } from "express";
import { authRequired } from "../middleware/auth.js";
import { createLogForUser, getLogsForUser } from "../storage/logs.js";

const router = Router();

router.get("/", authRequired, async (req, res, next) => {
  try {
    const limitParam = Number.parseInt(req.query.limit, 10);
    const limit = Number.isNaN(limitParam) ? undefined : Math.max(limitParam, 0);
    const logs = await getLogsForUser(req.user._id, { limit });
    return res.json(logs);
  } catch (error) {
    return next(error);
  }
});

router.post("/", authRequired, async (req, res, next) => {
  try {
    const log = await createLogForUser(req.user._id, req.body ?? {});
    return res.status(201).json(log);
  } catch (error) {
    return next(error);
  }
});

export default router;
