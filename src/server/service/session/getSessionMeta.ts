import { statSync } from "node:fs";
import { readFile } from "node:fs/promises";

import { parseJsonl } from "../parseJsonl";
import type { Conversation } from "../../../lib/conversation-schema";
import type { SessionMeta } from "../types";

const sessionMetaCache = new Map<string, SessionMeta>();

export const getSessionMeta = async (
  jsonlFilePath: string
): Promise<SessionMeta> => {
  const cached = sessionMetaCache.get(jsonlFilePath);
  if (cached !== undefined) {
    return cached;
  }

  const stats = statSync(jsonlFilePath);
  const lastModifiedUnixTime = stats.ctime.getTime();

  const content = await readFile(jsonlFilePath, "utf-8");
  const lines = content.split("\n");

  let firstUserMessage: Conversation | null = null;

  for (const line of lines) {
    const conversation = parseJsonl(line).at(0);

    if (conversation === undefined || conversation.type !== "user") {
      continue;
    }

    firstUserMessage = conversation;

    break;
  }

  const sessionMeta: SessionMeta = {
    messageCount: lines.length,
    firstContent:
      firstUserMessage === null
        ? null
        : typeof firstUserMessage.message.content === "string"
        ? firstUserMessage.message.content
        : (() => {
            const firstContent = firstUserMessage.message.content.at(0);
            if (firstContent === undefined) return null;
            if (typeof firstContent === "string") return firstContent;
            if (firstContent.type === "text") return firstContent.text;
            return null;
          })(),
    lastModifiedAt: lastModifiedUnixTime
      ? new Date(lastModifiedUnixTime)
      : null,
  };

  sessionMetaCache.set(jsonlFilePath, sessionMeta);

  return sessionMeta;
};
