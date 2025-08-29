import { statSync } from "node:fs";
import { readFile } from "node:fs/promises";
import type { Conversation } from "../../../lib/conversation-schema";
import { type ParsedCommand, parseCommandXml } from "../parseCommandXml";
import { parseJsonl } from "../parseJsonl";
import type { SessionMeta } from "../types";

const firstCommandCache = new Map<string, ParsedCommand | null>();

const getFirstCommand = (
  jsonlFilePath: string,
  lines: string[],
): ParsedCommand | null => {
  const cached = firstCommandCache.get(jsonlFilePath);
  if (cached !== undefined) {
    return cached;
  }

  let firstUserMessage: Conversation | null = null;

  for (const line of lines) {
    const conversation = parseJsonl(line).at(0);

    if (conversation === undefined || conversation.type !== "user") {
      continue;
    }

    firstUserMessage = conversation;

    break;
  }

  const firstMessageText =
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
          })();

  const firstCommand =
    firstMessageText === null ? null : parseCommandXml(firstMessageText);

  if (firstCommand !== null) {
    firstCommandCache.set(jsonlFilePath, firstCommand);
  }

  return firstCommand;
};

export const getSessionMeta = async (
  jsonlFilePath: string,
): Promise<SessionMeta> => {
  const stats = statSync(jsonlFilePath);
  const lastModifiedUnixTime = stats.ctime.getTime();

  const content = await readFile(jsonlFilePath, "utf-8");
  const lines = content.split("\n");

  const sessionMeta: SessionMeta = {
    messageCount: lines.length,
    firstCommand: getFirstCommand(jsonlFilePath, lines),
    lastModifiedAt: lastModifiedUnixTime
      ? new Date(lastModifiedUnixTime)
      : null,
  };

  return sessionMeta;
};
