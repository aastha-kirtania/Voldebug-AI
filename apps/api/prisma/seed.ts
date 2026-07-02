import { PrismaClient } from "@prisma/client";
import { hash } from "bcryptjs";

const prisma = new PrismaClient();

async function hashPassword(password: string): Promise<string> {
  return await hash(password, 12);
}

function randomInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomDate(start: Date, end: Date) {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

async function main() {
  console.log("Seeding database...");

  // Destroy sequence in order of foreign key relationships
  await prisma.parentReportLog.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.dailyChallenge.deleteMany();
  await prisma.userBadge.deleteMany();
  await prisma.xPTransaction.deleteMany();
  await prisma.streak.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.question.deleteMany();
  await prisma.quiz.deleteMany();
  await prisma.submission.deleteMany();
  await prisma.assignment.deleteMany();
  await prisma.classMember.deleteMany();
  await prisma.class.deleteMany();
  await prisma.session.deleteMany();
  await prisma.account.deleteMany();
  await prisma.badge.deleteMany();
  await prisma.tool.deleteMany();
  await prisma.school.deleteMany();
  await prisma.user.deleteMany();
  console.log("  Purged database successfully.");

  // Badges
  const badgeDefs = [
    { name: "First Step", desc: "Completed your first assignment", condition: "first_assignment", count: 1, xp: 100, icon: "📤" },
    { name: "Tool Explorer", desc: "Used 5 different AI tools", condition: "used_5_tools", count: 5, xp: 150, icon: "🔭" },
    { name: "Streak Master", desc: "Maintained a 7-day login streak", condition: "streak_7", count: 7, xp: 200, icon: "⚡" },
    { name: "Top Scholar", desc: "Reached #1 on the class leaderboard", condition: "rank_1", count: 1, xp: 300, icon: "🏆" },
    { name: "Quiz Whiz", desc: "Passed your first AI tool quiz", condition: "quiz_first_pass", count: 1, xp: 100, icon: "🧠" },
    { name: "Quiz Master", desc: "Successfully passed 3 different tool quizzes", condition: "quiz_three_passes", count: 3, xp: 250, icon: "🧙" }
  ];
  const badges = [];
  for (const b of badgeDefs) {
    badges.push(await prisma.badge.create({
      data: {
        name: b.name,
        description: b.desc,
        iconUrl: b.icon,
        conditionKey: b.condition,
        requiredCount: b.count,
        xpReward: b.xp,
      },
    }));
  }

  // Tools
  const toolDefs = [
    { name: "ChatGPT", cat: "CHAT_AI", desc: "Conversational AI.", color: "#10a37f", uses: ["Ask questions"], subjects: ["General"], requiredLevel: 1 },
    { name: "Claude", cat: "CHAT_AI", desc: "Thoughtful AI assistant.", color: "#d97706", uses: ["Writing help"], subjects: ["English"], requiredLevel: 2 },
    { name: "GitHub Copilot", cat: "CODE_AI", desc: "AI pair programmer.", color: "#8b5cf6", uses: ["Write code"], subjects: ["Computer Science"], requiredLevel: 3 },
    { name: "Midjourney", cat: "IMAGE_AI", desc: "AI image generator for creative designs and art.", color: "#ec4899", uses: ["Generate images", "Create art"], subjects: ["Art", "Design"], requiredLevel: 4 },
    { name: "QuillBot", cat: "WRITING_AI", desc: "AI writing assistant and paraphraser.", color: "#10b981", uses: ["Paraphrase writing", "Grammar check"], subjects: ["English", "History"], requiredLevel: 5 },
    { name: "Consensus", cat: "RESEARCH_AI", desc: "AI research assistant to find scientific papers.", color: "#3b82f6", uses: ["Search papers", "Find literature"], subjects: ["Science", "Research"], requiredLevel: 6 },
  ];
  const tools = [];
  for (const t of toolDefs) {
    tools.push(await prisma.tool.create({
      data: {
        name: t.name,
        category: t.cat as any,
        description: t.desc,
        logoUrl: `/tools/${t.name.toLowerCase().replace(/ /g, "-")}.svg`,
        brandColor: t.color,
        useCases: t.uses,
        subjects: t.subjects,
        requiredLevel: t.requiredLevel,
      },
    }));
  }

  // 1. Create 2 Admins from different schools
  const admin1 = await prisma.user.create({
    data: { name: "Principal Pinewood", email: "admin1@voldebug.ai", passwordHash: await hashPassword("Admin123!"), role: "ADMIN", onboardingStatus: "COMPLETED" },
  });
  const school1 = await prisma.school.create({ data: { name: "Pinewood Academy", adminId: admin1.id } });
  
  await prisma.user.update({
    where: { id: admin1.id },
    data: { schoolId: school1.id }
  });

  const admin2 = await prisma.user.create({
    data: { name: "Principal Oakwood", email: "admin2@voldebug.ai", passwordHash: await hashPassword("Admin123!"), role: "ADMIN", onboardingStatus: "COMPLETED" },
  });
  const school2 = await prisma.school.create({ data: { name: "Oakwood High", adminId: admin2.id } });
  
  await prisma.user.update({
    where: { id: admin2.id },
    data: { schoolId: school2.id }
  });

  console.log("  Seeded 2 admins and their respective schools.");

  // 2. Create 3 Teachers for School 1
  const teachersSchool1 = [];
  const teacherNamesS1 = ["Mrs. Davis", "Mr. Clark", "Ms. Adams"];
  for (let i = 0; i < 3; i++) {
    const t = await prisma.user.create({
      data: {
        name: teacherNamesS1[i],
        email: `teacher${i + 1}_school1@voldebug.ai`,
        passwordHash: await hashPassword("Teacher123!"),
        role: "TEACHER",
        onboardingStatus: "COMPLETED",
        schoolId: school1.id
      }
    });
    teachersSchool1.push(t);
  }

  // Create 3 Teachers for School 2
  const teachersSchool2 = [];
  const teacherNamesS2 = ["Mr. Smith", "Mrs. Jones", "Ms. Baker"];
  for (let i = 0; i < 3; i++) {
    const t = await prisma.user.create({
      data: {
        name: teacherNamesS2[i],
        email: `teacher${i + 1}_school2@voldebug.ai`,
        passwordHash: await hashPassword("Teacher123!"),
        role: "TEACHER",
        onboardingStatus: "COMPLETED",
        schoolId: school2.id
      }
    });
    teachersSchool2.push(t);
  }

  console.log("  Seeded 3 teachers per school (6 total).");

  // 3. Create 3 Students for School 1
  const studentsSchool1 = [];
  const studentNamesS1 = ["Alice Smith", "Bob Jones", "Charlie Brown"];
  for (let i = 0; i < 3; i++) {
    const s = await prisma.user.create({
      data: {
        name: studentNamesS1[i],
        email: `student${i + 1}_school1@voldebug.ai`,
        passwordHash: await hashPassword("Student123!"),
        role: "STUDENT",
        onboardingStatus: "COMPLETED",
        gradeLevel: 10,
        schoolId: school1.id
      }
    });
    studentsSchool1.push(s);
  }

  // Create 3 Students for School 2
  const studentsSchool2 = [];
  const studentNamesS2 = ["David Green", "Emma White", "Frank Black"];
  for (let i = 0; i < 3; i++) {
    const s = await prisma.user.create({
      data: {
        name: studentNamesS2[i],
        email: `student${i + 1}_school2@voldebug.ai`,
        passwordHash: await hashPassword("Student123!"),
        role: "STUDENT",
        onboardingStatus: "COMPLETED",
        gradeLevel: 11,
        schoolId: school2.id
      }
    });
    studentsSchool2.push(s);
  }

  console.log("  Seeded 3 students per school (6 total).");

  // 4. Create Classes
  const classes = [];
  // School 1 classes
  const classNamesS1 = ["Intro to Programming", "Creative Writing", "AI Literature"];
  for (let i = 0; i < 3; i++) {
    const cls = await prisma.class.create({
      data: {
        name: classNamesS1[i],
        teacherId: teachersSchool1[i].id,
        schoolId: school1.id,
        joinCode: `PINE-${i + 1}01`
      }
    });
    classes.push(cls);
  }

  // School 2 classes
  const classNamesS2 = ["Algebra Essentials", "Modern Physics", "Business and AI"];
  for (let i = 0; i < 3; i++) {
    const cls = await prisma.class.create({
      data: {
        name: classNamesS2[i],
        teacherId: teachersSchool2[i].id,
        schoolId: school2.id,
        joinCode: `OAK-${i + 1}01`
      }
    });
    classes.push(cls);
  }

  console.log("  Seeded 3 classrooms per school (6 total).");

  // 5. Enroll Students in all classes of their respective school
  // School 1
  for (const s of studentsSchool1) {
    for (const cls of classes.slice(0, 3)) {
      await prisma.classMember.create({
        data: { classId: cls.id, userId: s.id }
      });
    }
  }

  // School 2
  for (const s of studentsSchool2) {
    for (const cls of classes.slice(3, 6)) {
      await prisma.classMember.create({
        data: { classId: cls.id, userId: s.id }
      });
    }
  }

  // 6. Generate Assignments
  const assignments = [];
  for (let i = 0; i < classes.length; i++) {
    const cls = classes[i];
    const teacherId = i < 3 ? teachersSchool1[i].id : teachersSchool2[i - 3].id;
    for (let j = 0; j < 2; j++) {
      const daysOffset = randomInt(-5, 5);
      assignments.push(await prisma.assignment.create({
        data: {
          title: `Assignment ${j + 1} - ${cls.name}`,
          description: "Complete this assignment using the suggested AI tools.",
          classId: cls.id,
          creatorId: teacherId,
          suggestedToolId: tools[randomInt(0, tools.length - 1)].id,
          dueDate: new Date(Date.now() + daysOffset * 24 * 60 * 60 * 1000),
          xpReward: randomInt(50, 100),
          earlyBonus: 15,
          status: "PUBLISHED",
          submissionFormats: ["PDF"],
        }
      }));
    }
  }

  console.log("  Seeded 2 assignments per classroom (12 total).");

  // 7. Submissions and XP evaluation logic
  const now = new Date();
  for (const asgn of assignments) {
    const members = await prisma.classMember.findMany({ where: { classId: asgn.classId } });
    for (const member of members) {
      if (Math.random() < 0.8) {
        const isEarly = Math.random() > 0.5;
        const submittedAt = isEarly ? randomDate(new Date(now.getTime() - 7 * 86400000), asgn.dueDate) : now;
        const isGraded = Math.random() > 0.3;
        const score = randomInt(50, 100);
        let gradeLetter = "A";
        if (score < 90) gradeLetter = "B";
        if (score < 80) gradeLetter = "C";
        if (score < 70) gradeLetter = "D";

        await prisma.submission.create({
          data: {
            assignmentId: asgn.id,
            studentId: member.userId,
            fileUrls: ["/uploads/test.pdf"],
            status: isGraded ? "GRADED" : "SUBMITTED",
            submittedAt,
            score: isGraded ? score : null,
            grade: isGraded ? gradeLetter : null,
            xpAwarded: isGraded ? asgn.xpReward + (isEarly ? asgn.earlyBonus! : 0) : null,
          }
        });

        if (isGraded) {
          await prisma.xPTransaction.create({
            data: {
              userId: member.userId,
              amount: asgn.xpReward + (isEarly ? asgn.earlyBonus! : 0),
              source: "ASSIGNMENT_GRADE",
              assignmentId: asgn.id,
            }
          });
        }
      }
    }
  }

  console.log("  Generated dynamic student submissions and XP logs.");

  // 8. Streaks and Badges
  const allStudents = [...studentsSchool1, ...studentsSchool2];
  for (const s of allStudents) {
    await prisma.streak.create({
      data: {
        userId: s.id,
        currentStreak: randomInt(1, 10),
        longestStreak: randomInt(5, 20),
        lastActiveDate: now,
      }
    });

    await prisma.userBadge.create({
      data: {
        userId: s.id,
        badgeId: badges[randomInt(0, badges.length - 1)].id,
        progressCount: 1
      }
    });
  }

  // 9. Seeding Audit Logs
  const aiTools = ["ChatGPT", "Claude", "GitHub Copilot"];

  const safePrompts = [
    { prompt: "Explain the difference between mitosis and meiosis in simple terms.", response: "Mitosis produces two identical daughter cells for growth and repair, while meiosis produces four genetically unique cells for reproduction." },
    { prompt: "Help me understand quadratic equations with examples.", response: "A quadratic equation has the form ax² + bx + c = 0. For example, x² - 5x + 6 = 0 gives solutions x = 2 and x = 3." },
    { prompt: "What are the main causes of the French Revolution?", response: "The French Revolution (1789) was caused by financial crisis, social inequality under the Estates system, and Enlightenment ideas." },
    { prompt: "Write a Python function to calculate the factorial of a number.", response: "def factorial(n):\n    if n <= 1:\n        return 1\n    return n * factorial(n - 1)" }
  ];

  const flaggedPrompts = [
    { prompt: "Write my entire history essay for me. I need 2000 words about World War II and I'll submit it as my own work.", response: "[BLOCKED] Academic dishonesty filters triggered." },
    { prompt: "Give me all the answers to the CBSE Class 10 math board exam 2025.", response: "[BLOCKED] Exam answers request blocked." },
    { prompt: "How do I hack into my school's grading portal to change my marks?", response: "[BLOCKED] Unauthorized system access guidance blocked." }
  ];

  for (let i = 0; i < 20; i++) {
    const student = allStudents[randomInt(0, allStudents.length - 1)];
    const safe = safePrompts[randomInt(0, safePrompts.length - 1)];
    const tool = aiTools[randomInt(0, aiTools.length - 1)];
    const daysAgo = randomInt(0, 10);
    
    await prisma.auditLog.create({
      data: {
        studentId: student.id,
        promptText: safe.prompt,
        aiResponse: safe.response,
        toolUsed: tool,
        isFlagged: false,
        timestamp: new Date(Date.now() - daysAgo * 86400000),
      }
    });
  }

  for (let i = 0; i < 6; i++) {
    const student = allStudents[randomInt(0, allStudents.length - 1)];
    const flagged = flaggedPrompts[randomInt(0, flaggedPrompts.length - 1)];
    const tool = aiTools[randomInt(0, aiTools.length - 1)];
    const daysAgo = randomInt(0, 7);

    await prisma.auditLog.create({
      data: {
        studentId: student.id,
        promptText: flagged.prompt,
        aiResponse: flagged.response,
        toolUsed: tool,
        isFlagged: true,
        timestamp: new Date(Date.now() - daysAgo * 86400000),
      }
    });
  }

  console.log("  Created 20 safe + 6 flagged audit log entries.");

  // 10. Seed Tool Quizzes
  const quizzesData = [
    {
      toolName: "ChatGPT",
      title: "ChatGPT Mastery Quiz",
      description: "Test your understanding of prompt engineering and general capabilities with ChatGPT.",
      questions: [
        {
          questionText: "What is the primary function of ChatGPT?",
          options: ["To write computer code only", "To generate images", "To hold conversational dialogues and answer questions", "To search the web for live weather data"],
          correctAnswerIndex: 2,
          explanation: "ChatGPT is a conversational AI designed for interactive dialogue, brainstorming, and general question answering."
        },
        {
          questionText: "How can you get more specific and high-quality responses from ChatGPT?",
          options: ["By writing single-word prompts", "By providing details, context, and clear guidelines in your prompt", "By writing in all capital letters", "By using search keywords instead of sentences"],
          correctAnswerIndex: 1,
          explanation: "Providing specific instructions, goals, and context helps the AI formulate relevant and accurate answers."
        }
      ]
    },
    {
      toolName: "Claude",
      title: "Claude Writing & Analysis Quiz",
      description: "Test your knowledge on using Claude for structured analysis and writing guidance.",
      questions: [
        {
          questionText: "Which of the following tasks is Claude highly suited for?",
          options: ["Generating high-resolution image assets", "Writing structured outlines, essays, and critical text analysis", "Running binary programs directly", "Playing real-time online games"],
          correctAnswerIndex: 1,
          explanation: "Claude is renowned for its advanced language skills, logical reasoning, and long-context text analysis."
        },
        {
          questionText: "What is the most constructive way to use Claude for assignments?",
          options: ["Asking it to generate a paper to submit as your own", "Using it to review concepts, check grammar, and outline ideas", "Using it to solve exams and test questions without studying", "Asking it to bypass security locks"],
          correctAnswerIndex: 1,
          explanation: "AI should be used as a tutor to outline, edit, and understand concepts, rather than for direct academic dishonesty."
        }
      ]
    },
    {
      toolName: "GitHub Copilot",
      title: "GitHub Copilot Coding Quiz",
      description: "Review safety and best practices when utilizing GitHub Copilot for code suggestions.",
      questions: [
        {
          questionText: "How does GitHub Copilot primarily assist developer workflow?",
          options: ["By compiling your codebase automatically", "By providing inline code autocompletions and logic suggestions", "By managing cloud deployment servers", "By designing user interface diagrams"],
          correctAnswerIndex: 1,
          explanation: "GitHub Copilot is an AI pair programmer that provides autocomplete suggestions as you type code."
        },
        {
          questionText: "When GitHub Copilot suggests a code snippet, what is the best practice?",
          options: ["Accept it blindly without review", "Review the code carefully, test it, and understand its logic", "Assume the code is always secure and accurate", "Never use it and code entirely manually"],
          correctAnswerIndex: 1,
          explanation: "AI code suggestions may contain bugs or security gaps. Always read, test, and adjust suggested code."
        }
      ]
    }
  ];

  for (const qData of quizzesData) {
    const dbTool = await prisma.tool.findFirst({
      where: { name: qData.toolName }
    });

    if (dbTool) {
      const quiz = await prisma.quiz.create({
        data: {
          title: qData.title,
          description: qData.description,
          toolId: dbTool.id,
          xpReward: 50,
          passingScore: 70
        }
      });

      for (const q of qData.questions) {
        await prisma.question.create({
          data: {
            quizId: quiz.id,
            type: "MULTIPLE_CHOICE",
            questionText: q.questionText,
            options: q.options,
            correctAnswerIndex: q.correctAnswerIndex,
            explanation: q.explanation
          }
        });
      }
    }
  }

  console.log("  Seeded tool quizzes.");
  console.log("Seed completely successful!");
}

main()
  .catch((e) => {
    console.error("Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
