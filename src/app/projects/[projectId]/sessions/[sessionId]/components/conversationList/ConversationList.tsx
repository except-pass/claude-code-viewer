"use client";

import { AlertTriangle, ChevronRight, ExternalLink } from "lucide-react";
import { type FC, useMemo } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import type { Conversation } from "@/lib/conversation-schema";
import type { ToolResultContent } from "@/lib/conversation-schema/content/ToolResultContentSchema";
import type { ErrorJsonl } from "../../../../../../../server/service/types";
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

const SchemaErrorDisplay: FC<{ errorLine: string }> = ({ errorLine }) => {
  return (
    <li className="w-full flex justify-start">
      <div className="w-full max-w-3xl lg:max-w-4xl sm:w-[90%] md:w-[85%] px-2">
        <Collapsible>
          <CollapsibleTrigger asChild>
            <div className="flex items-center justify-between cursor-pointer hover:bg-muted/50 rounded p-2 -mx-2 border-l-2 border-red-400">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-3 w-3 text-red-500" />
                <span className="text-xs font-medium text-red-600">
                  Schema Error
                </span>
              </div>
              <ChevronRight className="h-3 w-3 text-muted-foreground transition-transform group-data-[state=open]:rotate-90" />
            </div>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="bg-background rounded border border-red-200 p-3 mt-2">
              <div className="space-y-3">
                <Alert
                  variant="destructive"
                  className="border-red-200 bg-red-50"
                >
                  <AlertTriangle className="h-4 w-4" />
                  <AlertTitle className="text-red-800">
                    Schema Validation Error
                  </AlertTitle>
                  <AlertDescription className="text-red-700">
                    This conversation entry failed to parse correctly. This
                    might indicate a format change or parsing issue.{" "}
                    <a
                      href="https://github.com/d-kimuson/claude-code-viewer/issues"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-red-600 hover:text-red-800 underline underline-offset-4"
                    >
                      Report this issue
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </AlertDescription>
                </Alert>
                <div className="bg-gray-50 border rounded px-3 py-2">
                  <h5 className="text-xs font-medium text-gray-700 mb-2">
                    Raw Content:
                  </h5>
                  <pre className="text-xs overflow-x-auto whitespace-pre-wrap break-all font-mono text-gray-800">
                    {errorLine}
                  </pre>
                </div>
              </div>
            </div>
          </CollapsibleContent>
        </Collapsible>
      </div>
    </li>
  );
};

type ConversationListProps = {
  conversations: (Conversation | ErrorJsonl)[];
  getToolResult: (toolUseId: string) => ToolResultContent | undefined;
};

export const ConversationList: FC<ConversationListProps> = ({
  conversations,
  getToolResult,
}) => {
  const validConversations = useMemo(
    () =>
      conversations.filter((conversation) => conversation.type !== "x-error"),
    [conversations],
  );
  const { isRootSidechain, getSidechainConversations } =
    useSidechain(validConversations);

  // Group conversations: each user message followed by all responses until the next user message
  // This ensures only one "Full output" section per user prompt
  const groupedConversations = useMemo(() => {
    const groups: (Conversation | ErrorJsonl | { type: 'assistant-group', conversations: Conversation[] })[] = [];
    let currentAssistantGroup: Conversation[] = [];
    let hasSeenUserMessage = false;

    for (const conversation of conversations) {
      if (conversation.type === "x-error") {
        // Flush any pending assistant group only if we have content
        if (currentAssistantGroup.length > 0 && hasSeenUserMessage) {
          groups.push({ type: 'assistant-group', conversations: [...currentAssistantGroup] });
          currentAssistantGroup = [];
          hasSeenUserMessage = false;
        }
        groups.push(conversation);
      } else if (conversation.type === "user") {
        // User message always flushes assistant group if we have responses
        if (currentAssistantGroup.length > 0 && hasSeenUserMessage) {
          groups.push({ type: 'assistant-group', conversations: [...currentAssistantGroup] });
          currentAssistantGroup = [];
        }
        groups.push(conversation);
        hasSeenUserMessage = true;
      } else {
        // Everything else (assistant, system, summary) goes into the assistant group
        // Only create groups if we've seen a user message first
        if (hasSeenUserMessage) {
          currentAssistantGroup.push(conversation);
        } else {
          // If no user message yet, treat as individual conversation
          groups.push(conversation);
        }
      }
    }

    // Flush final assistant group if any and we have seen a user message
    if (currentAssistantGroup.length > 0 && hasSeenUserMessage) {
      groups.push({ type: 'assistant-group', conversations: [...currentAssistantGroup] });
    }

    return groups;
  }, [conversations]);

  // Identify the last assistant-group index to expand it by default
  const lastAssistantGroupIndex = useMemo(() => {
    for (let i = groupedConversations.length - 1; i >= 0; i--) {
      const g = groupedConversations[i] as any;
      if (g && g.type === "assistant-group") return i;
    }
    return -1;
  }, [groupedConversations]);

  return (
    <ul>
      {groupedConversations.flatMap((group, groupIndex) => {
        if (group.type === "x-error") {
          return (
            <SchemaErrorDisplay
              key={`error_${group.line}`}
              errorLine={group.line}
            />
          );
        }

        if (group.type === "assistant-group") {
          // Extract tool names from all conversations in the group
          const toolNames = new Set<string>();
          let shouldExpand = false;
          group.conversations.forEach(conversation => {
            if (conversation.type === "assistant") {
              conversation.message.content.forEach(content => {
                if (content.type === "tool_use") {
                  toolNames.add(content.name);
                  // Auto-expand the Response group if this is an edit-related tool
                  if (content.name === "Edit" || content.name === "MultiEdit") {
                    shouldExpand = true;
                  }
                }
              });
            }
          });
          // If this is the last assistant-group in the list, expand it by default
          const isLastAssistantGroup = groupIndex === lastAssistantGroupIndex;
          
          const toolNamesText = toolNames.size > 0 ? ` (${Array.from(toolNames).join(", ")})` : "";
          
          // Render grouped assistant messages in a collapsible
          const assistantContent = (
            <ul className="w-full">
              {group.conversations.map((conversation) => (
                <li key={getConversationKey(conversation)}>
                  <ConversationItem
                    conversation={conversation}
                    getToolResult={getToolResult}
                    isRootSidechain={isRootSidechain}
                    getSidechainConversations={getSidechainConversations}
                  />
                </li>
              ))}
            </ul>
          );

          return (
            <li className="w-full flex justify-start" key={`assistant-group-${groupIndex}`}>
              <div className="w-full max-w-3xl lg:max-w-4xl sm:w-[90%] md:w-[85%]">
                <Collapsible defaultOpen={shouldExpand || isLastAssistantGroup}>
                  <CollapsibleTrigger asChild>
                    <div className="flex items-center justify-between cursor-pointer hover:bg-muted/50 rounded p-2 -mx-2 mb-2">
                      <h4 className="text-sm font-medium text-muted-foreground">
                        Response{toolNamesText}
                      </h4>
                      <ChevronRight className="h-4 w-4 text-muted-foreground transition-transform group-data-[state=open]:rotate-90" />
                    </div>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <div className="bg-background rounded border p-3 mt-2">
                      {assistantContent}
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              </div>
            </li>
          );
        }

        // Handle individual non-assistant conversations
        const conversation = group as Conversation;
        const elm = (
          <ConversationItem
            key={getConversationKey(conversation)}
            conversation={conversation}
            getToolResult={getToolResult}
            isRootSidechain={isRootSidechain}
            getSidechainConversations={getSidechainConversations}
          />
        );

        const isSidechain =
          conversation.type !== "summary" && conversation.isSidechain;

        return [
          <li
            className={`w-full flex ${
              isSidechain ||
              conversation.type === "assistant" ||
              conversation.type === "system" ||
              conversation.type === "summary"
                ? "justify-start"
                : "justify-end"
            }`}
            key={getConversationKey(conversation)}
          >
            <div className="w-full max-w-3xl lg:max-w-4xl sm:w-[90%] md:w-[85%]">
              {elm}
            </div>
          </li>,
        ];
      })}
    </ul>
  );
};
