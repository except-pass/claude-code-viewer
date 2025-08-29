"use client";

import { ArrowLeftIcon, MessageSquareIcon } from "lucide-react";
import Link from "next/link";
import type { FC } from "react";
import { Button } from "@/components/ui/button";
import { firstCommandToTitle } from "../../../services/firstCommandToTitle";
import { useSession } from "../hooks/useSession";
import { ConversationList } from "./conversationList/ConversationList";

export const SessionPageContent: FC<{
  projectId: string;
  sessionId: string;
}> = ({ projectId, sessionId }) => {
  const { session, conversations, getToolResult } = useSession(
    projectId,
    sessionId,
  );

  return (
    <div className="container mx-auto px-4 py-8">
      <header className="mb-8">
        <Button asChild variant="ghost" className="mb-4">
          <Link
            href={`/projects/${projectId}`}
            className="flex items-center gap-2"
          >
            <ArrowLeftIcon className="w-4 h-4" />
            Back to Session List
          </Link>
        </Button>

        <div className="flex items-center gap-3 mb-2">
          <MessageSquareIcon className="w-6 h-6" />
          <h1 className="text-3xl font-bold">
            {session.meta.firstCommand !== null
              ? firstCommandToTitle(session.meta.firstCommand)
              : sessionId}
          </h1>
        </div>
        <p className="text-muted-foreground font-mono text-sm">
          Session ID: {sessionId}
        </p>
      </header>

      <main>
        <ConversationList
          conversations={conversations}
          getToolResult={getToolResult}
        />
      </main>
    </div>
  );
};
