import type { Request, Response } from "express";
import { prisma } from "../../utils/prisma.js";
import { isRedisHealthy } from "../../utils/redis.js";

export async function healthCheck(req: Request, res: Response) {
  const start = Date.now();

  let dbStatus = "fail";
  try {
    await prisma.$queryRaw`SELECT 1`;
    dbStatus = "ok";
  } catch {
    dbStatus = "fail";
  }

  const redisStatus = await isRedisHealthy();

  res.json({
    status: "ok",
    uptime: process.uptime(),
    duration: Date.now() - start,
    checks: {
      database: dbStatus,
      redis: redisStatus ? "ok" : "fail",
    },
  });
}

export async function getPublicStats(req: Request, res: Response) {
  try {
    const [studentsCount, toolsCount, xpSumResult] = await Promise.all([
      prisma.user.count({ where: { role: "STUDENT" } }),
      prisma.tool.count(),
      prisma.xPTransaction.aggregate({
        _sum: { amount: true },
      }),
    ]);

    const totalXP = xpSumResult._sum.amount ?? 0;

    // For teacher satisfaction, calculate percentage of graded submissions that received a score >= 70
    // If there are no graded submissions, default to 98%
    const gradedSubmissions = await prisma.submission.count({
      where: { status: "GRADED", score: { not: null } },
    });

    let teacherSatisfaction = 98;
    if (gradedSubmissions > 0) {
      const positiveSubmissions = await prisma.submission.count({
        where: { status: "GRADED", score: { gte: 70 } },
      });
      teacherSatisfaction = Math.round((positiveSubmissions / gradedSubmissions) * 100);
    }

    res.json({
      status: "success",
      data: {
        studentsCount,
        toolsCount,
        totalXP,
        teacherSatisfaction,
      },
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: `Failed to fetch public stats: ${(error as Error).message}`,
    });
  }
}
