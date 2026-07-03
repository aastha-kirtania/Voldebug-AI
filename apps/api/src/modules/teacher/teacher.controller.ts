import type { Request, Response } from "express";
import { prisma } from "../../utils/prisma.js";
import { apiSuccess, apiError } from "../../utils/api.js";

export async function handleTeacherDashboard(req: Request, res: Response) {
  const userId = req.userId!;

  try {
    const teacherUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { school: { select: { name: true } } },
    });
    const schoolName = teacherUser?.school?.name || null;

    // Get teacher's classes
    const classes = await prisma.class.findMany({
      where: { teacherId: userId },
      include: {
        members: { select: { userId: true } },
        _count: { select: { assignments: true, members: true } },
      },
    });

    const classIds = classes.map((c) => c.id);
    const studentIds = Array.from(new Set(classes.flatMap((c) => c.members.map((m) => m.userId))));

    // Get assignment IDs
    const assignments = await prisma.assignment.findMany({
      where: { classId: { in: classIds }, status: "PUBLISHED", deletedAt: null },
      select: { id: true },
    });
    const assignmentIds = assignments.map((a) => a.id);

    // Active assignments count
    const activeAssignments = assignments.length;

    // Pending submissions (ungraded)
    const pendingSubmissionsList = await prisma.submission.findMany({
      where: { assignmentId: { in: assignmentIds }, status: "SUBMITTED", deletedAt: null },
      include: {
        student: { select: { id: true, name: true, email: true, image: true } },
        assignment: { select: { title: true } },
      },
      orderBy: { submittedAt: "desc" },
      take: 10,
    });

    const recentSubmissions = pendingSubmissionsList.map((s) => ({
      id: s.id,
      studentId: s.studentId,
      studentName: s.student.name || s.student.email || s.student.id,
      studentImage: s.student.image,
      assignmentId: s.assignmentId,
      assignmentTitle: s.assignment.title,
      submittedAt: s.submittedAt.toISOString(),
      status: s.status,
      score: s.score,
      grade: s.grade,
      xpAwarded: s.xpAwarded,
    }));

    // Total unique students
    const totalStudents = studentIds.length;

    // Active students today (active in last 24h)
    const activeStudentsToday = await prisma.user.count({
      where: {
        id: { in: studentIds },
        lastActiveAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
      },
    });

    // Safety alerts count
    const safetyAlertsCount = await prisma.auditLog.count({
      where: {
        studentId: { in: studentIds },
        isFlagged: true,
      },
    });

    // Graded submissions for stats
    const gradedSubmissions = await prisma.submission.findMany({
      where: { assignmentId: { in: assignmentIds }, status: { in: ["GRADED", "RETURNED"] }, deletedAt: null },
      select: { score: true },
    });

    const averageGrade =
      gradedSubmissions.length > 0
        ? gradedSubmissions.reduce((sum, s) => sum + (s.score || 0), 0) / gradedSubmissions.length
        : null;

    const completionRate =
      assignmentIds.length > 0
        ? Math.round((gradedSubmissions.length / assignmentIds.length) * 100)
        : 0;

    // Unified Chronological Activity Feed
    const submissionsForActivity = await prisma.submission.findMany({
      where: { studentId: { in: studentIds }, deletedAt: null },
      include: {
        student: { select: { name: true, email: true } },
        assignment: { select: { title: true } },
      },
      orderBy: { submittedAt: "desc" },
      take: 15,
    });

    const auditLogsForActivity = await prisma.auditLog.findMany({
      where: { studentId: { in: studentIds } },
      include: { student: { select: { name: true, email: true } } },
      orderBy: { timestamp: "desc" },
      take: 15,
    });

    const activities: any[] = [];

    submissionsForActivity.forEach((sub) => {
      const studentName = sub.student.name || sub.student.email || "A student";
      if (sub.status === "SUBMITTED") {
        activities.push({
          id: `sub-${sub.id}`,
          studentName,
          type: "SUBMISSION",
          detail: `submitted homework for "${sub.assignment.title}"`,
          timestamp: sub.submittedAt.toISOString(),
        });
      } else if (sub.status === "GRADED" || sub.status === "RETURNED") {
        activities.push({
          id: `grade-${sub.id}`,
          studentName,
          type: "COMPLETION",
          detail: `completed assignment "${sub.assignment.title}"`,
          timestamp: sub.gradedAt?.toISOString() || sub.updatedAt.toISOString(),
        });
      }
    });

    auditLogsForActivity.forEach((log) => {
      const studentName = log.student.name || log.student.email || "A student";
      if (log.isFlagged) {
        activities.push({
          id: `alert-${log.id}`,
          studentName,
          type: "SAFETY_ALERT",
          detail: `triggered a safety warning in ${log.toolUsed}`,
          timestamp: log.timestamp.toISOString(),
        });
      } else {
        activities.push({
          id: `ai-${log.id}`,
          studentName,
          type: "AI_USE",
          detail: `used ${log.toolUsed} for doubt solving`,
          timestamp: log.timestamp.toISOString(),
        });
      }
    });

    activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    const recentActivity = activities.slice(0, 10);

    // AI Usage Summary
    const auditLogsForAI = await prisma.auditLog.findMany({
      where: { studentId: { in: studentIds } },
      select: { toolUsed: true, timestamp: true },
    });

    const toolCounts: Record<string, number> = {};
    auditLogsForAI.forEach((log) => {
      toolCounts[log.toolUsed] = (toolCounts[log.toolUsed] || 0) + 1;
    });

    const dbTools = await prisma.tool.findMany({
      select: { name: true, brandColor: true },
    });
    const colorMap = new Map(dbTools.map((t) => [t.name.toLowerCase(), t.brandColor]));

    const mostUsedTools = Object.entries(toolCounts)
      .map(([name, count]) => ({
        name,
        count,
        brandColor: colorMap.get(name.toLowerCase()) || "#6366f1",
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    const dailyUsage = auditLogsForAI.filter(
      (log) => log.timestamp >= new Date(Date.now() - 24 * 60 * 60 * 1000)
    ).length;

    const weeklyUsage = auditLogsForAI.filter(
      (log) => log.timestamp >= new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    ).length;

    const aiUsage = {
      mostUsedTools,
      dailyUsage,
      weeklyUsage,
    };

    // Frequently Asked Doubts
    const wordCounts: Record<string, number> = {};
    const stopwords = new Set([
      "what", "how", "why", "who", "the", "a", "an", "is", "are", "of", "to", "in", "for", "on", "with", "at", "by", "from", "that", "this", "these", "those", "explain", "help", "me", "solve", "about", "using", "your", "mine", "some", "them", "then", "there", "their"
    ]);

    const logsForDoubts = await prisma.auditLog.findMany({
      where: { studentId: { in: studentIds } },
      select: { promptText: true },
      take: 200,
    });

    logsForDoubts.forEach((log) => {
      const words = log.promptText
        .toLowerCase()
        .replace(/[^a-zA-Z\s]/g, "")
        .split(/\s+/);
      words.forEach((w) => {
        if (w.length > 3 && !stopwords.has(w)) {
          wordCounts[w] = (wordCounts[w] || 0) + 1;
        }
      });
    });

    const frequentDoubts = Object.entries(wordCounts)
      .map(([word, count]) => ({ word, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);

    // Safety Alerts Preview
    const latestAlerts = await prisma.auditLog.findMany({
      where: {
        studentId: { in: studentIds },
        isFlagged: true,
      },
      include: {
        student: { select: { name: true, email: true, gradeLevel: true } },
      },
      orderBy: { timestamp: "desc" },
      take: 5,
    });

    const safetyAlertsPreview = latestAlerts.map((a) => {
      let category = "CHEATING";
      let severity = "HIGH";
      try {
        const payload = JSON.parse(a.aiResponse);
        if (payload.category) category = payload.category;
        if (payload.severity) severity = payload.severity;
      } catch {}
      return {
        id: a.id,
        studentName: a.student.name || a.student.email || "Unknown Student",
        gradeLevel: a.student.gradeLevel,
        promptText: a.promptText,
        toolUsed: a.toolUsed,
        category,
        severity,
        timestamp: a.timestamp.toISOString(),
      };
    });

    return apiSuccess(res, {
      schoolName,
      activeAssignments,
      pendingSubmissions: pendingSubmissionsList.length,
      totalStudents,
      activeStudentsToday,
      safetyAlertsCount,
      averageGrade,
      completionRate,
      classInfo: classes,
      recentSubmissions,
      recentActivity,
      aiUsage,
      frequentDoubts,
      safetyAlertsPreview,
    });
  } catch (err) {
    return apiError(res, {
      code: "INTERNAL_ERROR",
      message: `Failed to fetch teacher dashboard: ${(err as Error).message}`,
      status: 500,
    });
  }
}

export async function handleTeacherClasses(req: Request, res: Response) {
  const userId = req.userId!;

  try {
    const classes = await prisma.class.findMany({
      where: { teacherId: userId },
      include: {
        _count: {
          select: { assignments: true, members: true },
        },
      },
    });

    return apiSuccess(res, classes);
  } catch {
    return apiError(res, {
      code: "INTERNAL_ERROR",
      message: "Failed to fetch classes",
      status: 500,
    });
  }
}

export async function handleTeacherClassDetail(req: Request, res: Response) {
  const userId = req.userId!;
  const { classId } = req.params;

  try {
    const cls = await prisma.class.findUnique({
      where: { id: classId },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                image: true,
                gradeLevel: true,
                studentId: true,
              },
            },
          },
        },
        assignments: {
          where: { deletedAt: null },
          orderBy: { dueDate: "asc" },
          include: {
            suggestedTool: { select: { id: true, name: true } },
            _count: { select: { submissions: true } },
          },
        },
      },
    });

    if (!cls || cls.teacherId !== userId) {
      return apiError(res, { code: "NOT_FOUND", message: "Class not found", status: 404 });
    }

    // Compute per-student completion stats
    const assignmentIds = cls.assignments.map((a) => a.id);
    const studentIds = cls.members.map((m) => m.userId);

    const [submissions, streaks, dailyChallenges] = await Promise.all([
      prisma.submission.findMany({
        where: { assignmentId: { in: assignmentIds }, deletedAt: null },
        select: { studentId: true, assignmentId: true, status: true, score: true, xpAwarded: true },
      }),
      prisma.streak.findMany({
        where: { userId: { in: studentIds } },
      }),
      prisma.dailyChallenge.findMany({
        where: {
          userId: { in: studentIds },
          date: new Date().toISOString().split("T")[0],
        },
      }),
    ]);

    const studentStats = cls.members.map((m) => {
      const studentSubs = submissions.filter((s) => s.studentId === m.userId);
      const completed = studentSubs.filter((s) => s.status === "GRADED" || s.status === "RETURNED").length;
      const avgScore = studentSubs.length > 0
        ? Math.round(studentSubs.reduce((acc, s) => acc + (s.score ?? 0), 0) / studentSubs.length)
        : null;

      const streakObj = streaks.find((s) => s.userId === m.userId);
      const challengeObj = dailyChallenges.find((c) => c.userId === m.userId);

      return {
        ...m.user,
        submissionsCount: studentSubs.length,
        completedCount: completed,
        avgScore,
        totalXPEarned: studentSubs.reduce((acc, s) => acc + (s.xpAwarded ?? 0), 0),
        streak: streakObj ? streakObj.currentStreak : 0,
        challengeCompleted: challengeObj ? challengeObj.completed : false,
      };
    });

    return apiSuccess(res, {
      ...cls,
      memberStats: studentStats,
    });
  } catch (err) {
    return apiError(res, {
      code: "INTERNAL_ERROR",
      message: `Failed to fetch class detail: ${(err as Error).message}`,
      status: 500,
    });
  }
}

export async function handleTeacherAlerts(req: Request, res: Response) {
  const teacherId = req.userId!;
  try {
    const classes = await prisma.class.findMany({
      where: { teacherId },
      include: { members: { select: { userId: true } } }
    });

    const studentIds = Array.from(new Set(classes.flatMap(c => c.members.map(m => m.userId))));

    const alerts = await prisma.auditLog.findMany({
      where: {
        studentId: { in: studentIds },
        isFlagged: true
      },
      include: {
        student: { select: { id: true, name: true, email: true, gradeLevel: true } }
      },
      orderBy: { timestamp: "desc" }
    });

    const parsedAlerts = alerts.map(a => {
      let category = "CHEATING";
      let severity = "HIGH";
      try {
        const payload = JSON.parse(a.aiResponse);
        if (payload.category) category = payload.category;
        if (payload.severity) severity = payload.severity;
      } catch {}
      return {
        id: a.id,
        studentId: a.studentId,
        studentName: a.student.name || a.student.email || "Unknown Student",
        gradeLevel: a.student.gradeLevel,
        promptText: a.promptText,
        toolUsed: a.toolUsed,
        category,
        severity,
        timestamp: a.timestamp.toISOString()
      };
    });

    return apiSuccess(res, parsedAlerts);
  } catch (err: any) {
    return apiError(res, {
      code: "INTERNAL_ERROR",
      message: `Failed to fetch safety alerts: ${err.message}`,
      status: 500
    });
  }
}

export async function handleTeacherAnalytics(req: Request, res: Response) {
  const teacherId = req.userId!;
  try {
    const classes = await prisma.class.findMany({
      where: { teacherId },
      include: { members: { select: { userId: true } } }
    });
    const classIds = classes.map(c => c.id);
    const studentIds = Array.from(new Set(classes.flatMap(c => c.members.map(m => m.userId))));

    const assignmentsForIds = await prisma.assignment.findMany({
      where: { classId: { in: classIds }, deletedAt: null },
      select: { id: true }
    });
    const assignmentIds = assignmentsForIds.map(a => a.id);

    // 1. Weekly submissions count (last 7 days)
    const submissionDays = await Promise.all(
      Array.from({ length: 7 }).map(async (_, idx) => {
        const d = new Date();
        d.setDate(d.getDate() - idx);
        d.setHours(0, 0, 0, 0);
        const nextD = new Date(d);
        nextD.setDate(d.getDate() + 1);

        const count = await prisma.submission.count({
          where: {
            assignmentId: { in: assignmentIds },
            submittedAt: { gte: d, lt: nextD },
            deletedAt: null
          }
        });
        return {
          dayLabel: d.toLocaleDateString("en-US", { weekday: "short" }),
          count
        };
      })
    );
    const weeklySubmissions = submissionDays.reverse();

    // 2. Grade distribution from graded submissions
    const gradedSubmissions = await prisma.submission.findMany({
      where: { assignmentId: { in: assignmentIds }, status: "GRADED", deletedAt: null },
      select: { score: true }
    });

    const gradeDistribution = [
      { label: "A (90-100%)", count: gradedSubmissions.filter(s => (s.score ?? 0) >= 90).length, color: "#22c55e" },
      { label: "B (80-89%)", count: gradedSubmissions.filter(s => (s.score ?? 0) >= 80 && (s.score ?? 0) < 90).length, color: "#6366f1" },
      { label: "C (70-79%)", count: gradedSubmissions.filter(s => (s.score ?? 0) >= 70 && (s.score ?? 0) < 80).length, color: "#f59e0b" },
      { label: "D (60-69%)", count: gradedSubmissions.filter(s => (s.score ?? 0) >= 60 && (s.score ?? 0) < 70).length, color: "#ef4444" },
      { label: "F (<60%)", count: gradedSubmissions.filter(s => (s.score ?? 0) < 60).length, color: "#7f1d1d" },
    ];

    // 3. Top tools count from student audit logs, falling back to global
    const studentLogs = await prisma.auditLog.groupBy({
      by: ["toolUsed"],
      where: { studentId: { in: studentIds } },
      _count: { toolUsed: true },
    });

    const studentToolCounts = studentLogs.map(l => ({
      name: l.toolUsed,
      count: l._count.toolUsed
    }));
    studentToolCounts.sort((a, b) => b.count - a.count);

    const toolNames = studentToolCounts.map(tc => tc.name);
    const dbTools = await prisma.tool.findMany({
      where: { name: { in: toolNames } }
    });

    const toolStats = studentToolCounts.slice(0, 5).map(tc => {
      const dbT = dbTools.find(t => t.name.toLowerCase() === tc.name.toLowerCase());
      return {
        name: tc.name,
        usageCount: tc.count,
        brandColor: dbT?.brandColor || "#6366f1"
      };
    });

    if (toolStats.length === 0) {
      const tools = await prisma.tool.findMany({
        orderBy: { usageCount: "desc" },
        take: 5
      });
      toolStats.push(...tools.map(t => ({
        name: t.name,
        usageCount: t.usageCount,
        brandColor: t.brandColor
      })));
    }

    // 4. Weak concepts (graded assignments with average score < 75)
    const assignments = await prisma.assignment.findMany({
      where: { classId: { in: classIds }, deletedAt: null },
      include: { submissions: { where: { status: "GRADED", deletedAt: null } } }
    });

    const weakConcepts = assignments
      .map(a => {
        const scores = a.submissions.map(s => s.score ?? 0);
        const avg = scores.length > 0 ? scores.reduce((sum, s) => sum + s, 0) / scores.length : 100;
        return {
          id: a.id,
          title: a.title,
          avgScore: Math.round(avg),
          submissionsCount: a.submissions.length
        };
      })
      .filter(a => a.submissionsCount > 0 && a.avgScore < 75)
      .sort((a, b) => a.avgScore - b.avgScore);

    // 5. Common doubts from search prompts
    const logs = await prisma.auditLog.findMany({
      where: { studentId: { in: studentIds } },
      select: { promptText: true },
      take: 100
    });

    const wordCounts: Record<string, number> = {};
    const stopwords = new Set(["what", "how", "why", "who", "the", "a", "an", "is", "are", "of", "to", "in", "for", "on", "with", "at", "by", "from", "that", "this", "these", "those", "explain", "help", "me", "solve", "about", "using"]);
    logs.forEach(log => {
      const words = log.promptText
        .toLowerCase()
        .replace(/[^a-zA-Z\s]/g, "")
        .split(/\s+/);
      words.forEach(w => {
        if (w.length > 3 && !stopwords.has(w)) {
          wordCounts[w] = (wordCounts[w] || 0) + 1;
        }
      });
    });

    const commonDoubts = Object.entries(wordCounts)
      .map(([word, count]) => ({ word, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);

    // 6. Streaks and engagement
    const streaks = await prisma.streak.findMany({
      where: { userId: { in: studentIds } },
      select: { currentStreak: true }
    });
    const avgStreak = streaks.length > 0
      ? Math.round(streaks.reduce((sum, s) => sum + s.currentStreak, 0) / streaks.length)
      : 0;

    // 7. At-risk students
    const studentSubmissions = await prisma.submission.findMany({
      where: { studentId: { in: studentIds }, deletedAt: null },
      include: { student: { select: { id: true, name: true, email: true, image: true } } }
    });

    const studentGrades: Record<string, { total: number; count: number; name: string; email: string; image: string | null }> = {};
    studentSubmissions.forEach(s => {
      if (s.status === "GRADED" && s.score !== null) {
        if (!studentGrades[s.studentId]) {
          studentGrades[s.studentId] = {
            total: 0,
            count: 0,
            name: s.student.name || s.student.email || "Student",
            email: s.student.email || "",
            image: s.student.image
          };
        }
        studentGrades[s.studentId].total += s.score;
        studentGrades[s.studentId].count += 1;
      }
    });

    const atRiskStudents = [];
    for (const [id, d] of Object.entries(studentGrades)) {
      const avg = d.total / d.count;
      if (avg < 70) {
        atRiskStudents.push({
          id,
          name: d.name,
          email: d.email,
          image: d.image,
          reason: `Low average grade (${Math.round(avg)}%)`,
          level: "HIGH"
        });
      }
    }

    const flaggedLogs = await prisma.auditLog.findMany({
      where: {
        studentId: { in: studentIds },
        isFlagged: true,
        timestamp: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
      },
      include: { student: { select: { id: true, name: true, email: true, image: true } } },
      orderBy: { timestamp: "desc" }
    });

    const flaggedStudentIds = new Set(atRiskStudents.map(s => s.id));
    flaggedLogs.forEach(log => {
      if (!flaggedStudentIds.has(log.studentId)) {
        flaggedStudentIds.add(log.studentId);
        atRiskStudents.push({
          id: log.studentId,
          name: log.student.name || log.student.email || "Student",
          email: log.student.email || "",
          image: log.student.image,
          reason: "Safety alert flags triggered",
          level: "CRITICAL"
        });
      }
    });

    return apiSuccess(res, {
      toolStats,
      weakConcepts,
      commonDoubts,
      weeklySubmissions,
      gradeDistribution,
      atRiskStudents,
      engagement: {
        avgStreak,
        totalActiveStudents: studentIds.length
      }
    });
  } catch (err: any) {
    return apiError(res, {
      code: "INTERNAL_ERROR",
      message: `Failed to fetch analytics: ${err.message}`,
      status: 500
    });
  }
}