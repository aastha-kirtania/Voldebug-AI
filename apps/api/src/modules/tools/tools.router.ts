import express from "express";
import { authenticate } from "../../middleware/auth.js";
import {
  handleListTools,
  handleGetTool,
  handleToolChat,
  handleTrackToolUsage,
} from "./tools.controller.js";

const toolsRouter = express.Router();

// Public read-only endpoints — guests can browse the catalog
toolsRouter.get("/", handleListTools);
toolsRouter.get("/:id", handleGetTool);

// Protected endpoints — require an authenticated student session
toolsRouter.post("/:id/chat", authenticate, handleToolChat);
toolsRouter.post("/:id/track", authenticate, handleTrackToolUsage);

export { toolsRouter };
