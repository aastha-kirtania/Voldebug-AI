import express from "express";
import { authenticate } from "../../middleware/auth.js";
import {
  handleListTools,
  handleGetTool,
  handleToolChat,
  handleTrackToolUsage,
} from "./tools.controller.js";

const toolsRouter = express.Router();

// All tool endpoints require authentication
toolsRouter.use(authenticate);

// Tool listing
toolsRouter.get("/", handleListTools);

// Tool detail
toolsRouter.get("/:id", handleGetTool);

// Tool chat doubt-solving & keyword checking
toolsRouter.post("/:id/chat", handleToolChat);

// Track tool usage increments
toolsRouter.post("/:id/track", handleTrackToolUsage);

export { toolsRouter };
