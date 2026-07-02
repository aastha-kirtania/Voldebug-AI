import { prisma } from "../../utils/prisma.js";

export async function generateParentReport(studentId: string): Promise<{
  parentEmail: string;
  markdown: string;
  studentName: string;
} | null> {
  const student = await prisma.user.findUnique({
    where: { id: studentId },
    include: {
      xpTransactions: true,
      submissions: {
        where: { deletedAt: null },
      },
      badges: {
        include: { badge: true },
      },
      quizAttempts: {
        where: { passed: true },
        include: {
          quiz: true
        }
      }
    },
  });

  if (!student || !student.parentEmail || !student.parentReportingEnabled) {
    return null;
  }

  // 1. Calculate academic metrics
  const totalXP = student.xpTransactions.reduce((sum, t) => sum + t.amount, 0);
  const currentLevel = Math.floor(Math.sqrt(totalXP / 100)) + 1;
  const submissionsCount = student.submissions.length;
  const gradedSubmissions = student.submissions.filter((s) => s.status === "GRADED");
  const averageScore = gradedSubmissions.length > 0
    ? Math.round(gradedSubmissions.reduce((sum, s) => sum + (s.score ?? 0), 0) / gradedSubmissions.length)
    : null;

  // 2. Filter achievements in the last 7 days
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

  const recentBadges = student.badges
    .filter((ub) => new Date(ub.earnedAt) >= oneWeekAgo)
    .map((ub) => `🏅 **${ub.badge.name}** - ${ub.badge.description}`);

  const recentQuizzes = student.quizAttempts
    .filter((qa) => new Date(qa.createdAt) >= oneWeekAgo)
    .reduce((unique: any[], item) => {
      if (!unique.some((q) => q.quizId === item.quizId)) {
        unique.push(item);
      }
      return unique;
    }, [])
    .map((qa) => `🧠 **${qa.quiz.title}** - Score: ${qa.score}%`);

  const studentName = student.name || student.email;
  const dateFormatted = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  // 3. Compile beautiful Markdown Report (Strict Academic Content - No prompt leakage)
  const markdown = `
# Voldebug AI - Student Progress Report
**Date:** ${dateFormatted}
**Student Name:** ${studentName}

---

## 📈 Academic Progress Summary
- **Current Level:** Level ${currentLevel}
- **Cumulative Experience Points (XP):** ${totalXP} XP
- **Total Assignments Completed:** ${submissionsCount}
- **Average Performance Score:** ${averageScore !== null ? `${averageScore}%` : "No graded assignments yet"}

---

## 🎖️ Recent Achievements (Past 7 Days)
### Badges Unlocked:
${recentBadges.length > 0 ? recentBadges.map((b) => `- ${b}`).join("\n") : "_No new badges earned this week._"}

### Tool Quizzes Passed:
${recentQuizzes.length > 0 ? recentQuizzes.map((q) => `- ${q}`).join("\n") : "_No new quizzes completed this week._"}

---

*This report is automatically compiled and dispatched based on progress sharing settings on Voldebug AI. Your student's specific prompts, search history, and AI responses remain strictly private to safeguard educational trust.*
  `.trim();

  return {
    parentEmail: student.parentEmail!,
    markdown,
    studentName: studentName || "Student",
  };
}
