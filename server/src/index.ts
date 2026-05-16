import express from "express";
import cors from "cors";
import helmet from "helmet";
import { env } from "./config/env";
import { api } from "./routes/api";
import { errorHandler } from "./middleware/errors";

const app = express();

/* =========================
   SECURITY MIDDLEWARE
========================= */
app.use(helmet());

/* =========================
   CORS FIX (CRITICAL)
========================= */
app.use(cors({
  origin(origin, callback) {
    // allow mobile apps / server-to-server
    if (!origin) return callback(null, true);

    // allow only whitelist
    if (env.allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    // IMPORTANT: do NOT throw error (prevents 500)
    return callback(null, false);
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"]
}));

// IMPORTANT: handle preflight explicitly
app.options("*", cors());

/* =========================
   BODY PARSER
========================= */
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true }));

/* =========================
   ROUTES
========================= */
app.use("/api", api);

/* =========================
   HEALTH CHECK (optional but recommended)
========================= */
app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

/* =========================
   ERROR HANDLER
========================= */
app.use(errorHandler);

/* =========================
   START SERVER
========================= */
const PORT = env.port || 4100;

app.listen(PORT, () => {
  console.log(`API running on port ${PORT}`);
});
