import type { Request, Response } from "express";
import { prisma } from "../../utils/prisma.js";
import { apiSuccess, apiError } from "../../utils/api.js";
import { generateUniqueClassCode } from "../../utils/code.js";

export async function handleJoinClass(req: Request, res: Response) {
  const userId = req.userId;
  if (!userId) {
    return apiError(res, { code: "UNAUTHORIZED", message: "Authentication required", status: 401 });
  }

  const { code } = req.body;
  if (!code || typeof code !== "string") {
    return apiError(res, { code: "BAD_REQUEST", message: "Class join code is required", status: 400 });
  }

  const joinCodeClean = code.trim().toUpperCase();

  try {
    // 1. Locate the class by join code
    const cls = await prisma.class.findUnique({
      where: { joinCode: joinCodeClean },
      include: {
        teacher: {
          select: {
            name: true,
          },
        },
      },
    });

    if (!cls) {
      return apiError(res, { code: "NOT_FOUND", message: "Invalid class code. Please check and try again.", status: 404 });
    }

    // Verify school boundaries for student class code joins
    const studentUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { schoolId: true },
    });

    if (studentUser && studentUser.schoolId && cls.schoolId && studentUser.schoolId !== cls.schoolId) {
      return apiError(res, {
        code: "FORBIDDEN",
        message: "You can only join classes belonging to your registered school.",
        status: 403,
      });
    }

    // 2. Check if already a member
    const existingMember = await prisma.classMember.findFirst({
      where: { classId: cls.id, userId },
    });

    if (existingMember) {
      return apiSuccess(res, { message: "You are already a member of this class.", class: cls });
    }

    // 3. Create class membership
    await prisma.classMember.create({
      data: {
        classId: cls.id,
        userId,
      },
    });

    return apiSuccess(res, {
      message: "Successfully joined the class!",
      class: {
        id: cls.id,
        name: cls.name,
        teacherName: cls.teacher?.name || "Unknown Teacher",
      },
    });
  } catch (err) {
    return apiError(res, {
      code: "JOIN_CLASS_FAILED",
      message: `Failed to join class: ${(err as Error).message}`,
      status: 500,
    });
  }
}

export async function handleRegenerateClassCode(req: Request, res: Response) {
  const userId = req.userId;
  if (!userId) {
    return apiError(res, { code: "UNAUTHORIZED", message: "Authentication required", status: 401 });
  }

  const { id: classId } = req.params;

  try {
    // Verify ownership of class
    const cls = await prisma.class.findUnique({
      where: { id: classId },
    });

    if (!cls) {
      return apiError(res, { code: "NOT_FOUND", message: "Class not found", status: 404 });
    }

    if (cls.teacherId !== userId) {
      return apiError(res, { code: "FORBIDDEN", message: "You do not have permission to modify this class", status: 403 });
    }

    // Generate new unique join code
    const newCode = await generateUniqueClassCode();

    const updatedClass = await prisma.class.update({
      where: { id: classId },
      data: { joinCode: newCode },
      select: { id: true, name: true, joinCode: true },
    });

    return apiSuccess(res, {
      message: "Class code successfully regenerated!",
      class: updatedClass,
    });
  } catch (err) {
    return apiError(res, {
      code: "REGENERATE_CODE_FAILED",
      message: `Failed to regenerate class code: ${(err as Error).message}`,
      status: 500,
    });
  }
}

export async function handleCreateClass(req: Request, res: Response) {
  const userId = req.userId;
  if (!userId) {
    return apiError(res, { code: "UNAUTHORIZED", message: "Authentication required", status: 401 });
  }

  const { name } = req.body;
  if (!name || typeof name !== "string" || !name.trim()) {
    return apiError(res, { code: "BAD_REQUEST", message: "Class name is required", status: 400 });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { schoolId: true },
    });

    const joinCode = await generateUniqueClassCode();

    const newClass = await prisma.class.create({
      data: {
        name: name.trim(),
        teacherId: userId,
        schoolId: user?.schoolId || null,
        joinCode,
      },
      select: {
        id: true,
        name: true,
        joinCode: true,
        _count: {
          select: {
            members: true,
          },
        },
      },
    });

    return apiSuccess(res, {
      message: "Class successfully created!",
      class: newClass,
    });
  } catch (err) {
    return apiError(res, {
      code: "CREATE_CLASS_FAILED",
      message: `Failed to create class: ${(err as Error).message}`,
      status: 500,
    });
  }
}
