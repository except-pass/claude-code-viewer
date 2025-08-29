import { readdir } from "node:fs/promises";
import { resolve } from "node:path";

import { claudeProjectPath } from "../paths";
import type { Project } from "../types";
import { encodeProjectId } from "./id";
import { getProjectMeta } from "./getProjectMeta";

export const getProjects = async (): Promise<{ projects: Project[] }> => {
  const dirents = await readdir(claudeProjectPath, { withFileTypes: true });
  const projects = await Promise.all(
    dirents
      .filter((d) => d.isDirectory())
      .map(async (d) => {
        const fullPath = resolve(d.parentPath, d.name);
        const id = encodeProjectId(fullPath);

        return {
          id,
          claudeProjectPath: fullPath,
          meta: await getProjectMeta(fullPath),
        };
      })
  );

  return {
    projects,
  };
};
