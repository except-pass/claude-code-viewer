import { readdir } from "node:fs/promises";
import { resolve } from "node:path";

import { claudeProjectPath } from "../paths";
import { getProjectMeta } from "../project/getProjectMeta";
import { encodeProjectId } from "../project/id";
import type { Project } from "../types";

/**
 * Checks if a project directory name indicates it's a worktree project
 */
export const isWorktreeProject = (projectDirName: string): boolean => {
  return projectDirName.includes("-tinstar-worktrees-");
};

/**
 * Extracts the parent project path from a worktree project's metadata
 * Returns the original repository path that the worktree was created from
 */
export const findParentProjectPath = async (
  worktreeProjectPath: string,
): Promise<string | null> => {
  try {
    const meta = await getProjectMeta(worktreeProjectPath);

    if (!meta.projectPath || !meta.projectName) {
      return null;
    }

    // The worktree's project path should be something like:
    // /home/ubuntu/.tinstar/worktrees/{uuid}
    // We need to find the original repo that this worktree was created from
    if (meta.projectPath.includes("/.tinstar/worktrees/")) {
      const projectName = meta.projectName;

      // Look for a project with the same name but not in worktrees
      const dirents = await readdir(claudeProjectPath, { withFileTypes: true });

      for (const dirent of dirents) {
        if (!dirent.isDirectory() || isWorktreeProject(dirent.name)) {
          continue;
        }

        const candidatePath = resolve(dirent.parentPath, dirent.name);
        const candidateMeta = await getProjectMeta(candidatePath);

        if (candidateMeta.projectName === projectName) {
          return candidatePath;
        }
      }
    }

    return null;
  } catch {
    return null;
  }
};

/**
 * Checks if a session is from a worktree based on its file path
 */
export const isWorktreeSession = (sessionFilePath: string): boolean => {
  return sessionFilePath.includes("-tinstar-worktrees-");
};

/**
 * Extracts the parent project name from a worktree directory name
 * Example: "-home-ubuntu--tinstar-worktrees-uuid" -> "tinstar"
 */
export const extractParentProjectNameFromWorktreePath = (
  worktreeProjectDirName: string,
): string | null => {
  // Pattern: -{path-with-dashes}--{project-name}-worktrees-{uuid}
  const match = worktreeProjectDirName.match(/--(.+?)-worktrees-/);
  return match?.[1] ?? null;
};

/**
 * Gets all worktree projects that belong to a parent project
 */
export const getWorktreeProjects = async (
  parentProjectPath: string,
): Promise<Project[]> => {
  try {
    const parentMeta = await getProjectMeta(parentProjectPath);

    if (!parentMeta.projectName) {
      return [];
    }

    const dirents = await readdir(claudeProjectPath, { withFileTypes: true });
    const worktreeProjects: Project[] = [];

    for (const dirent of dirents) {
      if (!dirent.isDirectory() || !isWorktreeProject(dirent.name)) {
        continue;
      }

      // Extract parent project name from the worktree directory pattern
      const parentProjectName = extractParentProjectNameFromWorktreePath(
        dirent.name,
      );

      if (parentProjectName === parentMeta.projectName) {
        const worktreePath = resolve(dirent.parentPath, dirent.name);
        const id = encodeProjectId(worktreePath);
        const worktreeMeta = await getProjectMeta(worktreePath);

        worktreeProjects.push({
          id,
          claudeProjectPath: worktreePath,
          meta: worktreeMeta,
        });
      }
    }

    return worktreeProjects;
  } catch {
    return [];
  }
};
