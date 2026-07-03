import type { Request, Response } from "express";
import { prisma } from "../../utils/prisma.js";
import { apiSuccess, apiError } from "../../utils/api.js";
import { createNotification } from "../notifications/notifications.service.js";
import { completeDailyChallenge } from "../gamification/gamification.service.js";

export async function handleListTools(req: Request, res: Response) {
  try {
    const { category, search } = req.query;

    const where: { category?: string; search?: { mode: "insensitive"; contains: string } } = {};
    if (category) where.category = category as string;
    if (search && typeof search === "string") {
      where.search = { mode: "insensitive", contains: search };
    }

    const tools = await prisma.tool.findMany({
      orderBy: { usageCount: "desc" },
    });

    const filtered = tools.filter((t) => {
      if (!where.category && !where.search) return true;
      if (where.category && t.category !== where.category) return false;
      if (where.search && !t.name.toLowerCase().includes((where.search as any).contains.toLowerCase()) &&
          !t.description.toLowerCase().includes((where.search as any).contains.toLowerCase())) return false;
      return true;
    });

    return apiSuccess(res, filtered);
  } catch {
    return apiError(res, { code: "INTERNAL_ERROR", message: "Failed to fetch tools", status: 500 });
  }
}

const DEMO_TOOLS_FALLBACK: Record<string, { name: string; category: string; brandColor: string }> = {
  "1": { name: "ChatGPT", category: "CHAT_AI", brandColor: "#10a37f" },
  "2": { name: "GitHub Copilot", category: "CODE_AI", brandColor: "#1b1f24" },
  "3": { name: "Midjourney", category: "IMAGE_AI", brandColor: "#000000" },
  "4": { name: "Grammarly", category: "WRITING_AI", brandColor: "#15c39a" },
  "5": { name: "Perplexity AI", category: "RESEARCH_AI", brandColor: "#20b2aa" },
  "6": { name: "Claude", category: "CHAT_AI", brandColor: "#d97706" },
  "7": { name: "Replit", category: "CODE_AI", brandColor: "#f26207" },
  "8": { name: "Canva AI", category: "IMAGE_AI", brandColor: "#00c4cc" },
  "9": { name: "QuillBot", category: "WRITING_AI", brandColor: "#4CAF50" },
  "10": { name: "Elicit", category: "RESEARCH_AI", brandColor: "#5b21b6" },
};

export async function handleGetTool(req: Request, res: Response) {
  try {
    const { id } = req.params;
    let tool = await prisma.tool.findUnique({
      where: { id },
    });
    if (!tool && DEMO_TOOLS_FALLBACK[id]) {
      const demo = DEMO_TOOLS_FALLBACK[id];
      tool = {
        id,
        name: demo.name,
        category: demo.category,
        description: `${demo.name} is a demo AI tool for testing.`,
        logoUrl: "",
        brandColor: demo.brandColor,
        useCases: ["Explaining concepts", "Brainstorming"],
        subjects: ["All subjects"],
        usageCount: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any;
    }
    if (!tool) {
      return apiError(res, { code: "NOT_FOUND", message: "Tool not found", status: 404 });
    }
    return apiSuccess(res, tool);
  } catch {
    return apiError(res, { code: "INTERNAL_ERROR", message: "Failed to fetch tool", status: 500 });
  }
}

export async function handleTrackToolUsage(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const exists = await prisma.tool.findUnique({ where: { id } });
    if (!exists) {
      if (DEMO_TOOLS_FALLBACK[id]) {
        return apiSuccess(res, { id, name: DEMO_TOOLS_FALLBACK[id].name, usageCount: 1 });
      }
      return apiError(res, { code: "NOT_FOUND", message: "Tool not found", status: 404 });
    }
    const tool = await prisma.tool.update({
      where: { id },
      data: { usageCount: { increment: 1 } },
    });
    return apiSuccess(res, tool);
  } catch {
    return apiError(res, { code: "INTERNAL_ERROR", message: "Failed to track tool usage", status: 500 });
  }
}

function getMockAIResponse(prompt: string, gradeLevel: number, toolName: string, subject?: string, topic?: string): string {
  if (gradeLevel >= 1 && gradeLevel <= 5) {
    return `⭐ HELLO BUDDY! ⭐ Here is a fun explanation for "${prompt}" using ${toolName}:\n\n` +
      `Imagine you have a magic factory! 🏭 That's what we are doing here. ` +
      `We take little pieces of ideas, mix them with cool tools, and BAM! We get awesome results!\n\n` +
      `Keep exploring, you're doing amazing! 🎈✨`;
  } else if (gradeLevel >= 6 && gradeLevel <= 8) {
    return `### 💡 Study Guide: ${topic || "Concept Review"}\n\n` +
      `Here is a balanced breakdown of your inquiry about "${prompt}" on ${toolName}:\n\n` +
      `1. **Core Concept**: We analyze this query interactively to help you build a solid understanding.\n` +
      `2. **Key Elements**: Using tools like this helps speed up research, outline paragraphs, and solve complex doubts.\n` +
      `3. **Quiz Tip**: Always check the reasoning steps! Practice makes perfect.`;
  } else {
    return `#### Technical Explanation & Analysis\n\n` +
      `**Subject**: ${subject || "General Study"}\n` +
      `**Query Context**: "${prompt}" via ${toolName}\n\n` +
      `**Abstract**: The system processed this query using natural language understanding models. Here is the structured summary:\n\n` +
      `- **Methodology**: Analyze input variables, resolve ambiguity, and formulate logic flows.\n` +
      `- **Application**: This paradigm helps model and verify advanced academic/code principles.\n` +
      `- **Reference**: Cross-reference textbooks and documentation for empirical validation.`;
  }
}

export async function handleToolChat(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { prompt, gradeLevel, subject, topic } = req.body;
    const studentId = req.userId;

    if (!studentId) {
      return apiError(res, { code: "UNAUTHORIZED", message: "User not logged in", status: 401 });
    }

    if (!prompt || typeof prompt !== "string" || prompt.trim() === "") {
      return apiError(res, { code: "BAD_REQUEST", message: "Prompt cannot be empty", status: 400 });
    }

    let tool = await prisma.tool.findUnique({
      where: { id },
    });

    if (!tool && DEMO_TOOLS_FALLBACK[id]) {
      const demo = DEMO_TOOLS_FALLBACK[id];
      tool = {
        id,
        name: demo.name,
        category: demo.category,
        description: `${demo.name} is a demo AI tool.`,
        logoUrl: "",
        brandColor: demo.brandColor,
        useCases: ["Explaining concepts", "Brainstorming"],
        subjects: ["All subjects"],
        usageCount: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any;
    }

    if (!tool) {
      return apiError(res, { code: "NOT_FOUND", message: "Tool not found", status: 404 });
    }

    const student = await prisma.user.findUnique({
      where: { id: studentId },
    });

    const activeGrade = gradeLevel ?? student?.gradeLevel ?? 9;

    const CHEATING_KEYWORDS = [
      "cheat",
      "bypass",
      "bypass restriction",
      "bypass restrictions",
      "write code for test",
      "plagiarize",
      "hack",
      "bypass lock",
      "attendance bypass",
      "exam answers",
      "do my homework",
      "bypass block"
    ];

    const CRITICAL_SAFETY_KEYWORDS = [
      "suicide",
      "self-harm",
      "kill myself",
      "bomb",
      "weapon",
      "drugs",
      "make bomb",
      "buy drugs",
      "bully",
      "cyberbullying",
      "harm myself"
    ];

    const lowerPrompt = prompt.toLowerCase();
    const isCriticalSafety = CRITICAL_SAFETY_KEYWORDS.some(keyword => lowerPrompt.includes(keyword));
    const isCheating = CHEATING_KEYWORDS.some(keyword => lowerPrompt.includes(keyword));

    if (isCriticalSafety || isCheating) {
      const category = isCriticalSafety ? "SAFETY" : "CHEATING";
      const severity = isCriticalSafety ? "CRITICAL" : "HIGH";
      const message = isCriticalSafety
        ? "Warning: Potential safety policy violation detected. This incident has been logged and reported to your teacher and school administration immediately."
        : "Warning: Cheating/Restriction bypass attempt detected. This incident has been logged and reported to your teacher.";

      // 1. Block query and create flagged AuditLog
      const aiResponsePayload = JSON.stringify({
        blocked: true,
        category,
        severity,
        message
      });

      const auditLog = await prisma.auditLog.create({
        data: {
          studentId,
          promptText: prompt,
          aiResponse: aiResponsePayload,
          toolUsed: tool.name,
          isFlagged: true,
        }
      });

      // 2. Find student's teachers
      const memberships = await prisma.classMember.findMany({
        where: { userId: studentId },
        include: { class: true }
      });

      const teacherIds = Array.from(new Set(memberships.map(m => m.class.teacherId)));

      // 3. Dispatch real-time notification to each teacher
      const studentName = student?.name || "A student";
      for (const tId of teacherIds) {
        await createNotification({
          userId: tId,
          type: "TEACHER_MESSAGE",
          title: `[${severity} ALERT] ${category} Violation`,
          body: `${studentName} triggered a ${category.toLowerCase()} policy alert: "${prompt}" in ${tool.name}. Severity: ${severity}.`,
        });
      }

      // Return response with flagged block info
      return apiSuccess(res, {
        blocked: true,
        category,
        severity,
        message,
        auditLogId: auditLog.id
      });
    }

    // Unflagged path: return simulated AI response
    const mockResponse = getMockAIResponse(prompt, activeGrade, tool.name, subject, topic);

    // Save unflagged AuditLog
    const auditLog = await prisma.auditLog.create({
      data: {
        studentId,
        promptText: prompt,
        aiResponse: mockResponse,
        toolUsed: tool.name,
        isFlagged: false,
      }
    });

    // Complete Daily Challenge if applicable
    completeDailyChallenge(studentId, "Use an AI Tool today").catch(console.error);

    // Increment tool usage count if tool exists in database
    const toolExists = await prisma.tool.findUnique({ where: { id } });
    if (toolExists) {
      await prisma.tool.update({
        where: { id },
        data: { usageCount: { increment: 1 } }
      });
    }

    return apiSuccess(res, {
      blocked: false,
      response: mockResponse,
      auditLogId: auditLog.id
    });
  } catch (err: any) {
    console.error(err);
    return apiError(res, { code: "INTERNAL_ERROR", message: "Failed to process chat query", status: 500 });
  }
}
