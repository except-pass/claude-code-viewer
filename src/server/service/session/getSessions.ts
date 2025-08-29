import { readdir } from "node:fs/promises";
import { basename, extname, resolve } from "node:path";

import { decodeProjectId } from "../project/id";
import type { Session } from "../types";
import { getSessionMeta } from "./getSessionMeta";

export const getSessions = async (
  projectId: string
): Promise<{ sessions: Session[] }> => {
  const claudeProjectPath = decodeProjectId(projectId);

  const dirents = await readdir(claudeProjectPath, { withFileTypes: true });
  const sessions = await Promise.all(
    dirents
      .filter((d) => d.isFile() && d.name.endsWith(".jsonl"))
      .map(async (d): Promise<Session> => {
        const fullPath = resolve(d.parentPath, d.name);

        return {
          id: basename(fullPath, extname(fullPath)),
          jsonlFilePath: fullPath,
          meta: await getSessionMeta(fullPath),
        };
      })
  );

  return {
    sessions,
  };
};
