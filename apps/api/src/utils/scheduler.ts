import cron from "node-cron";
import { prisma } from "./prisma.js";
import { generateParentReport } from "../modules/gamification/parent-report.helper.js";

export function initScheduler() {
  console.log("[Scheduler] Initializing background progress report scheduler...");

  // Runs every Sunday at midnight (0 0 * * 0) to process Weekly reports
  cron.schedule("0 0 * * 0", async () => {
    console.log("[Scheduler] Running weekly parent progress report dispatcher...");
    try {
      const activeStudents = await prisma.user.findMany({
        where: {
          parentReportingEnabled: true,
          parentEmail: { not: null },
          parentReportFrequency: "WEEKLY",
        },
        select: { id: true },
      });

      console.log(`[Scheduler] Found ${activeStudents.length} students with weekly parent reports configured.`);

      for (const student of activeStudents) {
        try {
          const report = await generateParentReport(student.id);
          if (report) {
            // Save report log to database
            await prisma.parentReportLog.create({
              data: {
                studentId: student.id,
                parentEmail: report.parentEmail,
                content: report.markdown,
                status: "SENT",
              },
            });

            // Simulate email dispatch by printing to server logs
            console.log(`\n==================================================`);
            console.log(`[EMAIL SEND] To: ${report.parentEmail}`);
            console.log(`[EMAIL SEND] Subject: Weekly Progress Report - ${report.studentName}`);
            console.log(`--------------------------------------------------`);
            console.log(report.markdown);
            console.log(`==================================================\n`);
          }
        } catch (innerErr) {
          console.error(`[Scheduler] Failed to dispatch report for student ${student.id}:`, innerErr);
        }
      }
    } catch (err) {
      console.error("[Scheduler] Error in weekly report cron task:", err);
    }
  });

  // Runs on the 1st of every month at midnight (0 0 1 * *) to process Monthly reports
  cron.schedule("0 0 1 * *", async () => {
    console.log("[Scheduler] Running monthly parent progress report dispatcher...");
    try {
      const activeStudents = await prisma.user.findMany({
        where: {
          parentReportingEnabled: true,
          parentEmail: { not: null },
          parentReportFrequency: "MONTHLY",
        },
        select: { id: true },
      });

      console.log(`[Scheduler] Found ${activeStudents.length} students with monthly parent reports configured.`);

      for (const student of activeStudents) {
        try {
          const report = await generateParentReport(student.id);
          if (report) {
            // Save report log
            await prisma.parentReportLog.create({
              data: {
                studentId: student.id,
                parentEmail: report.parentEmail,
                content: report.markdown,
                status: "SENT",
              },
            });

            console.log(`\n==================================================`);
            console.log(`[EMAIL SEND] To: ${report.parentEmail}`);
            console.log(`[EMAIL SEND] Subject: Monthly Progress Report - ${report.studentName}`);
            console.log(`--------------------------------------------------`);
            console.log(report.markdown);
            console.log(`==================================================\n`);
          }
        } catch (innerErr) {
          console.error(`[Scheduler] Failed to dispatch report for student ${student.id}:`, innerErr);
        }
      }
    } catch (err) {
      console.error("[Scheduler] Error in monthly report cron task:", err);
    }
  });
}
