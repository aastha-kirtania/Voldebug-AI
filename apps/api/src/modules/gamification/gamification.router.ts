import express from "express";
import { authenticate } from "../../middleware/auth.js";
import {
  handleDailyChallenge,
  handleCompleteChallenge,
  handleGetLeaderboard,
  handleGetRoadmap,
  handleGetBadgeCertificate,
  handleGetLevelCertificate,
  handleSaveParentSettings,
  handleTriggerParentReport,
} from "./gamification.controller.js";

const gamificationRouter = express.Router();

gamificationRouter.use(authenticate);

gamificationRouter.get("/challenge", handleDailyChallenge);
gamificationRouter.post("/challenge/complete", handleCompleteChallenge);

// Scoreboard endpoints
gamificationRouter.get("/scoreboard", handleGetLeaderboard);

// Roadmap endpoint
gamificationRouter.get("/roadmap", handleGetRoadmap);

// Certificate endpoints
gamificationRouter.get("/certificate/badge/:badgeId", handleGetBadgeCertificate);
gamificationRouter.get("/certificate/level/:level", handleGetLevelCertificate);

// Parent reporting endpoints
gamificationRouter.post("/parent/settings", handleSaveParentSettings);
gamificationRouter.post("/parent/trigger", handleTriggerParentReport);

export { gamificationRouter };
