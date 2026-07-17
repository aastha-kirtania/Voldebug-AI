import { useQuery } from "@tanstack/react-query";
import { api } from "@web/lib/api";

export interface PublicStats {
  studentsCount: number;
  toolsCount: number;
  totalXP: number;
}

export function usePublicStats() {
  return useQuery({
    queryKey: ["publicStats"],
    queryFn: () => api.get<PublicStats>("/v1/health/stats"),
    staleTime: 60 * 1000, // 1 minute
  });
}
