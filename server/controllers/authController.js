const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { User } = require("../models/User.js");

// helper: set an httpOnly cookie named "token" and return it for clients that store tokens
function sendTokenCookie(res, userId) {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("JWT_SECRET is not configured");

  const token = jwt.sign({}, secret, {
    expiresIn: "7d",
    subject: String(userId),
    algorithm: "HS256",
  });

  res.cookie("token", token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  return token;
}

exports.signup = async (req, res, next) => {
  try {
    let { username, name, email, password, addictionType, quitDate } = req.body;

    username = typeof username === "string" && username.trim().length
      ? username.trim()
      : typeof name === "string"
      ? name.trim()
      : "";

    //basic checks
    if (!username)
      return res.status(400).json({ error: "Username is required" });
    if (!email || !password)
      return res.status(400).json({ error: "Email and password required" });

    //normalize email
    email = String(email).trim().toLowerCase();

    //parse date if provided
    if (quitDate) {
      const d = new Date(quitDate);
      quitDate = isNaN(d) ? undefined : d;
    }

    //uniques
    const existingUser = await User.findOne({ email });
    if (existingUser)
      return res.status(400).json({ error: "Email already in use" });

    //hash
    const passwordHash = await bcrypt.hash(password, 12);

    //create
    const user = await User.create({
      username,
      email,
      passwordHash,
      addictionType,
      quitDate,
    });

    //auto-login
    const token = sendTokenCookie(res, user._id);

    const payload = {
      id: user._id,
      name: user.username,
      email: user.email,
      addictionType: user.addictionType,
      quitDate: user.quitDate,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };

    //minimal response
    res.status(201).json({
      message: "User created",
      authToken: token,
      payload,
    });
  } catch (err) {
    next(err);
  }
};

exports.login = async (req, res, next) => {
  try {
    let { email, password } = req.body;

    //basic checks
    if (!email || !password)
      return res.status(400).json({ error: "Email and password required" });

    //normalize email
    email = String(email).trim().toLowerCase();

    //find user
    const user = await User.findOne({ email });
    if (!user)
      return res.status(401).json({ error: "Invalid email or password" });

    //compare password
    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok)
      return res.status(401).json({ error: "Invalid email or password" });

    // 5) set cookie + respond
    const token = sendTokenCookie(res, user._id);

    const payload = {
      id: user._id,
      name: user.username,
      email: user.email,
      addictionType: user.addictionType,
      quitDate: user.quitDate,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };

    res.json({
      message: "Login successful",
      authToken: token,
      payload,
    });
  } catch (err) {
    next(err);
  }
};

exports.verify = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ error: "User not found" });

    res.status(200).json({
      message: "Token is valid",
      payload: {
        id: user._id,
        name: user.username,
        email: user.email,
        addictionType: user.addictionType,
        quitDate: user.quitDate,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
    });
  } catch (err) {
    next(err);
  }
};

exports.logout = (req, res) => {
  res.clearCookie("token");
  res.json({ message: "Logged out successfully" });
};
