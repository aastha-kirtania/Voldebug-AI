import type { Router } from "express";
import express from "express";
import { healthCheck, getPublicStats } from "./health.controller.js";

export const healthRouter: Router = express.Router();

healthRouter.get("/", healthCheck);
healthRouter.get("/stats", getPublicStats);
