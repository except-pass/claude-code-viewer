"use client";

import { ArrowLeftIcon } from "lucide-react";
import Link from "next/link";
import { FolderIcon, MessageSquareIcon } from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";

import { useProject } from "../hooks/useProject";
import { pagesPath } from "../../../../lib/$path";
import { parseCommandXml } from "../../../../server/service/parseCommandXml";

export const ProjectPageContent = ({ projectId }: { projectId: string }) => {
  const {
    data: { project, sessions },
  } = useProject(projectId);

  return (
    <div className="container mx-auto px-4 py-8">
      <header className="mb-8">
        <Button asChild variant="ghost" className="mb-4">
          <Link
            href={pagesPath.projects.$url().pathname}
            className="flex items-center gap-2"
          >
            <ArrowLeftIcon className="w-4 h-4" />
            Back to Projects
          </Link>
        </Button>

        <div className="flex items-center gap-3 mb-2">
          <FolderIcon className="w-6 h-6" />
          <h1 className="text-3xl font-bold">
            {project.meta.projectName ?? "unknown"}
          </h1>
        </div>
        <p className="text-muted-foreground font-mono text-sm">
          Workspace: {project.meta.projectPath ?? "unknown"}
        </p>
        <p className="text-muted-foreground font-mono text-sm">
          Claude History: {project.claudeProjectPath ?? "unknown"}
        </p>
      </header>

      <main>
        <section>
          <h2 className="text-xl font-semibold mb-4">
            Conversation Sessions{" "}
            {project.meta.sessionCount ? `(${project.meta.sessionCount})` : ""}
          </h2>

          {sessions.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <MessageSquareIcon className="w-12 h-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No sessions found</h3>
                <p className="text-muted-foreground text-center max-w-md">
                  No conversation sessions found for this project. Start a
                  conversation with Claude Code in this project to create
                  sessions.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-1 lg:grid-cols-1">
              {sessions.map((session) => (
                <Card
                  key={session.id}
                  className="hover:shadow-md transition-shadow"
                >
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <span className="break-all overflow-ellipsis line-clamp-2 text-xl">
                        {session.meta.firstContent
                          ? (() => {
                              const parsed = parseCommandXml(
                                session.meta.firstContent
                              );
                              if (parsed.kind === "command") {
                                return (
                                  <span>
                                    {parsed.commandName} {parsed.commandArgs}
                                  </span>
                                );
                              }
                              if (parsed.kind === "local-command-1") {
                                return (
                                  <span>
                                    {parsed.commandName} {parsed.commandMessage}
                                  </span>
                                );
                              }
                              if (parsed.kind === "local-command-2") {
                                return <span>{parsed.stdout}</span>;
                              }
                              return <span>{session.meta.firstContent}</span>;
                            })()
                          : ""}
                      </span>
                    </CardTitle>
                    <CardDescription className="font-mono text-xs">
                      {session.id}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <p className="text-sm text-muted-foreground">
                      {session.meta.messageCount} messages
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Last modified:{" "}
                      {session.meta.lastModifiedAt
                        ? new Date(
                            session.meta.lastModifiedAt
                          ).toLocaleDateString()
                        : ""}
                    </p>
                    <p className="text-xs text-muted-foreground font-mono">
                      {session.jsonlFilePath}
                    </p>
                  </CardContent>
                  <CardContent className="pt-0">
                    <Button asChild className="w-full">
                      <Link
                        href={`/projects/${projectId}/sessions/${encodeURIComponent(
                          session.id
                        )}`}
                      >
                        View Session
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
};
