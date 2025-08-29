import { readFile } from "node:fs/promises";
import { decodeProjectId } from "../project/id";
import { resolve } from "node:path";
import { parseJsonl } from "../parseJsonl";
import type { SessionDetail } from "../types";
import { getSessionMeta } from "./getSessionMeta";

export const getSession = async (
  projectId: string,
  sessionId: string
): Promise<{
  session: SessionDetail;
}> => {
  const projectPath = decodeProjectId(projectId);
  const sessionPath = resolve(projectPath, `${sessionId}.jsonl`);

  const content = await readFile(sessionPath, "utf-8");

  const conversations = parseJsonl(content);

  const sessionDetail: SessionDetail = {
    id: sessionId,
    jsonlFilePath: sessionPath,
    meta: await getSessionMeta(sessionPath),
    conversations,
  };

  return {
    session: sessionDetail,
  };
};
