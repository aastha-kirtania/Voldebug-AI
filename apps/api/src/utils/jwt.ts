import jwt from "jsonwebtoken";
import { env } from "../config/env.js";

export function generateToken(payload: {
  id: string;
  email: string;
  role: string;
}): string {
  return jwt.sign(
    payload,
    env.JWT_SECRET,
    { expiresIn: "30d" },
  );
}

export function verifyToken(token: string): {
  id: string;
  email: string;
  role: string;
  iat: number;
} {
  return jwt.verify(token, env.JWT_SECRET) as any;
}
