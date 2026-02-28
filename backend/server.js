require("dotenv").config();

const http = require("http");
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");
const mongoose = require("mongoose");
const fs = require("fs-extra");
const path = require("path");

const authRoutes = require("./routes/auth");
const usersRoutes = require("./routes/users");
const messagesRoutes = require("./routes/messages");
const adminRoutes = require("./routes/admin"); // New admin routes
const { initSocket } = require("./socket/socketHandler");

const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI;
const JWT_SECRET = process.env.JWT_SECRET;

function parseCorsOrigins(value) {
  if (!value) return [];
  return value
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

async function start() {
  if (!MONGO_URI) {
    throw new Error("Missing MONGO_URI in environment");
  }
  if (!JWT_SECRET) {
    throw new Error("Missing JWT_SECRET in environment");
  }

  console.log("Connecting to MongoDB...");
  try {
    await mongoose.connect(MONGO_URI, {
      autoIndex: true,
      serverSelectionTimeoutMS: 5000, // Timeout after 5s instead of hanging
    });
    console.log("MongoDB connected successfully");
  } catch (err) {
    console.error("MongoDB connection error:", err);
    throw err;
  }

  const app = express();
  const server = http.createServer(app);

  const allowedOrigins = parseCorsOrigins(process.env.CORS_ORIGIN);
  const isProd = process.env.NODE_ENV === "production";
  app.use(
    cors({
      origin: function (origin, cb) {
        if (!origin) return cb(null, true); // curl / server-to-server
        if (!isProd) return cb(null, true); // allow all in dev
        if (allowedOrigins.length === 0) return cb(null, true);
        if (allowedOrigins.includes(origin)) return cb(null, true);
        const err = new Error("Not allowed by CORS");
        // mark as safe to send to client
        // @ts-expect-error
        err.expose = true;
        return cb(err);
      },
      credentials: true,
    })
  );
  app.use(helmet());
  app.use(express.json({ limit: "1mb" }));
  app.use(morgan("dev"));

  app.set("trust proxy", 1);
  app.use(
    rateLimit({
      windowMs: 60 * 1000,
      max: 240,
      standardHeaders: true,
      legacyHeaders: false,
    })
  );

  const uploadDir = path.join(__dirname, "uploads");
  fs.ensureDirSync(uploadDir);
  app.use("/uploads", express.static(uploadDir));

  app.get("/health", (_req, res) => res.json({ ok: true }));
  app.use("/api/auth", authRoutes);
  app.use("/api/users", usersRoutes);
  app.use("/api/messages", messagesRoutes);
  app.use("/api/admin", adminRoutes); // Protected admin section

  // Central error handler
  app.use((err, _req, res, _next) => {
    const status = err.statusCode || 500;
    const message = err.expose ? err.message : "Server error";
    if (process.env.NODE_ENV !== "production") {
      // eslint-disable-next-line no-console
      console.error(err);
    }
    res.status(status).json({ message });
  });

  // Initialize socket and expose to routes
  const io = initSocket(server, { corsOrigins: allowedOrigins });
  app.set("io", io);

  server.listen(PORT, () => {
    // eslint-disable-next-line no-console
    console.log(`API listening on http://localhost:${PORT}`);
  });
}

start().catch((e) => {
  // eslint-disable-next-line no-console
  console.error("Fatal startup error:", e);
  process.exit(1);
});

