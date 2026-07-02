import express, { type Express } from "express";
import cors from "cors";
import helmet from "helmet";
import { healthRouter } from "./modules/health/health.router.js";
import { authRouter } from "./modules/auth/auth.router.js";
import { usersRouter } from "./modules/users/users.router.js";
import { toolsRouter } from "./modules/tools/tools.router.js";
import { assignmentsRouter } from "./modules/assignments/assignments.router.js";
import { submissionsRouter } from "./modules/submissions/submissions.router.js";
import { dashboardRouter } from "./modules/dashboard/dashboard.router.js";
import { gamificationRouter } from "./modules/gamification/gamification.router.js";
import { teacherRouter } from "./modules/teacher/teacher.router.js";
import { quizzesRouter } from "./modules/quizzes/quizzes.router.js";
import { notificationsRouter } from "./modules/notifications/notifications.router.js";
import { adminRouter } from "./modules/admin/admin.router.js";
import { classesRouter } from "./modules/classes/classes.router.js";
import { requestLogger } from "./middleware/requestLogger.js";
import { errorHandler } from "./middleware/errorHandler.js";
import { limiter } from "./middleware/rateLimiter.js";

const app: Express = express();

// Trust reverse proxy headers (e.g., X-Forwarded-For)
app.set("trust proxy", 1);

app.use(helmet());
const allowedOrigins = [
  "http://localhost:3000", // Keep this for your local development
  "https://voldebug-ai-web-esmp.vercel.app" // Your live Vercel frontend
];

app.use(
  cors({
    origin: (origin, callback) => {
      // allow requests with no origin (like mobile apps / curl)
      if (!origin) return callback(null, true);

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);
app.options("*", cors());
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(requestLogger);
app.use(limiter);

const api = express.Router();
api.use("/health", healthRouter);

api.use("/auth", authRouter);
api.use("/users", usersRouter);
api.use("/tools", toolsRouter);
api.use("/assignments", assignmentsRouter);
api.use("/submissions", submissionsRouter);
api.use("/dashboard", dashboardRouter);
api.use("/gamification", gamificationRouter);
api.use("/teacher", teacherRouter);
api.use("/quizzes", quizzesRouter);
api.use("/notifications", notificationsRouter);
api.use("/admin", adminRouter);
api.use("/classes", classesRouter);

app.use("/v1", api);

// ── 404 ───────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({
    data: null,
    error: {
      code: "NOT_FOUND",
      message: `Route ${req.method} ${req.path} not found`,
    },
    meta: { timestamp: new Date().toISOString() },
  });
});

// ── Error handler ─────────────────────────────────────────────────────
app.use(errorHandler);

export { app };
