"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";

export function QueryProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 2 * 60 * 1000, // 2 minutes - aligned with server cache
            gcTime: 5 * 60 * 1000, // 5 minutes
            refetchOnWindowFocus: false, // Don't refetch on window focus
            refetchOnMount: false, // Use cached data on mount (faster)
            retry: 1, // Retry failed requests once
            networkMode: "online",
          },
          mutations: {
            retry: 1, // Retry mutations once on failure
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}
