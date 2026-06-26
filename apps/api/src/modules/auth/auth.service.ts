import { compare, hash } from "bcryptjs";
import { prisma } from "../../utils/prisma.js";
import { registerSchema, loginSchema, roleSchema, forgotPasswordSchema, resetPasswordSchema } from "./auth.schema.js";
import { generateToken } from "../../utils/jwt.js";
import type { UserRole } from "@prisma/client";
import crypto from "crypto";
import { logger } from "../../middleware/requestLogger.js";

export async function registerUser(input: {
  name: string;
  email: string;
  password: string;
}) {
  const data = registerSchema.parse(input);

  const existing = await prisma.user.findUnique({
    where: { email: data.email },
  });
  if (existing) {
    throw new Error("A user with that email already exists");
  }

  const passwordHash = await hash(data.password, 12);

  const user = await prisma.user.create({
    data: {
      name: data.name,
      email: data.email,
      passwordHash,
      role: "STUDENT",
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      onboardingStatus: true,
    },
  });

  return user;
}

export async function loginUser(input: { email: string; password: string }) {
  const data = loginSchema.parse(input);

  const user = await prisma.user.findUnique({
    where: { email: data.email },
  });

  if (!user || !user.passwordHash) {
    return null;
  }

  const valid = await compare(data.password, user.passwordHash);
  if (!valid) return null;

  // Update last active
  await prisma.user.update({
    where: { id: user.id },
    data: { lastActiveAt: new Date() },
  });

  const token = generateToken({
    id: user.id,
    email: user.email ?? "",
    role: user.role,
  });

  return {
    id: user.id,
    email: user.email,
    name: user.name ?? "",
    role: user.role,
    onboardingStatus: user.onboardingStatus,
    token,
  };
}

export async function setUserRole(userId: string, role: UserRole) {
  const data = roleSchema.parse({ role });

  const user = await prisma.user.update({
    where: { id: userId },
    data: { role },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      onboardingStatus: true,
    },
  });

  return user;
}

export async function getUserById(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      image: true,
      role: true,
      onboardingStatus: true,
      gradeLevel: true,
      studentId: true,
      schoolId: true,
      lastActiveAt: true,
    },
  });

  return user;
}

export async function findUser(email: string) {
  return prisma.user.findUnique({
    where: { email },
    select: {
      id: true,
      email: true,
      name: true,
      image: true,
      role: true,
      onboardingStatus: true,
    },
  });
}

export async function createUserFromProvider(email: string, name: string, image?: string) {
  let user = await prisma.user.findUnique({ where: { email } });

  if (!user) {
    user = await prisma.user.create({
      data: {
        email,
        name,
        image,
        role: "STUDENT",
      },
    });
  }

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    onboardingStatus: user.onboardingStatus,
  };
}

export async function requestPasswordReset(input: { email: string }) {
  const data = forgotPasswordSchema.parse(input);

  const user = await prisma.user.findUnique({
    where: { email: data.email },
  });

  if (!user) {
    logger.info(`Password reset requested for non-existent email: ${data.email}`);
    return { success: true };
  }

  const rawToken = crypto.randomBytes(32).toString("hex");
  const hashedToken = crypto.createHash("sha256").update(rawToken).digest("hex");
  const tokenExpiry = new Date(Date.now() + 3600 * 1000);

  await prisma.user.update({
    where: { id: user.id },
    data: {
      resetToken: hashedToken,
      resetTokenExpiry: tokenExpiry,
    },
  });

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const resetUrl = `${appUrl}/reset-password?token=${rawToken}`;

  logger.info(`[PASSWORD RESET LINK FOR ${data.email}]: ${resetUrl}`);

  const resendApiKey = process.env.RESEND_API_KEY;
  if (resendApiKey && !resendApiKey.startsWith("re_your")) {
    try {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${resendApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: process.env.RESEND_FROM_EMAIL || "noreply@voldebug.ai",
          to: data.email,
          subject: "Reset your Voldebug AI Password",
          html: `
            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e5e7eb; border-radius: 12px;">
              <h2 style="color: #4f46e5; margin-bottom: 20px;">Reset Your Password</h2>
              <p>You requested a password reset for your Voldebug AI account. Click the button below to choose a new password:</p>
              <div style="margin: 30px 0;">
                <a href="${resetUrl}" style="background-color: #4f46e5; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold; display: inline-block;">Reset Password</a>
              </div>
              <p style="color: #6b7280; font-size: 14px;">This link will expire in 1 hour.</p>
              <hr style="border: 0; border-top: 1px solid #e5e7eb; margin: 30px 0;" />
              <p style="color: #9ca3af; font-size: 12px;">If you didn't request this, you can safely ignore this email.</p>
            </div>
          `,
        }),
      });

      if (!res.ok) {
        const errorText = await res.text();
        logger.error(`Resend API returned error: ${errorText}`);
      } else {
        logger.info(`Password reset email successfully sent to ${data.email}`);
      }
    } catch (err) {
      logger.error(`Failed to send password reset email to ${data.email}: ${err}`);
    }
  }

  return { success: true };
}

export async function resetPasswordWithToken(input: { token: string; password: string }) {
  const data = resetPasswordSchema.parse(input);
  const hashedToken = crypto.createHash("sha256").update(data.token).digest("hex");

  const user = await prisma.user.findFirst({
    where: {
      resetToken: hashedToken,
      resetTokenExpiry: {
        gt: new Date(),
      },
    },
  });

  if (!user) {
    throw new Error("Invalid or expired password reset token");
  }

  const passwordHash = await hash(data.password, 12);

  await prisma.user.update({
    where: { id: user.id },
    data: {
      passwordHash,
      resetToken: null,
      resetTokenExpiry: null,
    },
  });

  logger.info(`Password successfully reset for user ID: ${user.id}`);
  return { success: true };
}
