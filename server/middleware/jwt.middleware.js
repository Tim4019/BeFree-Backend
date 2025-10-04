const jwt = require("jsonwebtoken");

function authRequired(req, res, next) {
  let token = null;

  const authHeader = req.headers.authorization?.trim();
  if (authHeader) {
    token = authHeader.toLowerCase().startsWith("bearer ")
      ? authHeader.slice(7).trim()
      : authHeader;
  }

  if (!token && req.headers["x-auth-token"]) {
    token = String(req.headers["x-auth-token"]).trim();
  }

  if (!token && req.query?.token) {
    token = String(req.query.token).trim();
  }

  if (!token && req.query?.authToken) {
    token = String(req.query.authToken).trim();
  }

  if (!token) {
    token = req.cookies?.token || null;
  }

  if (!token) return res.status(401).json({ error: "Missing token" });

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.user = { id: payload.sub };
    res.locals.userId = payload.sub;
    next();
  } catch (err) {
    const msg =
      err.name === "TokenExpiredError" ? "Token expired" : "Invalid token";
    return res.status(401).json({ error: msg });
  }
}

module.exports = { authRequired };
