import Link from "next/link";
import { ArrowLeftIcon, MessageSquareIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Metadata } from "next";
import { ConversationList } from "./components/conversationList/ConversationList";

type PageParams = {
  projectId: string;
  sessionId: string;
};

export async function generateMetadata({
  params,
}: {
  params: Promise<PageParams>;
}): Promise<Metadata> {
  const { projectId, sessionId } = await params;
  return {
    title: `Session: ${sessionId.slice(0, 8)}...`,
    description: `View conversation session ${projectId}/${sessionId}`,
  };
}

interface SessionPageProps {
  params: Promise<PageParams>;
}

export default async function SessionPage({ params }: SessionPageProps) {
  const { projectId, sessionId } = await params;

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
          <h1 className="text-3xl font-bold">Conversation Session</h1>
        </div>
        <p className="text-muted-foreground font-mono text-sm">
          Session ID: {sessionId}
        </p>
      </header>

      <main>
        <ConversationList projectId={projectId} sessionId={sessionId} />
      </main>
    </div>
  );
}
