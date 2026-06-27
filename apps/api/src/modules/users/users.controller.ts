import type { Request, Response } from "express";
import { prisma } from "../../utils/prisma.js";
import { apiSuccess, apiError } from "../../utils/api.js";
import { hash } from "bcryptjs";

export async function handleStudentOnboarding(req: Request, res: Response) {
  const userId = req.userId;
  if (!userId) {
    return apiError(res, { code: "UNAUTHORIZED", message: "Authentication required", status: 401 });
  }

  try {
    const { gradeLevel, studentId, password } = req.body;

    console.log("[STUDENT ONBOARDING] userId:", userId, "hasPassword field:", !!password);

    const existingUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { passwordHash: true },
    });

    console.log("[STUDENT ONBOARDING] existingPasswordHash:", !!existingUser?.passwordHash);

    let passwordHash: string | undefined;
    if (password && existingUser && !existingUser.passwordHash) {
      if (password.length < 8) {
        throw new Error("Password must be at least 8 characters.");
      }
      passwordHash = await hash(password, 12);
      console.log("[STUDENT ONBOARDING] password hashed, will update DB");
    } else if (password && existingUser?.passwordHash) {
      console.log("[STUDENT ONBOARDING] skipping — user already has a password");
    }

    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        gradeLevel: gradeLevel ? Number(gradeLevel) : undefined,
        studentId,
        ...(passwordHash ? { passwordHash } : {}),
        onboardingStatus: "COMPLETED",
      },
      select: { id: true, name: true, email: true, role: true, onboardingStatus: true },
    });

    console.log("[STUDENT ONBOARDING] done for user:", user.id);
    return apiSuccess(res, user);
  } catch (err) {
    console.error("[STUDENT ONBOARDING] error:", err);
    return apiError(res, { code: "ONBOARDING_FAILED", message: (err as Error).message, status: 400 });
  }
}

export async function handleTeacherOnboarding(req: Request, res: Response) {
  const userId = req.userId;
  if (!userId) {
    return apiError(res, { code: "UNAUTHORIZED", message: "Authentication required", status: 401 });
  }

  try {
    const { schoolName, className, password } = req.body;

    console.log("[TEACHER ONBOARDING] userId:", userId, "hasPassword field:", !!password);

    let schoolId: string;

    // Find or create school
    let school = await prisma.school.findFirst({ where: { name: schoolName } });
    if (!school) {
      school = await prisma.school.create({ data: { name: schoolName } });
    }
    schoolId = school.id;

    // Create class
    await prisma.class.create({
      data: {
        name: className,
        teacherId: userId,
        schoolId,
      },
    });

    const existingUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { passwordHash: true },
    });

    console.log("[TEACHER ONBOARDING] existingPasswordHash:", !!existingUser?.passwordHash);

    let passwordHash: string | undefined;
    if (password && existingUser && !existingUser.passwordHash) {
      if (password.length < 8) {
        throw new Error("Password must be at least 8 characters.");
      }
      passwordHash = await hash(password, 12);
      console.log("[TEACHER ONBOARDING] password hashed, will update DB");
    } else if (password && existingUser?.passwordHash) {
      console.log("[TEACHER ONBOARDING] skipping — user already has a password");
    }

    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        schoolId,
        ...(passwordHash ? { passwordHash } : {}),
        onboardingStatus: "COMPLETED",
      },
      select: { id: true, name: true, email: true, role: true, onboardingStatus: true },
    });

    console.log("[TEACHER ONBOARDING] done for user:", user.id);
    return apiSuccess(res, user);
  } catch (err) {
    console.error("[TEACHER ONBOARDING] error:", err);
    return apiError(res, { code: "ONBOARDING_FAILED", message: (err as Error).message, status: 400 });
  }
}

