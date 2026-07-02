import type { Request, Response } from "express";
import { prisma } from "../../utils/prisma.js";
import { apiSuccess, apiError } from "../../utils/api.js";
import {
  completeDailyChallenge,
  getDailyChallenge,
  awardXP,
  evaluateBadges,
  updateStreak,
  calculateLevel,
  xpNeededForNextLevel,
} from "./gamification.service.js";
import { generateCertificatePdf } from "./certificate.service.js";
import { generateParentReport } from "./parent-report.helper.js";

export async function handleDailyChallenge(req: Request, res: Response) {
  const userId = req.userId!;

  try {
    const challenge = await getDailyChallenge(userId);
    return apiSuccess(res, challenge);
  } catch {
    return apiError(res, {
      code: "INTERNAL_ERROR",
      message: "Failed to fetch daily challenge",
      status: 500,
    });
  }
}

export async function handleCompleteChallenge(req: Request, res: Response) {
  const userId = req.userId!;
  const { action } = req.body;

  try {
    if (!action) {
      return apiError(res, {
        code: "VALIDATION_ERROR",
        message: "action is required",
        status: 422,
      });
    }

    const result = await completeDailyChallenge(userId, action);

    if (!result) {
      return apiError(res, {
        code: "ALREADY_COMPLETED",
        message: "Challenge already completed or action doesn't match",
        status: 409,
      });
    }

    return apiSuccess(res, result);
  } catch (err) {
    return apiError(res, {
      code: "CHALLENGE_FAILED",
      message: (err as Error).message,
      status: 400,
    });
  }
}

export async function handleGetLeaderboard(req: Request, res: Response) {
  const userId = req.userId!;
  const { classId, period } = req.query;

  try {
    let targetClassId = classId as string;
    if (!targetClassId) {
      const membership = await prisma.classMember.findFirst({
        where: { userId },
        select: { classId: true },
      });
      if (membership) {
        targetClassId = membership.classId;
      } else {
        // Fallback for Teachers
        const teacherClass = await prisma.class.findFirst({
          where: { teacherId: userId },
          select: { id: true },
        });
        if (teacherClass) {
          targetClassId = teacherClass.id;
        } else {
          return apiSuccess(res, { leaderboard: [], userRank: null });
        }
      }
    }

    // Get all members of this class
    const members = await prisma.classMember.findMany({
      where: { classId: targetClassId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
      },
    });

    // Get XP for each member
    const memberIds = members.map((m) => m.userId);

    const xpGroups = await prisma.xPTransaction.groupBy({
      by: ["userId"],
      _sum: { amount: true },
      where: { userId: { in: memberIds } },
    });

    const xpMap = new Map(
      xpGroups.map((g) => [g.userId, g._sum.amount || 0]),
    );

    // Calculate levels
    const leaderboard = members
      .map((m) => {
        const totalXP = xpMap.get(m.userId) || 0;
        const level = Math.floor(Math.sqrt(totalXP / 100)) + 1;
        return {
          userId: m.userId,
          name: m.user.name || m.user.email,
          image: m.user.image,
          totalXP,
          level,
        };
      })
      .sort((a, b) => b.totalXP - a.totalXP);

    // Rank with position
    const ranked = leaderboard.map((entry, i) => ({
      ...entry,
      rank: i + 1,
    }));

    // Find user's rank
    const userEntry = ranked.find((e) => e.userId === userId);
    const userRank = userEntry?.rank ?? null;

    // Complete Daily Challenge if applicable
    completeDailyChallenge(userId, "Check the scoreboard rankings").catch(console.error);

    return apiSuccess(res, { leaderboard: ranked, userRank, classId: targetClassId });
  } catch {
    return apiError(res, {
      code: "INTERNAL_ERROR",
      message: "Failed to fetch leaderboard",
      status: 500,
    });
  }
}

export async function handleGetRoadmap(req: Request, res: Response) {
  const userId = req.userId!;

  try {
    // 1. Fetch user's total XP and calculate current level
    const xpTransactions = await prisma.xPTransaction.findMany({
      where: { userId },
      select: { amount: true },
    });
    const totalXP = xpTransactions.reduce((sum, t) => sum + t.amount, 0);
    const currentLevel = calculateLevel(totalXP);

    // 2. Fetch all tools ordered by required level ascending
    const tools = await prisma.tool.findMany({
      orderBy: { requiredLevel: "asc" },
    });

    // 3. Fetch user's audit logs to check tool completion
    const auditLogs = await prisma.auditLog.findMany({
      where: {
        studentId: userId,
        isFlagged: false,
      },
      select: {
        toolUsed: true,
      },
    });
    const completedToolNames = new Set(auditLogs.map((log) => log.toolUsed));

    // 4. Map each tool to its status in the roadmap
    const roadmapTools = tools.map((tool) => {
      const isCompleted = completedToolNames.has(tool.name);
      const isLocked = currentLevel < tool.requiredLevel;
      return {
        ...tool,
        isCompleted,
        isLocked,
      };
    });

    // 5. Determine recommended next step
    let recommendedToolId: string | null = null;
    const nextUnlockedUncompleted = roadmapTools.find(
      (t) => !t.isLocked && !t.isCompleted
    );
    if (nextUnlockedUncompleted) {
      recommendedToolId = nextUnlockedUncompleted.id;
    } else {
      const nextLocked = roadmapTools.find((t) => t.isLocked);
      if (nextLocked) {
        recommendedToolId = nextLocked.id;
      }
    }

    // 6. Calculate progress to next level
    const remainingXP = xpNeededForNextLevel(totalXP);
    const percentToNextLevel = Math.min(100, totalXP % 100);

    // Fetch user's grade level
    const student = await prisma.user.findUnique({
      where: { id: userId },
      select: { gradeLevel: true },
    });
    const gradeLevel = student?.gradeLevel ?? 9;

    return apiSuccess(res, {
      tools: roadmapTools,
      recommendedToolId,
      studentProgress: {
        totalXP,
        currentLevel,
        xpNeededForNextLevel: remainingXP,
        percentToNextLevel,
        gradeLevel,
      },
    });
  } catch (err) {
    console.error("Roadmap fetch error:", err);
    return apiError(res, {
      code: "INTERNAL_ERROR",
      message: "Failed to fetch learning roadmap",
      status: 500,
    });
  }
}

export async function handleGetBadgeCertificate(req: Request, res: Response) {
  const userId = req.userId!;
  const { badgeId } = req.params;

  try {
    // 1. Verify if user has earned this badge
    const userBadge = await prisma.userBadge.findUnique({
      where: {
        userId_badgeId: { userId, badgeId },
      },
      include: {
        user: { select: { name: true, email: true } },
        badge: true,
      },
    });

    if (!userBadge) {
      return apiError(res, {
        code: "FORBIDDEN",
        message: "You have not earned this badge milestone yet",
        status: 403,
      });
    }

    // 2. Format details
    const studentName = userBadge.user.name || userBadge.user.email || "Student";
    const dateEarned = new Date(userBadge.earnedAt).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="certificate_${userBadge.badge.conditionKey}.pdf"`
    );

    // 3. Generate PDF and stream it directly
    await generateCertificatePdf(res, {
      studentName,
      milestoneTitle: `${userBadge.badge.name} Badge`,
      milestoneDescription: userBadge.badge.description,
      dateEarned,
      verificationId: `CERT-B-${userBadge.id}`,
    });
  } catch (err) {
    console.error("Badge certificate generation error:", err);
    if (!res.headersSent) {
      return apiError(res, {
        code: "INTERNAL_ERROR",
        message: "Failed to generate certificate PDF",
        status: 500,
      });
    }
  }
}

export async function handleGetLevelCertificate(req: Request, res: Response) {
  const userId = req.userId!;
  const levelParam = parseInt(req.params.level, 10);

  if (isNaN(levelParam) || levelParam < 1) {
    return apiError(res, {
      code: "BAD_REQUEST",
      message: "Invalid level specified",
      status: 400,
    });
  }

  try {
    // 1. Calculate student's level
    const xpTransactions = await prisma.xPTransaction.findMany({
      where: { userId },
      select: { amount: true },
    });
    const totalXP = xpTransactions.reduce((sum, t) => sum + t.amount, 0);
    const currentLevel = calculateLevel(totalXP);

    // 2. Check if student has reached this level milestone
    if (currentLevel < levelParam) {
      return apiError(res, {
        code: "FORBIDDEN",
        message: `You have not reached the Level ${levelParam} milestone yet. Current Level: ${currentLevel}`,
        status: 403,
      });
    }

    // 3. Fetch student profile
    const student = await prisma.user.findUnique({
      where: { id: userId },
      select: { name: true, email: true },
    });

    if (!student) {
      return apiError(res, {
        code: "NOT_FOUND",
        message: "Student profile not found",
        status: 404,
      });
    }

    const studentName = student.name || student.email || "Student";
    const dateEarned = new Date().toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="certificate_level_${levelParam}.pdf"`
    );

    // 4. Generate PDF and stream it directly
    await generateCertificatePdf(res, {
      studentName,
      milestoneTitle: `Academic Level ${levelParam} Milestone`,
      milestoneDescription: `Achieved by reaching a cumulative sum of total XP requirements on Voldebug AI`,
      dateEarned,
      verificationId: `CERT-L-${userId.slice(-6)}-LVL${levelParam}`,
    });
  } catch (err) {
    console.error("Level certificate generation error:", err);
    if (!res.headersSent) {
      return apiError(res, {
        code: "INTERNAL_ERROR",
        message: "Failed to generate certificate PDF",
        status: 500,
      });
    }
  }
}

export async function handleSaveParentSettings(req: Request, res: Response) {
  const userId = req.userId!;
  const { parentEmail, parentReportingEnabled, parentReportFrequency } = req.body;

  if (parentReportingEnabled && !parentEmail) {
    return apiError(res, {
      code: "BAD_REQUEST",
      message: "Parent email is required when progress sharing is enabled",
      status: 400,
    });
  }

  try {
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        parentEmail: parentEmail || null,
        parentReportingEnabled: !!parentReportingEnabled,
        parentReportFrequency: parentReportFrequency || "WEEKLY",
      },
      select: {
        parentEmail: true,
        parentReportingEnabled: true,
        parentReportFrequency: true,
      },
    });

    return apiSuccess(res, updatedUser);
  } catch (err) {
    console.error("Failed to save parent settings:", err);
    return apiError(res, {
      code: "INTERNAL_ERROR",
      message: "Failed to update parent progress sharing settings",
      status: 500,
    });
  }
}

export async function handleTriggerParentReport(req: Request, res: Response) {
  const userId = req.userId!;

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        parentEmail: true,
        parentReportingEnabled: true,
      },
    });

    if (!user?.parentEmail || !user?.parentReportingEnabled) {
      return apiError(res, {
        code: "BAD_REQUEST",
        message: "Parent reporting must be enabled with a valid parent email address before triggering a report.",
        status: 400,
      });
    }

    const report = await generateParentReport(userId);
    if (!report) {
      return apiError(res, {
        code: "INTERNAL_ERROR",
        message: "Failed to generate progress report summary",
        status: 500,
      });
    }

    // Save report log to database
    const log = await prisma.parentReportLog.create({
      data: {
        studentId: userId,
        parentEmail: report.parentEmail,
        content: report.markdown,
        status: "SENT",
      },
    });

    // Simulate sending email by printing to logs
    console.log(`\n==================================================`);
    console.log(`[EMAIL SEND] To: ${report.parentEmail}`);
    console.log(`[EMAIL SEND] Subject: Progress Report Update (Manual) - ${report.studentName}`);
    console.log(`--------------------------------------------------`);
    console.log(report.markdown);
    console.log(`==================================================\n`);

    return apiSuccess(res, {
      logId: log.id,
      parentEmail: report.parentEmail,
      markdown: report.markdown,
      sentAt: log.sentAt,
    });
  } catch (err) {
    console.error("Failed to manually trigger parent report:", err);
    return apiError(res, {
      code: "INTERNAL_ERROR",
      message: "Failed to compile and send parent progress report",
      status: 500,
    });
  }
}
