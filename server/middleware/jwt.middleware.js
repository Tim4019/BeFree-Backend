const jwt = require("jsonwebtoken");

function authRequired(req, res, next) {
  const auth = req.headers.authorization?.trim();
  let token = null;

  if (auth && auth.toLowerCase().startsWith("bearer ")) {
    token = auth.slice(7).trim();
  } else {
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
