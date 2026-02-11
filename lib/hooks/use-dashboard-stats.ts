import { useQuery } from "@tanstack/react-query";

interface DashboardStats {
  counts: {
    total: number;
    admin: number;
    client1: number;
    client2: number;
  };
  growthChart: Array<{
    date: string;
    users: number;
    newUsers: number;
  }>;
}

/**
 * Hook to fetch dashboard statistics
 * Admin only
 */
export function useDashboardStats() {
  return useQuery<DashboardStats>({
    queryKey: ["dashboard-stats"],
    queryFn: async () => {
      const response = await fetch("/api/dashboard/stats");
      if (!response.ok) {
        throw new Error("Failed to fetch dashboard statistics");
      }
      return await response.json();
    },
    staleTime: 60 * 1000, // 1 minute - aligned with server cache (60s)
    gcTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
    refetchOnMount: false, // Use cached data on mount
  });
}
