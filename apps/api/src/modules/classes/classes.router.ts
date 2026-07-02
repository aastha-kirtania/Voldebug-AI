import express from "express";
import { authenticate } from "../../middleware/auth.js";
import { handleJoinClass, handleRegenerateClassCode, handleCreateClass } from "./classes.controller.js";

const classesRouter = express.Router();

classesRouter.post("/join", authenticate, handleJoinClass);
classesRouter.post("/:id/regenerate-code", authenticate, handleRegenerateClassCode);
classesRouter.post("/", authenticate, handleCreateClass);

export { classesRouter };
