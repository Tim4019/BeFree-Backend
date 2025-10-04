import { Router } from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { JWT_SECRET, TOKEN_EXPIRES_IN } from "../config.js";
import {
  createUser,
  findUserByEmail,
  sanitizeUser,
} from "../storage/users.js";
import { authRequired } from "../middleware/auth.js";

const router = Router();

const isProduction = process.env.NODE_ENV === "production";
const cookieOptions = {
  httpOnly: true,
  sameSite: isProduction ? "none" : "lax",
  secure: isProduction,
  path: "/",
  maxAge: 1000 * 60 * 60 * 24 * 7,
};

function issueToken(user) {
  return jwt.sign({ userId: user._id }, JWT_SECRET, {
    expiresIn: TOKEN_EXPIRES_IN,
  });
}

function attachToken(res, token) {
  res.cookie("token", token, cookieOptions);
}

router.post("/signup", async (req, res, next) => {
  try {
    const { name, email, password } = req.body ?? {};
    if (!name || !email || !password) {
      return res.status(400).json({ error: "Name, email and password are required" });
    }

    const user = await createUser({ name, email, password });
    const token = issueToken(user);
    attachToken(res, token);

    return res.status(201).json({ authToken: token, payload: user });
  } catch (error) {
    if (error.code === "EMAIL_IN_USE") {
      error.status = 409;
    }
    return next(error);
  }
});

router.post("/login", async (req, res, next) => {
  try {
    const { email, password } = req.body ?? {};
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    const user = await findUserByEmail(email);
    if (!user) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const safeUser = sanitizeUser(user);
    const token = issueToken(user);
    attachToken(res, token);

    return res.json({ authToken: token, payload: safeUser });
  } catch (error) {
    return next(error);
  }
});

router.post("/logout", (req, res) => {
  res.clearCookie("token", cookieOptions);
  return res.status(204).send();
});

router.get("/verify", authRequired, (req, res) => {
  return res.json({ payload: req.user });
});

export default router;
