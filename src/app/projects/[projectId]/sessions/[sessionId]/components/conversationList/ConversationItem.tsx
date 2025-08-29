import type { Conversation } from "@/lib/conversation-schema";
import type { ToolResultContent } from "@/lib/conversation-schema/content/ToolResultContentSchema";
import type { FC } from "react";
import { UserConversationContent } from "./UserConversationContent";
import { AssistantConversationContent } from "./AssistantConversationContent";
import { MetaConversationContent } from "./MetaConversationContent";
import { SystemConversationContent } from "./SystemConversationContent";
import { SummaryConversationContent } from "./SummaryConversationContent";

export const ConversationItem: FC<{
  conversation: Conversation;
  getToolResult: (toolUseId: string) => ToolResultContent | undefined;
}> = ({ conversation, getToolResult }) => {
  if (conversation.type === "summary") {
    return (
      <SummaryConversationContent>
        {conversation.summary}
      </SummaryConversationContent>
    );
  }

  if (conversation.type === "system") {
    return (
      <SystemConversationContent>
        {conversation.content}
      </SystemConversationContent>
    );
  }

  if (conversation.isSidechain) {
    // sidechain = サブタスクのこと
    // 別途ツール呼び出しの方で描画可能にするのでここでは表示しない
    return null;
  }

  if (conversation.type === "user") {
    const userConversationJsx =
      typeof conversation.message.content === "string" ? (
        <UserConversationContent content={conversation.message.content} />
      ) : (
        <ul className="w-full">
          {conversation.message.content.map((content) => (
            <li key={content.toString()}>
              <UserConversationContent content={content} />
            </li>
          ))}
        </ul>
      );

    return conversation.isMeta === true ? (
      // 展開可能にしてデフォで非展開
      <MetaConversationContent>{userConversationJsx}</MetaConversationContent>
    ) : (
      userConversationJsx
    );
  }

  if (conversation.type === "assistant") {
    return (
      <ul className="w-full">
        {conversation.message.content.map((content) => (
          <li key={content.toString()}>
            <AssistantConversationContent
              content={content}
              getToolResult={getToolResult}
            />
          </li>
        ))}
      </ul>
    );
  }

  return null;
};
