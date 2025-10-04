import { Router } from "express";
import { authRequired } from "../middleware/auth.js";
import {
  ensureDefaultMilestonesForUser,
  getMilestonesForUser,
  updateMilestoneForUser,
} from "../storage/milestones.js";

const router = Router();

router.get("/", authRequired, async (req, res, next) => {
  try {
    await ensureDefaultMilestonesForUser(req.user._id);
    const milestones = await getMilestonesForUser(req.user._id);
    return res.json({ milestones });
  } catch (error) {
    return next(error);
  }
});

router.patch("/:milestoneId", authRequired, async (req, res, next) => {
  try {
    const { milestoneId } = req.params;
    const updated = await updateMilestoneForUser(req.user._id, milestoneId, req.body ?? {});
    if (!updated) {
      return res.status(404).json({ error: "Milestone not found" });
    }
    return res.json(updated);
  } catch (error) {
    return next(error);
  }
});

export default router;
