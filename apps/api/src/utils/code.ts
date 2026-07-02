import { prisma } from "./prisma.js";

export function generateJoinCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // Omitted 0, O, 1, I for readability
  let result = "";
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export async function generateUniqueClassCode(): Promise<string> {
  let attempts = 0;
  while (attempts < 100) {
    const code = generateJoinCode();
    const exists = await prisma.class.findUnique({
      where: { joinCode: code },
    });
    if (!exists) {
      return code;
    }
    attempts++;
  }
  throw new Error("Failed to generate a unique class join code.");
}
