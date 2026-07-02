import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@web/lib/api";

// ─── Types ────────────────────────────────────────────────────────────────

export interface TeacherClass {
  id: string;
  name: string;
  schoolId: string;
  teacherId: string;
  createdAt: string;
  joinCode: string | null;
  _count?: { assignments: number; members: number };
}

export interface TeacherActivity {
  id: string;
  studentName: string;
  type: "SUBMISSION" | "COMPLETION" | "SAFETY_ALERT" | "AI_USE";
  detail: string;
  timestamp: string;
}

export interface TeacherAIUsage {
  mostUsedTools: { name: string; count: number; brandColor: string }[];
  dailyUsage: number;
  weeklyUsage: number;
}

export interface TeacherFrequentDoubt {
  word: string;
  count: number;
}

export interface TeacherSafetyAlert {
  id: string;
  studentName: string;
  gradeLevel: number | null;
  promptText: string;
  toolUsed: string;
  category: string;
  severity: string;
  timestamp: string;
}

export interface TeacherDashboard {
  schoolName: string | null;
  activeAssignments: number;
  pendingSubmissions: number;
  totalStudents: number;
  activeStudentsToday: number;
  safetyAlertsCount: number;
  averageGrade: number | null;
  completionRate: number;
  classInfo: TeacherClass[];
  recentSubmissions: PendingSubmission[];
  recentActivity: TeacherActivity[];
  aiUsage: TeacherAIUsage;
  frequentDoubts: TeacherFrequentDoubt[];
  safetyAlertsPreview: TeacherSafetyAlert[];
}

export interface PendingSubmission {
  id: string;
  studentId: string;
  studentName: string;
  studentImage: string | null;
  assignmentId: string;
  assignmentTitle: string;
  submittedAt: string;
  status: string;
  score: number | null;
  grade: string | null;
  xpAwarded: number | null;
}

export interface ClassDetail {
  id: string;
  name: string;
  joinCode: string | null;
  assignments: AssignmentSummary[];
  memberStats: StudentStats[];
}

export interface AssignmentSummary {
  id: string;
  title: string;
  dueDate: string;
  status: string;
  xpReward: number;
  _count: { submissions: number };
  suggestedTool: { id: string; name: string } | null;
}

export interface StudentStats {
  id: string;
  name: string | null;
  email: string | null;
  image: string | null;
  gradeLevel: number | null;
  studentId: string | null;
  submissionsCount: number;
  completedCount: number;
  avgScore: number | null;
  totalXPEarned: number;
  streak?: number;
  challengeCompleted?: boolean;
}

export interface Submission {
  id: string;
  studentId: string;
  assignmentId: string;
  fileUrls: string[];
  studentNotes: string | null;
  status: string;
  score: number | null;
  grade: string | null;
  feedback: string | null;
  xpAwarded: number | null;
  submittedAt: string;
  gradedAt: string | null;
  student: {
    id: string;
    name: string | null;
    email: string | null;
    image: string | null;
  };
  assignment: {
    id: string;
    title: string;
    xpReward: number;
    class: { id: string; name: string; teacherId: string };
    suggestedTool: { name: string; logoUrl: string } | null;
  };
}

// ─── Hooks ────────────────────────────────────────────────────────────────

export function useTeacherDashboard() {
  return useQuery({
    queryKey: ["teacher", "dashboard"],
    queryFn: () => api.get<TeacherDashboard>("/v1/teacher/dashboard"),
    staleTime: 30_000,
  });
}

export function useTeacherClasses() {
  return useQuery({
    queryKey: ["teacher", "classes"],
    queryFn: () => api.get<TeacherClass[]>("/v1/teacher/classes"),
    staleTime: 60_000,
  });
}

export function useClassDetail(classId: string) {
  return useQuery({
    queryKey: ["teacher", "classes", classId],
    queryFn: () => api.get<ClassDetail>(`/v1/teacher/classes/${classId}`),
    enabled: !!classId,
    staleTime: 30_000,
  });
}

export function useAssignmentSubmissions(assignmentId: string) {
  return useQuery({
    queryKey: ["submissions", "assignment", assignmentId],
    queryFn: () => api.get<Submission[]>(`/v1/submissions/assignment/${assignmentId}`),
    enabled: !!assignmentId,
    staleTime: 15_000,
  });
}

export function useSubmission(submissionId: string) {
  return useQuery({
    queryKey: ["submissions", submissionId],
    queryFn: () => api.get<Submission>(`/v1/submissions/${submissionId}`),
    enabled: !!submissionId,
  });
}

export function useGradeSubmission() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      submissionId,
      data,
    }: {
      submissionId: string;
      data: { score: number; grade: string; feedback: string; xpAwarded?: number };
    }) => api.patch(`/v1/submissions/${submissionId}/grade`, data as any),
    onSuccess: (_, { submissionId }) => {
      qc.invalidateQueries({ queryKey: ["submissions"] });
      qc.invalidateQueries({ queryKey: ["teacher"] });
      qc.invalidateQueries({ queryKey: ["assignments"] });
      qc.invalidateQueries({ queryKey: ["dashboard-stats"] });
      qc.invalidateQueries({ queryKey: ["leaderboard"] });
    },
  });
}

export function useCreateAssignment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      title: string;
      description: string;
      classId: string;
      suggestedToolId?: string;
      dueDate: string;
      xpReward: number;
      earlyBonus: number;
    }) => api.post("/v1/assignments", data as any),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["assignments"] });
      qc.invalidateQueries({ queryKey: ["teacher", "dashboard"] });
    },
  });
}

export function useDeleteAssignment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (assignmentId: string) =>
      api.delete(`/v1/assignments/${assignmentId}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["assignments"] });
      qc.invalidateQueries({ queryKey: ["teacher"] });
    },
  });
}

export function useTeacherAlerts() {
  return useQuery({
    queryKey: ["teacher", "alerts"],
    queryFn: () => api.get<TeacherSafetyAlert[]>("/v1/teacher/alerts"),
    staleTime: 15_000,
  });
}

export function useTeacherAnalytics() {
  return useQuery({
    queryKey: ["teacher", "analytics"],
    queryFn: () => api.get<any>("/v1/teacher/analytics"),
    staleTime: 30_000,
  });
}

export function useRegenerateClassCode() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (classId: string) =>
      api.post<{ class: { joinCode: string } }>(`/v1/classes/${classId}/regenerate-code`, {}),
    onSuccess: (data, classId) => {
      qc.invalidateQueries({ queryKey: ["teacher", "classes", classId] });
    },
  });
}

export function useCreateClass() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { name: string }) =>
      api.post<{ class: { id: string; name: string; joinCode: string } }>("/v1/classes", data as any),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["teacher", "classes"] });
      qc.invalidateQueries({ queryKey: ["teacher", "dashboard"] });
    },
  });
}

export function useCreateAnnouncement() {
  return useMutation({
    mutationFn: ({ classId, title, body }: { classId: string; title: string; body: string }) =>
      api.post<{ message: string }>(`/v1/classes/${classId}/announcements`, { title, body } as any),
  });
}
