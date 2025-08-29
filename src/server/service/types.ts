import type { Conversation } from "../../lib/conversation-schema";

export type Project = {
  id: string;
  claudeProjectPath: string;
  meta: ProjectMeta;
};

export type ProjectMeta = {
  projectName: string | null;
  projectPath: string | null;
  lastModifiedAt: Date | null;
  sessionCount: number;
};

export type Session = {
  id: string;
  jsonlFilePath: string;
  meta: SessionMeta;
};

export type SessionMeta = {
  messageCount: number;
  firstContent: string | null;
  lastModifiedAt: Date | null;
};

export type SessionDetail = Session & {
  conversations: Conversation[];
};
