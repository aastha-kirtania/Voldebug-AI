import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSession } from "next-auth/react";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

export interface Question {
  id: string;
  type: "MULTIPLE_CHOICE" | "TRUE_FALSE";
  questionText: string;
  options: string[];
  explanation?: string;
}

export interface Quiz {
  id: string;
  title: string;
  description?: string;
  xpReward: number;
  passingScore: number;
  questions: Question[];
}

export interface QuizAttempt {
  id: string;
  quizId: string;
  studentId: string;
  score: number;
  passed: boolean;
  answers: Record<string, number>;
  createdAt: string;
  quiz?: {
    id: string;
    title: string;
    toolId: string;
  };
}

export function useQuiz(toolId: string) {
  const { data: session } = useSession();
  const token = (session?.user as any)?.token;

  return useQuery<Quiz | null>({
    queryKey: ["quiz", toolId],
    queryFn: async () => {
      if (!toolId) return null;
      const res = await fetch(`${API_URL}/v1/quizzes/tool/${toolId}`, {
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      if (res.status === 404) return null;
      if (!res.ok) throw new Error("Failed to fetch quiz");
      const json = await res.json();
      return json.data;
    },
    enabled: !!toolId && !!token,
  });
}

export function useQuizAttempts() {
  const { data: session } = useSession();
  const token = (session?.user as any)?.token;

  return useQuery<QuizAttempt[]>({
    queryKey: ["quiz-attempts"],
    queryFn: async () => {
      const res = await fetch(`${API_URL}/v1/quizzes/attempts`, {
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      if (!res.ok) throw new Error("Failed to fetch quiz attempts");
      const json = await res.json();
      return json.data || [];
    },
    enabled: !!token,
  });
}

export function useSubmitQuizAttempt() {
  const { data: session } = useSession();
  const token = (session?.user as any)?.token;
  const queryClient = useQueryClient();

  return useMutation<
    {
      attemptId: string;
      score: number;
      passed: boolean;
      correctCount: number;
      totalQuestions: number;
      xpEarned: number;
      xpTotal?: number;
      levelUp?: boolean;
      badgesEarned?: any[];
    },
    Error,
    { quizId: string; answers: Record<string, number> }
  >({
    mutationFn: async ({ quizId, answers }) => {
      const res = await fetch(`${API_URL}/v1/quizzes/${quizId}/submit`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ answers }),
      });
      if (!res.ok) throw new Error("Failed to submit quiz attempt");
      const json = await res.json();
      return json.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["quiz-attempts"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
    },
  });
}
