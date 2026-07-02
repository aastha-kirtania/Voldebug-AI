import type { Request, Response } from "express";
import { prisma } from "../../utils/prisma.js";
import { apiSuccess, apiError } from "../../utils/api.js";
import { hash } from "bcryptjs";
import { generateUniqueClassCode } from "../../utils/code.js";

export async function handleUpdateProfile(req: Request, res: Response) {
  const userId = req.userId;
  if (!userId) {
    return apiError(res, { code: "UNAUTHORIZED", message: "Authentication required", status: 401 });
  }

  try {
    const { name, avatar } = req.body;

    if (name !== undefined && (typeof name !== "string" || name.trim().length < 2)) {
      return apiError(res, { code: "VALIDATION_ERROR", message: "Name must be at least 2 characters.", status: 400 });
    }

    if (name !== undefined && name.trim().length > 60) {
      return apiError(res, { code: "VALIDATION_ERROR", message: "Name must be 60 characters or fewer.", status: 400 });
    }

    const updateData: Record<string, any> = {};
    if (name !== undefined) updateData.name = name.trim();
    if (avatar !== undefined) updateData.image = avatar ? `avatar:${avatar}` : null;

    if (Object.keys(updateData).length === 0) {
      return apiError(res, { code: "VALIDATION_ERROR", message: "No fields to update.", status: 400 });
    }

    const user = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: { id: true, name: true, email: true, role: true, image: true },
    });

    return apiSuccess(res, user);
  } catch (err) {
    console.error("[UPDATE PROFILE] error:", err);
    return apiError(res, { code: "UPDATE_FAILED", message: (err as Error).message, status: 500 });
  }
}

export async function handleStudentOnboarding(req: Request, res: Response) {
  const userId = req.userId;
  if (!userId) {
    return apiError(res, { code: "UNAUTHORIZED", message: "Authentication required", status: 401 });
  }

  try {
    const { gradeLevel, studentId, schoolName, classId, password, avatar } = req.body;

    console.log("[STUDENT ONBOARDING] userId:", userId, "hasPassword field:", !!password, "avatar:", avatar);

    const existingUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { passwordHash: true },
    });

    if (!existingUser) {
      return apiError(res, { code: "UNAUTHORIZED", message: "User not found. Please log in or sign up again.", status: 401 });
    }

    if (!schoolName || !schoolName.trim()) {
      return apiError(res, { code: "VALIDATION_ERROR", message: "School name is mandatory.", status: 400 });
    }

    const school = await prisma.school.findFirst({
      where: {
        name: { equals: schoolName.trim(), mode: "insensitive" },
        adminId: { not: null }
      }
    });

    if (!school) {
      return apiError(res, {
        code: "VALIDATION_ERROR",
        message: "Selected school is not registered by a Principal.",
        status: 400
      });
    }
    const schoolId = school.id;

    if (classId) {
      const exists = await prisma.classMember.findFirst({
        where: { classId, userId },
      });
      if (!exists) {
        await prisma.classMember.create({
          data: { classId, userId },
        });
      }
    }

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
        schoolId,
        ...(passwordHash ? { passwordHash } : {}),
        image: avatar ? `avatar:${avatar}` : undefined,
        onboardingStatus: "COMPLETED",
      },
      select: { id: true, name: true, email: true, role: true, onboardingStatus: true, image: true },
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

    if (!schoolName || !schoolName.trim()) {
      return apiError(res, { code: "VALIDATION_ERROR", message: "School name is mandatory.", status: 400 });
    }

    const school = await prisma.school.findFirst({
      where: {
        name: { equals: schoolName.trim(), mode: "insensitive" },
        adminId: { not: null }
      }
    });

    if (!school) {
      return apiError(res, {
        code: "VALIDATION_ERROR",
        message: "Selected school is not registered by a Principal.",
        status: 400
      });
    }
    const schoolId = school.id;

    const joinCode = await generateUniqueClassCode();

    // Create class
    await prisma.class.create({
      data: {
        name: className,
        teacherId: userId,
        schoolId,
        joinCode,
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

export async function handleGetSchoolClasses(req: Request, res: Response) {
  const { schoolName } = req.query;
  if (!schoolName) {
    return apiSuccess(res, []);
  }

  try {
    const classes = await prisma.class.findMany({
      where: {
        school: {
          name: {
            equals: schoolName as string,
            mode: "insensitive",
          },
        },
      },
      select: {
        id: true,
        name: true,
        teacher: {
          select: {
            name: true,
          },
        },
      },
    });
    return apiSuccess(res, classes);
  } catch (err) {
    return apiError(res, {
      code: "FETCH_CLASSES_FAILED",
      message: (err as Error).message,
      status: 500,
    });
  }
}

export async function handleGetRegisteredSchools(req: Request, res: Response) {
  try {
    const schools = await prisma.school.findMany({
      where: {
        adminId: { not: null }
      },
      select: {
        id: true,
        name: true,
      },
      orderBy: {
        name: "asc",
      },
    });

    return apiSuccess(res, schools);
  } catch (err) {
    return apiError(res, {
      code: "INTERNAL_ERROR",
      message: `Failed to fetch registered schools: ${(err as Error).message}`,
      status: 500,
    });
  }
}

