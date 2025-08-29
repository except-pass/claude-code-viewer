import { useSuspenseQuery } from "@tanstack/react-query";
import { honoClient } from "../../../../../../lib/api/client";

export const useConversationsQuery = (projectId: string, sessionId: string) => {
  return useSuspenseQuery({
    queryKey: ["conversations", sessionId],
    queryFn: async () => {
      const response = await honoClient.api.projects[":projectId"].sessions[
        ":sessionId"
      ].$get({
        param: {
          projectId,
          sessionId,
        },
      });
      return response.json();
    },
  });
};
