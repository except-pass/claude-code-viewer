import type { HonoAppType } from "./app";
import { getProjects } from "../service/project/getProjects";
import { getProject } from "../service/project/getProject";
import { getSessions } from "../service/session/getSessions";
import { getSession } from "../service/session/getSession";

export const routes = (app: HonoAppType) => {
  return app
    .get("/projects", async (c) => {
      const { projects } = await getProjects();
      return c.json({ projects });
    })

    .get("/projects/:projectId", async (c) => {
      const { projectId } = c.req.param();

      const [{ project }, { sessions }] = await Promise.all([
        getProject(projectId),
        getSessions(projectId),
      ] as const);

      return c.json({ project, sessions });
    })

    .get("/projects/:projectId/sessions/:sessionId", async (c) => {
      const { projectId, sessionId } = c.req.param();
      const { session } = await getSession(projectId, sessionId);
      return c.json({ session });
    });
};

export type RouteType = ReturnType<typeof routes>;
