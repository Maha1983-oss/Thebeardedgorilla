import { useQuery, useQueryClient } from "@tanstack/react-query";

export interface SessionUser {
  id: string;
  name: string;
  email: string;
  role: "admin" | "client1" | "client2";
}

/**
 * Hook to fetch current user session
 * Cached in React Query - will be invalidated on logout
 */
export function useUser() {
  return useQuery<SessionUser>({
    queryKey: ["user-session"],
    queryFn: async () => {
      const response = await fetch("/api/auth/me");

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error("Unauthorized");
        }
        throw new Error("Failed to fetch user session");
      }

      const data = await response.json();

      if (data.error) {
        throw new Error(data.error);
      }

      return data as SessionUser;
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus: false,
    refetchOnMount: false, // Use cached session (faster)
    retry: false, // Don't retry on 401
  });
}

/**
 * Hook to logout and clear all caches
 */
export function useLogout() {
  const queryClient = useQueryClient();

  return async () => {
    try {
      // Call logout API
      await fetch("/api/auth/logout", { method: "POST" });

      // Clear ALL React Query caches
      queryClient.clear();

      // Clear module-level cache in sidebar-wrapper
      if (typeof window !== "undefined") {
        // Dispatch custom event to clear module cache
        window.dispatchEvent(new Event("auth:logout"));
      }

      // Redirect to login
      window.location.href = "/login";
    } catch (error) {
      console.error("Logout error:", error);
      // Force redirect even on error
      window.location.href = "/login";
    }
  };
}
