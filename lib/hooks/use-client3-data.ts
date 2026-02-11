import { useQuery } from "@tanstack/react-query";
import { getCachedData, setCachedData } from "../cache";

interface Client3Data {
  pl_client3: any;
  cashflow_client3: any;
  pipeline_client3: any;
  sgd_sankey_client3: any;
  usd_sankey_client3: any;
}

async function fetchClient3Data(): Promise<Client3Data> {
  // Try to get from cache first
  const cached = getCachedData<Client3Data>("csv-data-client3");
  if (cached) {
    console.log("📦 Using cached Client3 data from localStorage");
    return cached;
  }

  console.log("🌐 Fetching Client3 data from API...");
  const response = await fetch("/api/csv-data/client3", {
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch client3 data: ${response.statusText}`);
  }

  const data = await response.json();

  // Cache the result
  setCachedData("csv-data-client3", data);

  return data;
}

export function useClient3Data() {
  return useQuery({
    queryKey: ["csv-data-client3"],
    queryFn: fetchClient3Data,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
    retry: 2,
    refetchOnWindowFocus: false,
  });
}
