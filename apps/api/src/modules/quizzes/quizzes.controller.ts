import type { Request, Response } from "express";
import { prisma } from "../../utils/prisma.js";
import { apiSuccess, apiError } from "../../utils/api.js";
import { awardXP } from "../gamification/gamification.service.js";

export async function handleGetQuizByTool(req: Request, res: Response) {
  const { toolId } = req.params;

  try {
    const quiz = await prisma.quiz.findUnique({
      where: { toolId },
      include: {
        questions: {
          orderBy: { createdAt: "asc" },
        },
      },
    });

    if (!quiz) {
      return apiError(res, {
        code: "NOT_FOUND",
        message: "No quiz found for this tool",
        status: 404,
      });
    }

    // Sanitize questions to prevent cheating (omit correctAnswerIndex)
    const sanitizedQuestions = quiz.questions.map((q) => ({
      id: q.id,
      type: q.type,
      questionText: q.questionText,
      options: q.options,
      explanation: q.explanation,
    }));

    return apiSuccess(res, {
      id: quiz.id,
      title: quiz.title,
      description: quiz.description,
      xpReward: quiz.xpReward,
      passingScore: quiz.passingScore,
      questions: sanitizedQuestions,
    });
  } catch (err) {
    console.error("Failed to fetch tool quiz:", err);
    return apiError(res, {
      code: "INTERNAL_ERROR",
      message: "Failed to fetch quiz details",
      status: 500,
    });
  }
}

export async function handleSubmitQuizAttempt(req: Request, res: Response) {
  const userId = req.userId!;
  const { quizId } = req.params;
  const { answers } = req.body; // e.g. { "questionId": selectedIndex }

  if (!answers || typeof answers !== "object") {
    return apiError(res, {
      code: "BAD_REQUEST",
      message: "Answers record is required",
      status: 400,
    });
  }

  try {
    const quiz = await prisma.quiz.findUnique({
      where: { id: quizId },
      include: { questions: true },
    });

    if (!quiz) {
      return apiError(res, {
        code: "NOT_FOUND",
        message: "Quiz not found",
        status: 404,
      });
    }

    const questions = quiz.questions;
    if (questions.length === 0) {
      return apiError(res, {
        code: "BAD_REQUEST",
        message: "Quiz has no questions configured",
        status: 400,
      });
    }

    // Score calculations
    let correctCount = 0;
    for (const q of questions) {
      const selectedIndex = answers[q.id];
      if (selectedIndex !== undefined && selectedIndex === q.correctAnswerIndex) {
        correctCount++;
      }
    }

    const percentage = Math.round((correctCount / questions.length) * 100);
    const passed = percentage >= quiz.passingScore;

    // Check if they passed this specific quiz before
    const previouslyPassed = await prisma.quizAttempt.findFirst({
      where: {
        studentId: userId,
        quizId,
        passed: true,
      },
    });

    // Save the attempt record
    const attempt = await prisma.quizAttempt.create({
      data: {
        quizId,
        studentId: userId,
        score: percentage,
        passed,
        answers: answers as any,
      },
    });

    let xpAwardResult = null;
    let xpEarned = 0;

    // Award XP if passed for the first time
    if (passed && !previouslyPassed) {
      xpEarned = quiz.xpReward;
      xpAwardResult = await awardXP(userId, xpEarned, "QUIZ_COMPLETED" as any);
    }

    return apiSuccess(res, {
      attemptId: attempt.id,
      score: percentage,
      passed,
      correctCount,
      totalQuestions: questions.length,
      xpEarned,
      xpTotal: xpAwardResult?.totalXP,
      levelUp: xpAwardResult?.levelUp,
      badgesEarned: xpAwardResult?.badgesEarned || [],
    });
  } catch (err) {
    console.error("Failed to submit quiz attempt:", err);
    return apiError(res, {
      code: "INTERNAL_ERROR",
      message: "Failed to submit quiz answers",
      status: 500,
    });
  }
}

export async function handleGetQuizAttempts(req: Request, res: Response) {
  const userId = req.userId!;

  try {
    const attempts = await prisma.quizAttempt.findMany({
      where: { studentId: userId },
      include: {
        quiz: {
          select: {
            id: true,
            title: true,
            toolId: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return apiSuccess(res, attempts);
  } catch (err) {
    console.error("Failed to fetch attempts:", err);
    return apiError(res, {
      code: "INTERNAL_ERROR",
      message: "Failed to retrieve quiz attempts",
      status: 500,
    });
  }
}
