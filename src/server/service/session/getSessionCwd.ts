import { dirname } from "node:path";
import { readFile } from "node:fs/promises";
import { getProject } from "../project/getProject";
import { parseJsonl } from "../parseJsonl";
import { getSession } from "./getSession";

/**
 * Resolve the correct working directory for a given session.
 * - For regular sessions, returns the project cwd extracted from JSONL.
 * - For worktree sessions, returns the specific worktree path.
 */
export const getSessionCwd = async (
  projectId: string,
  sessionId: string,
): Promise<string> => {
  const { session } = await getSession(projectId, sessionId);

  // Attempt to extract the recorded repo cwd from the session JSONL itself
  try {
    const content = await readFile(session.jsonlFilePath, "utf-8");
    const lines = content.split("\n");

    for (const line of lines) {
      const conversation = parseJsonl(line).at(0);
      if (
        conversation === undefined ||
        conversation === null ||
        // Skip meta-only entries
        (conversation as any).type === "summary" ||
        (conversation as any).type === "x-error"
      ) {
        continue;
      }

      const cwd = (conversation as any).cwd as string | undefined;
      if (cwd && cwd.length > 0) {
        return cwd;
      }
    }
  } catch {
    // Ignore and fall through to fallbacks
  }

  // Fallbacks: prefer project meta path, then the directory containing the JSONL file
  try {
    const { project } = await getProject(projectId);
    if (project.meta.projectPath) {
      return project.meta.projectPath;
    }
  } catch {
    // ignore
  }

  return dirname(session.jsonlFilePath);
};


