import { useMutation, useQuery } from "@tanstack/react-query";
import { honoClient } from "@/lib/api/client";

export const useGitBranches = (projectId: string) => {
  return useQuery({
    queryKey: ["git", "branches", projectId],
    queryFn: async () => {
      const response = await honoClient.api.projects[
        ":projectId"
      ].git.branches.$get({
        param: { projectId },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch branches: ${response.statusText}`);
      }

      return response.json();
    },
    staleTime: 30000, // 30 seconds
  });
};

export const useGitCommits = (projectId: string) => {
  return useQuery({
    queryKey: ["git", "commits", projectId],
    queryFn: async () => {
      const response = await honoClient.api.projects[
        ":projectId"
      ].git.commits.$get({
        param: { projectId },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch commits: ${response.statusText}`);
      }

      return response.json();
    },
    staleTime: 30000, // 30 seconds
  });
};

export const useGitDiff = () => {
  return useMutation({
    mutationFn: async ({
      projectId,
      fromRef,
      toRef,
    }: {
      projectId: string;
      fromRef: string;
      toRef: string;
    }) => {
      const response = await honoClient.api.projects[
        ":projectId"
      ].git.diff.$post({
        param: { projectId },
        json: { fromRef, toRef },
      });

      if (!response.ok) {
        throw new Error(`Failed to get diff: ${response.statusText}`);
      }

      return response.json();
    },
  });
};

// Session-aware git hooks
export const useSessionGitBranches = (projectId: string, sessionId: string) => {
  return useQuery({
    queryKey: ["git", "branches", projectId, sessionId],
    queryFn: async () => {
      if (!sessionId || sessionId === "") {
        throw new Error("No session ID provided");
      }
      
      const response = await honoClient.api.projects[":projectId"].sessions[
        ":sessionId"
      ].git.branches.$get({
        param: { projectId, sessionId },
      });

      if (!response.ok) {
        throw new Error(
          `Failed to fetch session branches: ${response.statusText}`,
        );
      }

      return response.json();
    },
    staleTime: 30000, // 30 seconds
    enabled: Boolean(sessionId && sessionId !== ""), // Only run if sessionId is valid
  });
};

export const useSessionGitCommits = (projectId: string, sessionId: string) => {
  return useQuery({
    queryKey: ["git", "commits", projectId, sessionId],
    queryFn: async () => {
      if (!sessionId || sessionId === "") {
        throw new Error("No session ID provided");
      }
      
      const response = await honoClient.api.projects[":projectId"].sessions[
        ":sessionId"
      ].git.commits.$get({
        param: { projectId, sessionId },
      });

      if (!response.ok) {
        throw new Error(
          `Failed to fetch session commits: ${response.statusText}`,
        );
      }

      return response.json();
    },
    staleTime: 30000, // 30 seconds
    enabled: Boolean(sessionId && sessionId !== ""), // Only run if sessionId is valid
  });
};

export const useSessionGitDiff = () => {
  return useMutation({
    mutationFn: async ({
      projectId,
      sessionId,
      fromRef,
      toRef,
    }: {
      projectId: string;
      sessionId: string;
      fromRef: string;
      toRef: string;
    }) => {
      const response = await honoClient.api.projects[":projectId"].sessions[
        ":sessionId"
      ].git.diff.$post({
        param: { projectId, sessionId },
        json: { fromRef, toRef },
      });

      if (!response.ok) {
        throw new Error(`Failed to get session diff: ${response.statusText}`);
      }

      return response.json();
    },
  });
};
