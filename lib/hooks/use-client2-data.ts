import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

// Cashflow Transactions
export function useCashflowTransactions() {
  return useQuery({
    queryKey: ["cashflow-transactions"],
    queryFn: async () => {
      const response = await fetch("/api/client2/cashflow");
      if (!response.ok)
        throw new Error("Failed to fetch cashflow transactions");
      const data = await response.json();
      return data.transactions;
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useAddCashflowTransaction() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (transaction: any) => {
      const response = await fetch("/api/client2/cashflow", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(transaction),
      });
      if (!response.ok) throw new Error("Failed to add transaction");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cashflow-transactions"] });
    },
  });
}

export function useUpdateCashflowTransaction() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (transaction: any) => {
      const response = await fetch("/api/client2/cashflow", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(transaction),
      });
      if (!response.ok) throw new Error("Failed to update transaction");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cashflow-transactions"] });
    },
  });
}

export function useDeleteCashflowTransaction() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/client2/cashflow?id=${id}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Failed to delete transaction");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cashflow-transactions"] });
    },
  });
}

// Pipeline Deals
export function usePipelineDeals() {
  return useQuery({
    queryKey: ["pipeline-deals"],
    queryFn: async () => {
      const response = await fetch("/api/client2/pipeline");
      if (!response.ok) throw new Error("Failed to fetch pipeline deals");
      const data = await response.json();
      return data.deals;
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useAddPipelineDeal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (deal: any) => {
      const response = await fetch("/api/client2/pipeline", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(deal),
      });
      if (!response.ok) throw new Error("Failed to add deal");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pipeline-deals"] });
    },
  });
}

export function useUpdatePipelineDeal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (deal: any) => {
      const response = await fetch("/api/client2/pipeline", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(deal),
      });
      if (!response.ok) throw new Error("Failed to update deal");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pipeline-deals"] });
    },
  });
}

export function useDeletePipelineDeal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/client2/pipeline?id=${id}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Failed to delete deal");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pipeline-deals"] });
    },
  });
}

// Projects
export function useProjects() {
  return useQuery({
    queryKey: ["projects"],
    queryFn: async () => {
      const response = await fetch("/api/client2/projects");
      if (!response.ok) throw new Error("Failed to fetch projects");
      const data = await response.json();
      return data.projects;
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useAddProject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (project: any) => {
      const response = await fetch("/api/client2/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(project),
      });
      if (!response.ok) throw new Error("Failed to add project");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
    },
  });
}

export function useUpdateProject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (project: any) => {
      const response = await fetch("/api/client2/projects", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(project),
      });
      if (!response.ok) throw new Error("Failed to update project");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
    },
  });
}

export function useDeleteProject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/client2/projects?id=${id}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Failed to delete project");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
    },
  });
}

// Project Costs
export function useProjectCosts() {
  return useQuery({
    queryKey: ["project-costs"],
    queryFn: async () => {
      const response = await fetch("/api/client2/project-costs");
      if (!response.ok) throw new Error("Failed to fetch project costs");
      const data = await response.json();
      return data.projectCosts;
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useAddProjectCost() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (cost: any) => {
      const response = await fetch("/api/client2/project-costs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(cost),
      });
      if (!response.ok) throw new Error("Failed to add project cost");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project-costs"] });
    },
  });
}

export function useUpdateProjectCost() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (cost: any) => {
      const response = await fetch("/api/client2/project-costs", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(cost),
      });
      if (!response.ok) throw new Error("Failed to update project cost");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project-costs"] });
    },
  });
}

export function useDeleteProjectCost() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/client2/project-costs?id=${id}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Failed to delete project cost");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project-costs"] });
    },
  });
}

// Client2 Settings (Opening Balance, EBITDA Adjustments, Classifications)
export function useClient2Settings() {
  return useQuery({
    queryKey: ["client2-settings"],
    queryFn: async () => {
      const response = await fetch("/api/client2/settings");
      if (!response.ok) throw new Error("Failed to fetch settings");
      const data = await response.json();
      return data.settings;
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useSaveClient2Settings() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (settings: any) => {
      const response = await fetch("/api/client2/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
      if (!response.ok) throw new Error("Failed to save settings");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["client2-settings"] });
    },
  });
}
