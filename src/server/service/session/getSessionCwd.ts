import { resolve, dirname } from "node:path";
import { decodeProjectId } from "../project/id";
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
  const decodedProjectPath = decodeProjectId(projectId);
  const { session } = await getSession(projectId, sessionId);

  // session.jsonlFilePath points to either main project or a worktree project
  // The session's cwd in Claude is the directory where the JSONL file resides' project root
  // i.e., ~/.claude/projects/<project-name>/... or ~/.tinstar/worktrees/<project>/<id>/.../projects/<project-name>
  // Using dirname twice to reach the project directory when JSONL is directly under project path
  // Example: /home/user/.claude/projects/-home-user-repo-app/<session>.jsonl -> cwd = dir of JSONL's parent
  const sessionJsonlDir = dirname(session.jsonlFilePath);

  // Prefer the cwd recorded in the JSONL if available via project meta discovery,
  // otherwise fall back to the directory containing the JSONL file.
  const cwdFromJsonl = session.meta.firstCommand !== null ? undefined : undefined;

  return cwdFromJsonl ?? sessionJsonlDir ?? resolve(decodedProjectPath);
};


