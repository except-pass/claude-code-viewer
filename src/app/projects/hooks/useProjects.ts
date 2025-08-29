import { useSuspenseQuery } from "@tanstack/react-query";
import { honoClient } from "../../../lib/api/client";

export const useProjects = () => {
  return useSuspenseQuery({
    queryKey: ["projects"],
    queryFn: async () => {
      const response = await honoClient.api.projects.$get();
      const { projects } = await response.json();
      return projects;
    },
  });
};
