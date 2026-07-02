import express from "express";
import { authenticate } from "../../middleware/auth.js";
import {
  handleGetQuizByTool,
  handleSubmitQuizAttempt,
  handleGetQuizAttempts,
} from "./quizzes.controller.js";

const quizzesRouter = express.Router();

quizzesRouter.use(authenticate);

quizzesRouter.get("/tool/:toolId", handleGetQuizByTool);
quizzesRouter.post("/:quizId/submit", handleSubmitQuizAttempt);
quizzesRouter.get("/attempts", handleGetQuizAttempts);

export { quizzesRouter };
