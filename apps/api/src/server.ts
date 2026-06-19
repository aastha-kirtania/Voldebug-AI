import "dotenv/config";
import cors from "cors";

import { app } from "./app.js";
import { env } from "./config/env.js";
import { logger } from "./middleware/requestLogger.js";
import { prisma } from "./utils/prisma.js";
import { initSocket } from "./config/socket.js";

// ✅ CORS MUST be FIRST middleware
app.use(
  cors({
    origin: (origin, callback) => {
      const allowedOrigins = [
        "http://localhost:3000",
        "https://voldebug-ai-web-y9hd.vercel.app"
      ];

      // allow requests with no origin (like mobile apps / curl)
      if (!origin) return callback(null, true);

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"]
  })
);

// IMPORTANT: proper preflight handling
app.options("*", cors());

// (optional but recommended for preflight requests)
app.options("*", cors());

const server = app.listen(env.PORT, env.HOST, () => {
  logger.info(
    `API server running on http://${env.HOST}:${env.PORT} (${env.NODE_ENV})`
  );
});

// Initialize Socket.io
initSocket(server);

// Graceful shutdown
async function shutdown(signal: string) {
  logger.info(`${signal} received. Shutting down...`);
  server.close(async () => {
    await prisma.$disconnect();
    logger.info("Disconnected from database. Server stopped.");
    process.exit(0);
  });
}

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));

export { server };