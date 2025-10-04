const path = require("path");
const env = process.env.NODE_ENV || "development";
const dotenv = require("dotenv");

function loadEnv(filename) {
  return dotenv.config({ path: path.resolve(__dirname, filename) });
}

const envResult = loadEnv(`.env.${env}`);
if (envResult.error) {
  loadEnv(".env");
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
const corsOrigin =
  process.env.CORS_ORIGIN || process.env.CLIENT_ORIGIN || "http://localhost:5173";

app.use(
  cors({
    origin: corsOrigin,
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser(process.env.COOKIE_SECRET || "cookie_secret"));

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
