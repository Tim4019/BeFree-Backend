import jwt from "jsonwebtoken";
import { JWT_SECRET } from "../config.js";
import { findUserById, sanitizeUser } from "../storage/users.js";

function extractToken(req) {
  const header = req.get("Authorization");
  if (header && header.startsWith("Bearer ")) {
    return header.slice(7).trim();
  }
  if (req.cookies?.token) {
    return req.cookies.token;
  }
  return null;
}

export async function authRequired(req, res, next) {
  try {
    const token = extractToken(req);
    if (!token) {
      return res.status(401).json({ error: "Authentication required" });
    }

    const payload = jwt.verify(token, JWT_SECRET);
    if (!payload?.userId) {
      return res.status(401).json({ error: "Invalid token" });
    }

    const user = await findUserById(payload.userId);
    if (!user) {
      return res.status(401).json({ error: "Session expired" });
    }

    req.user = sanitizeUser(user);
    req.tokenPayload = payload;
    return next();
  } catch (error) {
    console.error("authRequired error", error);
    return res.status(401).json({ error: "Authentication failed" });
  }
}
