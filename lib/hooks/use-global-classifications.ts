import { useQuery } from "@tanstack/react-query";

interface GlobalClassificationsResponse {
  classifications: Record<string, string>;
  hasClassifications: boolean;
}

export function useGlobalClassifications() {
  return useQuery<GlobalClassificationsResponse>({
    queryKey: ["global-classifications"],
    queryFn: async () => {
      const response = await fetch("/api/global-classifications");
      if (!response.ok) {
        throw new Error("Failed to fetch global classifications");
      }
      return response.json();
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 1,
  });
}
