import { Router } from "express";
import { authRequired } from "../middleware/auth.js";
import {
  findUserById,
  sanitizeUser,
  updateUserPassword,
  updateUserProfile,
} from "../storage/users.js";

const router = Router();

router.patch("/me", authRequired, async (req, res, next) => {
  try {
    const updated = await updateUserProfile(req.user._id, req.body ?? {});
    if (!updated) {
      return res.status(404).json({ error: "User not found" });
    }
    return res.json(updated);
  } catch (error) {
    if (error.code === "EMAIL_IN_USE") {
      error.status = 409;
    }
    return next(error);
  }
});

router.patch("/me/password", authRequired, async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body ?? {};
    if (!currentPassword || !newPassword) {
      return res
        .status(400)
        .json({ error: "Current password and new password are required" });
    }

    await updateUserPassword(req.user._id, { currentPassword, newPassword });
    const fresh = await findUserById(req.user._id);
    return res.json({
      message: "Password updated successfully",
      payload: sanitizeUser(fresh),
    });
  } catch (error) {
    if (error.code === "INVALID_CREDENTIALS") {
      return res.status(401).json({ error: "Current password is incorrect" });
    }
    return next(error);
  }
});

export default router;
