import express from "express";
import { authenticate } from "../../middleware/auth.js";
import {
  handleStudentOnboarding,
  handleTeacherOnboarding,
  handleGetSchoolClasses,
  handleGetRegisteredSchools,
  handleUpdateProfile,
} from "./users.controller.js";

const usersRouter = express.Router();

usersRouter.patch("/profile", authenticate, handleUpdateProfile);
usersRouter.patch("/onboarding/student", authenticate, handleStudentOnboarding);
usersRouter.patch("/onboarding/teacher", authenticate, handleTeacherOnboarding);
usersRouter.get("/school-classes", authenticate, handleGetSchoolClasses);
usersRouter.get("/schools", authenticate, handleGetRegisteredSchools);

export { usersRouter };