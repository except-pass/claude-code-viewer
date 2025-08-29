import { statSync } from "node:fs";
import { readdir, readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";

import { parseJsonl } from "../parseJsonl";
import type { ProjectMeta } from "../types";

const projectMetaCache = new Map<string, ProjectMeta>();

const extractMetaFromJsonl = async (filePath: string) => {
  const content = await readFile(filePath, "utf-8");
  const lines = content.split("\n");

  let cwd: string | null = null;

  for (const line of lines) {
    const conversation = parseJsonl(line).at(0);

    if (conversation === undefined || conversation.type === "summary") {
      continue;
    }

    cwd = conversation.cwd;

    break;
  }

  return {
    cwd,
  } as const;
};

export const getProjectMeta = async (
  claudeProjectPath: string
): Promise<ProjectMeta> => {
  const cached = projectMetaCache.get(claudeProjectPath);
  if (cached !== undefined) {
    return cached;
  }

  const dirents = await readdir(claudeProjectPath, { withFileTypes: true });
  const files = dirents
    .filter((d) => d.isFile() && d.name.endsWith(".jsonl"))
    .map(
      (d) =>
        ({
          fullPath: resolve(d.parentPath, d.name),
          stats: statSync(resolve(d.parentPath, d.name)),
        } as const)
    )
    .toSorted((a, b) => {
      return a.stats.ctime.getTime() - b.stats.ctime.getTime();
    });

  const lastModifiedUnixTime = files.at(-1)?.stats.ctime.getTime();

  let cwd: string | null = null;

  for (const file of files) {
    const result = await extractMetaFromJsonl(file.fullPath);

    if (result.cwd === null) {
      continue;
    }

    cwd = result.cwd;

    break;
  }

  const projectMeta: ProjectMeta = {
    projectName: cwd ? dirname(cwd) : null,
    projectPath: cwd,
    lastModifiedAt: lastModifiedUnixTime
      ? new Date(lastModifiedUnixTime)
      : null,
    sessionCount: files.length,
  };

  projectMetaCache.set(claudeProjectPath, projectMeta);

  return projectMeta;
};
