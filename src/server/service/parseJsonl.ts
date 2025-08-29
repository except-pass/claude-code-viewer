import { ConversationSchema } from "../../lib/conversation-schema";

export const parseJsonl = (content: string) => {
  const lines = content
    .trim()
    .split("\n")
    .filter((line) => line.trim() !== "");

  return lines.flatMap((line) => {
    const parsed = ConversationSchema.safeParse(JSON.parse(line));
    if (!parsed.success) {
      console.warn("Failed to parse jsonl, skipping", parsed.error);
      return [];
    }

    return parsed.data;
  });
};
