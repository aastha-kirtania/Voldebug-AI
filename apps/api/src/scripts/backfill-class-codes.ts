import { prisma } from "../utils/prisma.js";
import { generateUniqueClassCode } from "../utils/code.js";

async function main() {
  console.log("Starting backfill for class join codes...");
  const classes = await prisma.class.findMany({
    where: { joinCode: null },
  });

  console.log(`Found ${classes.length} classes without join codes.`);

  for (const c of classes) {
    const code = await generateUniqueClassCode();
    await prisma.class.update({
      where: { id: c.id },
      data: { joinCode: code },
    });
    console.log(`Assigned code ${code} to class "${c.name}" (ID: ${c.id})`);
  }

  console.log("Backfill completed successfully.");
}

main()
  .catch((err) => {
    console.error("Backfill failed:", err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
