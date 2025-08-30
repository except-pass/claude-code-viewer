"use client";

import type { FC } from "react";
import type { Conversation } from "@/lib/conversation-schema";
import type { ToolResultContent } from "@/lib/conversation-schema/content/ToolResultContentSchema";
import { useSidechain } from "../../hooks/useSidechain";
import { ConversationItem } from "./ConversationItem";

const getConversationKey = (conversation: Conversation) => {
  if (conversation.type === "user") {
    return `user_${conversation.uuid}`;
  }

  if (conversation.type === "assistant") {
    return `assistant_${conversation.uuid}`;
  }

  if (conversation.type === "system") {
    return `system_${conversation.uuid}`;
  }

  if (conversation.type === "summary") {
    return `summary_${conversation.leafUuid}`;
  }

  throw new Error(`Unknown conversation type: ${conversation}`);
};

type ConversationListProps = {
  conversations: Conversation[];
  getToolResult: (toolUseId: string) => ToolResultContent | undefined;
};

export const ConversationList: FC<ConversationListProps> = ({
  conversations,
  getToolResult,
}) => {
  const { isRootSidechain, getSidechainConversations } =
    useSidechain(conversations);

  return (
    <ul>
      {conversations.flatMap((conversation) => {
        const elm = (
          <ConversationItem
            key={getConversationKey(conversation)}
            conversation={conversation}
            getToolResult={getToolResult}
            isRootSidechain={isRootSidechain}
            getSidechainConversations={getSidechainConversations}
          />
        );

        return [
          <li
            className={`w-full flex ${
              conversation.type === "user"
                ? "justify-end"
                : conversation.type === "assistant"
                  ? "justify-start"
                  : "justify-center"
            }`}
            key={getConversationKey(conversation)}
          >
            <div
              className={`${
                conversation.type === "user"
                  ? "w-[90%]"
                  : conversation.type === "assistant"
                    ? "w-[90%]"
                    : "w-[100%]"
              }`}
            >
              {elm}
            </div>
          </li>,
        ];
      })}
    </ul>
  );
};
