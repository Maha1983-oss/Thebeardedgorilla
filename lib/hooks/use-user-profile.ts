import { useQuery } from "@tanstack/react-query";

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: "admin" | "client1" | "client2";
  gender?: "male" | "female" | "other" | "prefer_not_to_say" | null;
  phone?: string | null;
  address?: string | null;
}

export function useUserProfile(userId?: string) {
  return useQuery<UserProfile | null>({
    queryKey: ["user-profile", userId],
    enabled: Boolean(userId),
    queryFn: async () => {
      if (!userId) return null;
      const res = await fetch(`/api/users/${userId}`);
      if (res.status === 404) return null;
      if (!res.ok) throw new Error("Failed to fetch user profile");
      return (await res.json()) as UserProfile;
    },
    staleTime: 2 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
}
