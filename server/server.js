const fs = require("fs");
const path = require("path");
const env = process.env.NODE_ENV || "development";
const dotenv = require("dotenv");

function loadEnv(filename, override = false) {
  const filePath = path.resolve(__dirname, filename);
  const result = dotenv.config({ path: filePath, override });

  if (result.error && result.error.code !== "ENOENT") {
    console.warn(`⚠️  Failed to load ${filename}:`, result.error.message);
  }

  return result;
}

// Base config applies first (if present)
loadEnv(".env");

// Environment-specific overrides
const envResult = loadEnv(`.env.${env}`, true);

// Fallback to development settings when no override exists (common for local npm start)
if (envResult.error && env !== "development") {
  const devEnvPath = path.resolve(__dirname, ".env.development");
  if (fs.existsSync(devEnvPath)) {
    loadEnv(".env.development", true);
  }
}

const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const { connectDB } = require("./config/connect.js");

// Routes
const logRoutes = require("./routes/log.routes.js");
const authRoutes = require("./routes/auth.routes.js");
const userRoutes = require("./routes/user.routes.js");
const milestoneRoutes = require("./routes/milestone.routes.js");

const app = express();

// Security
app.set("trust proxy", 1);

// Middleware
const rawOrigins =
  process.env.CORS_ORIGINS ||
  process.env.CORS_ORIGIN ||
  process.env.CLIENT_ORIGIN ||
  "";

const allowedOrigins = rawOrigins
  .split(/[\s,]+/)
  .map((origin) => origin.trim())
  .filter(Boolean);

const fallbackOrigins = ["http://localhost:5173"];

app.use(
  cors({
    origin(origin, callback) {
      const list = allowedOrigins.length ? allowedOrigins : fallbackOrigins;
      if (!origin || list.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error(`Origin ${origin} not allowed by CORS`));
    },
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser(process.env.COOKIE_SECRET || "cookie_secret"));

if (!process.env.MONGO_URI) {
  console.warn("⚠️  MONGO_URI is not set after loading environment files");
}

// Routes
app.use("/api/logs", logRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/milestones", milestoneRoutes);

// Health check
app.get("/api/health", (_req, res) => res.json({ status: "ok" }));
app.get("/", (_req, res) => res.send("Hello World!"));

// Error handling
require("./db/error-handling.js")(app);

// Start server
const PORT = process.env.PORT || 5005;
connectDB(process.env.MONGO_URI)
  .then(() => {
    app.listen(PORT, "0.0.0.0", () =>
      console.log(`✅ API ready at http://localhost:${PORT}`)
    );
  })
  .catch((err) => {
    console.error("❌ Server start failed:", err);
    process.exit(1);
  });
