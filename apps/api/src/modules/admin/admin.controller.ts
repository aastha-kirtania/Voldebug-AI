import type { Request, Response } from "express";
import { prisma } from "../../utils/prisma.js";
import { apiSuccess, apiError } from "../../utils/api.js";
import { getSchoolOverview, getAuditLogs } from "./admin.service.js";

export async function handleGetSchool(req: Request, res: Response) {
  const userId = req.userId!;

  try {
    const school = await prisma.school.findFirst({
      where: { adminId: userId },
      include: {
        _count: { select: { members: true, classes: true } },
      },
    });

    if (!school) {
      return apiError(res, {
        code: "NOT_FOUND",
        message: "School not found",
        status: 404,
      });
    }

    return apiSuccess(res, school);
  } catch {
    return apiError(res, {
      code: "INTERNAL_ERROR",
      message: "Failed to fetch school",
      status: 500,
    });
  }
}

export async function handleListUsers(req: Request, res: Response) {
  const userId = req.userId!;
  const { role, page = 1, limit = 20, search } = req.query;

  try {
    const school = await prisma.school.findFirst({
      where: { adminId: userId },
      select: { id: true },
    });

    if (!school) {
      return apiError(res, {
        code: "NOT_FOUND",
        message: "Managed school not found",
        status: 404,
      });
    }

    const skip = (Number(page) - 1) * Number(limit);

    const where: Record<string, any> = { schoolId: school.id };
    if (role) where.role = role;
    if (search && typeof search === "string") {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
      ];
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          gradeLevel: true,
          lastActiveAt: true,
          createdAt: true,
        },
        skip,
        take: Number(limit),
        orderBy: { createdAt: "desc" },
      }),
      prisma.user.count({ where }),
    ]);

    return apiSuccess(res, { users, total }, 200, {
      page: Number(page),
      limit: Number(limit),
      total,
    });
  } catch {
    return apiError(res, {
      code: "INTERNAL_ERROR",
      message: "Failed to list users",
      status: 500,
    });
  }
}

export async function handleGetUser(req: Request, res: Response) {
  const userId = req.userId!;
  const { id } = req.params;

  try {
    const school = await prisma.school.findFirst({
      where: { adminId: userId },
      select: { id: true },
    });

    if (!school) {
      return apiError(res, {
        code: "NOT_FOUND",
        message: "Managed school not found",
        status: 404,
      });
    }

    const user = await prisma.user.findFirst({
      where: { id, schoolId: school.id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        gradeLevel: true,
        studentId: true,
        image: true,
        lastActiveAt: true,
        onboardingStatus: true,
        createdAt: true,
        streak: true,
        _count: {
          select: {
            submissions: true,
            xpTransactions: true,
            badges: true,
          },
        },
      },
    });

    if (!user) {
      return apiError(res, {
        code: "NOT_FOUND",
        message: "User not found in your school",
        status: 404,
      });
    }

    return apiSuccess(res, user);
  } catch {
    return apiError(res, {
      code: "INTERNAL_ERROR",
      message: "Failed to fetch user",
      status: 500,
    });
  }
}

export async function handleUpdateUserRole(req: Request, res: Response) {
  const userId = req.userId!;
  const { id } = req.params;
  const { role } = req.body;

  try {
    if (!["STUDENT", "TEACHER", "ADMIN"].includes(role)) {
      return apiError(res, {
        code: "VALIDATION_ERROR",
        message: "Invalid role",
        status: 422,
      });
    }

    const school = await prisma.school.findFirst({
      where: { adminId: userId },
      select: { id: true },
    });

    if (!school) {
      return apiError(res, {
        code: "NOT_FOUND",
        message: "Managed school not found",
        status: 404,
      });
    }

    // Verify target user belongs to the same school
    const targetUser = await prisma.user.findFirst({
      where: { id, schoolId: school.id },
    });

    if (!targetUser) {
      return apiError(res, {
        code: "NOT_FOUND",
        message: "User not found in your school",
        status: 404,
      });
    }

    const user = await prisma.user.update({
      where: { id },
      data: { role },
      select: { id: true, name: true, email: true, role: true },
    });

    return apiSuccess(res, user);
  } catch {
    return apiError(res, {
      code: "INTERNAL_ERROR",
      message: "Failed to update role",
      status: 500,
    });
  }
}

export async function handleListClasses(req: Request, res: Response) {
  const userId = req.userId!;
  const { page = 1, limit = 20 } = req.query;

  try {
    const school = await prisma.school.findFirst({
      where: { adminId: userId },
      select: { id: true },
    });

    if (!school) {
      return apiError(res, {
        code: "NOT_FOUND",
        message: "Managed school not found",
        status: 404,
      });
    }

    const skip = (Number(page) - 1) * Number(limit);

    const where = { schoolId: school.id };

    const [classes, total] = await Promise.all([
      prisma.class.findMany({
        where,
        include: {
          teacher: { select: { id: true, name: true, email: true } },
          school: { select: { id: true, name: true } },
          _count: { select: { members: true, assignments: true } },
        },
        skip,
        take: Number(limit),
        orderBy: { createdAt: "desc" },
      }),
      prisma.class.count({ where }),
    ]);

    return apiSuccess(res, { classes, total }, 200, {
      page: Number(page),
      limit: Number(limit),
      total,
    });
  } catch {
    return apiError(res, {
      code: "INTERNAL_ERROR",
      message: "Failed to list classes",
      status: 500,
    });
  }
}

export async function handleUpdateClass(req: Request, res: Response) {
  const userId = req.userId!;
  const { id } = req.params;
  const { name, teacherId } = req.body;

  try {
    const school = await prisma.school.findFirst({
      where: { adminId: userId },
      select: { id: true },
    });

    if (!school) {
      return apiError(res, {
        code: "NOT_FOUND",
        message: "Managed school not found",
        status: 404,
      });
    }

    // Verify class belongs to the school
    const targetClass = await prisma.class.findFirst({
      where: { id, schoolId: school.id },
    });

    if (!targetClass) {
      return apiError(res, {
        code: "NOT_FOUND",
        message: "Class not found in your school",
        status: 404,
      });
    }

    const data: Record<string, unknown> = {};
    if (name) data.name = name;
    if (teacherId) {
      // Verify teacher belongs to the school
      const teacher = await prisma.user.findFirst({
        where: { id: teacherId, role: "TEACHER", schoolId: school.id },
      });
      if (!teacher) {
        return apiError(res, {
          code: "VALIDATION_ERROR",
          message: "Teacher not found in your school",
          status: 400,
        });
      }
      data.teacherId = teacherId;
    }

    const updated = await prisma.class.update({
      where: { id },
      data,
    });

    return apiSuccess(res, updated);
  } catch {
    return apiError(res, {
      code: "INTERNAL_ERROR",
      message: "Failed to update class",
      status: 500,
    });
  }
}

export async function handleDeleteClass(req: Request, res: Response) {
  const userId = req.userId!;
  const { id } = req.params;

  try {
    const school = await prisma.school.findFirst({
      where: { adminId: userId },
      select: { id: true },
    });

    if (!school) {
      return apiError(res, {
        code: "NOT_FOUND",
        message: "Managed school not found",
        status: 404,
      });
    }

    // Verify class belongs to the school
    const targetClass = await prisma.class.findFirst({
      where: { id, schoolId: school.id },
    });

    if (!targetClass) {
      return apiError(res, {
        code: "NOT_FOUND",
        message: "Class not found in your school",
        status: 404,
      });
    }

    await prisma.class.delete({ where: { id } });
    return apiSuccess(res, { success: true });
  } catch {
    return apiError(res, {
      code: "INTERNAL_ERROR",
      message: "Failed to delete class",
      status: 500,
    });
  }
}

// ─── Principal Dashboard: School Overview ─────────────────────────────────

export async function handleGetSchoolOverview(req: Request, res: Response) {
  const userId = req.userId!;

  try {
    const overview = await getSchoolOverview(userId);

    if (!overview) {
      return apiError(res, {
        code: "NOT_FOUND",
        message: "No school found for this admin",
        status: 404,
      });
    }

    return apiSuccess(res, overview);
  } catch {
    return apiError(res, {
      code: "INTERNAL_ERROR",
      message: "Failed to fetch school overview",
      status: 500,
    });
  }
}

// ─── Principal Dashboard: Audit Logs ──────────────────────────────────────

export async function handleGetAuditLogs(req: Request, res: Response) {
  const userId = req.userId!;
  const { limit = 20, offset = 0, flagged, studentId, tool } = req.query;

  try {
    const school = await prisma.school.findFirst({
      where: { adminId: userId },
      select: { id: true },
    });

    if (!school) {
      return apiError(res, {
        code: "NOT_FOUND",
        message: "Managed school not found",
        status: 404,
      });
    }

    const filters: {
      isFlagged?: boolean;
      studentId?: string;
      toolUsed?: string;
      schoolId?: string;
    } = {
      schoolId: school.id,
    };
    if (flagged === "true") filters.isFlagged = true;
    if (flagged === "false") filters.isFlagged = false;
    if (studentId && typeof studentId === "string")
      filters.studentId = studentId;
    if (tool && typeof tool === "string") filters.toolUsed = tool;

    const result = await getAuditLogs(Number(limit), Number(offset), filters);

    return apiSuccess(res, result, 200, {
      page: Math.floor(Number(offset) / Number(limit)) + 1,
      limit: Number(limit),
      total: result.total,
    });
  } catch {
    return apiError(res, {
      code: "INTERNAL_ERROR",
      message: "Failed to fetch audit logs",
      status: 500,
    });
  }
}
