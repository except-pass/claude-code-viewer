import { readdir } from "node:fs/promises";
import { resolve } from "node:path";

import { claudeProjectPath } from "../paths";
import { getProjectMeta } from "../project/getProjectMeta";
import { encodeProjectId } from "../project/id";
import type { Project } from "../types";

/**
 * Checks if a project directory name indicates it's a worktree project
 * Matches pattern: {project-name}-worktrees-{uuid} or --{path}--{project}-worktrees-{uuid}
 */
export const isWorktreeProject = (projectDirName: string): boolean => {
  return projectDirName.includes("-worktrees-");
};

/**
 * Extracts the parent project path from a worktree project's Claude directory name
 * Returns the corresponding parent project path in ~/.claude/projects/
 */
export const findParentProjectPath = async (
  worktreeProjectPath: string,
): Promise<string | null> => {
  try {
    // Extract the directory name from the path
    const worktreeProjectDirName = worktreeProjectPath.split('/').pop();
    if (!worktreeProjectDirName || !isWorktreeProject(worktreeProjectDirName)) {
      return null;
    }

    // Extract parent project name from worktree directory name
    const parentProjectName = extractParentProjectNameFromWorktreePath(worktreeProjectDirName);
    if (!parentProjectName) {
      return null;
    }

    // The parent project should exist in ~/.claude/projects/
    const parentProjectPath = resolve(claudeProjectPath, parentProjectName);
    
    // Verify it exists and is not itself a worktree
    try {
      const meta = await getProjectMeta(parentProjectPath);
      return meta ? parentProjectPath : null;
    } catch {
      return null;
    }
  } catch {
    return null;
  }
};

/**
 * Checks if a session is from a worktree based on its file path
 */
export const isWorktreeSession = (sessionFilePath: string): boolean => {
  return sessionFilePath.includes("-worktrees-");
};

/**
 * Extracts the parent project name from a worktree directory name
 * Example: "-home-ubuntu-repo-tinstar-worktrees-uuid" -> "-home-ubuntu-repo-tinstar"
 * Example: "--home-ubuntu--tinstar-worktrees-uuid" -> "-home-ubuntu--tinstar"
 */
export const extractParentProjectNameFromWorktreePath = (
  worktreeProjectDirName: string,
): string | null => {
  // Pattern: {project-name}-worktrees-{uuid}
  const match = worktreeProjectDirName.match(/^(.+)-worktrees-[^-]+$/);
  return match?.[1] ?? null;
};

/**
 * Gets all worktree projects that belong to a parent project
 */
export const getWorktreeProjects = async (
  parentProjectPath: string,
): Promise<Project[]> => {
  try {
    // Extract the parent project directory name
    const parentProjectDirName = parentProjectPath.split('/').pop();
    if (!parentProjectDirName) {
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

      if (parentProjectName === parentProjectDirName) {
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
