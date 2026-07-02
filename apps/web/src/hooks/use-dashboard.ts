import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@web/lib/api";

// ─── Types ──────────────────────────────────────────────────────────────

interface Tool {
  id: string;
  name: string;
  category: string;
  description: string;
  logoUrl: string;
  brandColor: string;
  usageCount: number;
  subjects: string[];
  useCases: string[];
}

interface AssignmentResponse {
  id: string;
  title: string;
  description: string;
  dueDate: string;
  xpReward: number;
  earlyBonus: number;
  status: string;
  className: string;
  suggestedTool: Tool | null;
  submissions: { id: string }[];
  createdAt: string;
}

interface DashboardStats {
  user?: {
    name: string | null;
    role: string | null;
    gradeLevel: number | null;
    schoolName: string | null;
  };
  xp: {
    total: number;
    level: number;
    thisWeek: number;
    toNextLevel: number;
  };
  streak: {
    current: number;
    longest: number;
  };
  classRank: number | null;
  badges: {
    earned: number;
    total: number;
    items?: any[];
  };
  submissionCount: number;
  pendingAssignments: number;
  recentActivity?: {
    id: string;
    amount: number;
    source: string;
    createdAt: string;
  }[];
  classes?: {
    id: string;
    name: string;
    teacherId: string;
    schoolId: string | null;
    joinCode: string | null;
  }[];
}

// ─── Queries ────────────────────────────────────────────────────────────

export function useDashboardStats() {
  return useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: () => api.get<DashboardStats>("/v1/dashboard/stats"),
    staleTime: 60_000,
    retry: 2,
  });
}

export function useAssignments() {
  return useQuery({
    queryKey: ["assignments"],
    queryFn: () => api.get<AssignmentResponse[]>("/v1/assignments"),
    staleTime: 30_000,
    retry: 2,
  });
}

export function useTools() {
  return useQuery({
    queryKey: ["tools"],
    queryFn: () => api.get<Tool[]>("/v1/tools"),
    staleTime: 5 * 60_000,
    retry: 2,
  });
}

export interface DailyChallengeResponse {
  id: string;
  date: string;
  action: string;
  completed: boolean;
  xpAwarded: number | null;
}

export function useDailyChallenge() {
  return useQuery({
    queryKey: ["daily-challenge"],
    queryFn: () => api.get<DailyChallengeResponse>("/v1/gamification/challenge"),
    staleTime: 30_000,
    retry: 2,
  });
}

export interface RoadmapTool extends Tool {
  isCompleted: boolean;
  isLocked: boolean;
  requiredLevel: number;
}

export interface RoadmapResponse {
  tools: RoadmapTool[];
  recommendedToolId: string | null;
  studentProgress: {
    totalXP: number;
    currentLevel: number;
    xpNeededForNextLevel: number;
    percentToNextLevel: number;
    gradeLevel: number;
  };
}

export function useRoadmap() {
  return useQuery({
    queryKey: ["roadmap"],
    queryFn: () => api.get<RoadmapResponse>("/v1/gamification/roadmap"),
    staleTime: 30_000,
    retry: 2,
  });
}

export interface ParentSettingsInput {
  parentEmail: string | null;
  parentReportingEnabled: boolean;
  parentReportFrequency: string;
}

export function useSaveParentSettings() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: ParentSettingsInput) =>
      api.post<any>("/v1/gamification/parent/settings", data as any),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
    },
  });
}

export function useTriggerParentReport() {
  return useMutation({
    mutationFn: () => api.post<any>("/v1/gamification/parent/trigger", {}),
  });
}

export interface UpdateProfileInput {
  name?: string;
  avatar?: string;
}

export function useUpdateProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: UpdateProfileInput) =>
      api.patch<{ id: string; name: string; image: string }>("/v1/users/profile", data as any),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
    },
  });
}
