import { spawn } from "node:child_process";
import { readdir } from "node:fs/promises";
import { homedir } from "node:os";
import { resolve } from "node:path";
import { zValidator } from "@hono/zod-validator";
import { setCookie } from "hono/cookie";
import { streamSSE } from "hono/streaming";
import { z } from "zod";
import { configSchema } from "../config/config";
import { ClaudeCodeTaskController } from "../service/claude-code/ClaudeCodeTaskController";
import type { SerializableAliveTask } from "../service/claude-code/types";
import { getEventBus } from "../service/events/EventBus";
import { getFileWatcher } from "../service/events/fileWatcher";
import { sseEventResponse } from "../service/events/sseEventResponse";
import { getFileCompletion } from "../service/file-completion/getFileCompletion";
import { getBranches } from "../service/git/getBranches";
import { getCommits } from "../service/git/getCommits";
import { commit } from "../service/git/commit";
import { getDiff } from "../service/git/getDiff";
import { getMcpList } from "../service/mcp/getMcpList";
import { getProject } from "../service/project/getProject";
import { getProjects } from "../service/project/getProjects";
import { getSession } from "../service/session/getSession";
import { getSessionCwd } from "../service/session/getSessionCwd";
import { getSessions } from "../service/session/getSessions";
import type { HonoAppType } from "./app";
import { configMiddleware } from "./middleware/config.middleware";

export const routes = (app: HonoAppType) => {
  const taskController = new ClaudeCodeTaskController();

  return (
    app
      // middleware
      .use(configMiddleware)

      // routes
      .get("/config", async (c) => {
        return c.json({
          config: c.get("config"),
        });
      })

      .put("/config", zValidator("json", configSchema), async (c) => {
        const { ...config } = c.req.valid("json");

        setCookie(c, "ccv-config", JSON.stringify(config));

        return c.json({
          config,
        });
      })

      .get("/projects", async (c) => {
        const { projects } = await getProjects();
        return c.json({ projects });
      })

      .get("/projects/:projectId", async (c) => {
        const { projectId } = c.req.param();

        const [{ project }, { sessions }] = await Promise.all([
          getProject(projectId),
          getSessions(projectId).then(({ sessions }) => {
            let filteredSessions = sessions;

            // Filter sessions based on hideNoUserMessageSession setting
            if (c.get("config").hideNoUserMessageSession) {
              filteredSessions = filteredSessions.filter((session) => {
                return session.meta.firstCommand !== null;
              });
            }

            // Unify sessions with same title if unifySameTitleSession is enabled
            if (c.get("config").unifySameTitleSession) {
              const sessionMap = new Map<
                string,
                (typeof filteredSessions)[0]
              >();

              for (const session of filteredSessions) {
                // Generate title for comparison
                const title =
                  session.meta.firstCommand !== null
                    ? (() => {
                        const cmd = session.meta.firstCommand;
                        switch (cmd.kind) {
                          case "command":
                            return cmd.commandArgs === undefined
                              ? cmd.commandName
                              : `${cmd.commandName} ${cmd.commandArgs}`;
                          case "local-command":
                            return cmd.stdout;
                          case "text":
                            return cmd.content;
                          default:
                            return session.id;
                        }
                      })()
                    : session.id;

                const existingSession = sessionMap.get(title);
                if (existingSession) {
                  // Keep the session with the latest modification date
                  if (
                    session.meta.lastModifiedAt &&
                    existingSession.meta.lastModifiedAt
                  ) {
                    if (
                      new Date(session.meta.lastModifiedAt) >
                      new Date(existingSession.meta.lastModifiedAt)
                    ) {
                      sessionMap.set(title, session);
                    }
                  } else if (
                    session.meta.lastModifiedAt &&
                    !existingSession.meta.lastModifiedAt
                  ) {
                    sessionMap.set(title, session);
                  }
                  // If no modification dates, keep the existing one
                } else {
                  sessionMap.set(title, session);
                }
              }

              filteredSessions = Array.from(sessionMap.values());
            }

            return {
              sessions: filteredSessions,
            };
          }),
        ] as const);

        return c.json({ project, sessions });
      })

      .get("/projects/:projectId/sessions/:sessionId", async (c) => {
        const { projectId, sessionId } = c.req.param();
        const { session } = await getSession(projectId, sessionId);
        return c.json({ session });
      })

      .get(
        "/projects/:projectId/file-completion",
        zValidator(
          "query",
          z.object({
            basePath: z.string().optional().default("/"),
          }),
        ),
        async (c) => {
          const { projectId } = c.req.param();
          const { basePath } = c.req.valid("query");

          const { project } = await getProject(projectId);

          if (project.meta.projectPath === null) {
            return c.json({ error: "Project path not found" }, 400);
          }

          try {
            const result = await getFileCompletion(
              project.meta.projectPath,
              basePath,
            );
            return c.json(result);
          } catch (error) {
            console.error("File completion error:", error);
            return c.json({ error: "Failed to get file completion" }, 500);
          }
        },
      )

      .get("/projects/:projectId/claude-commands", async (c) => {
        const { projectId } = c.req.param();
        const { project } = await getProject(projectId);

        const [globalCommands, projectCommands] = await Promise.allSettled([
          readdir(resolve(homedir(), ".claude", "commands"), {
            withFileTypes: true,
          }).then((dirents) =>
            dirents
              .filter((d) => d.isFile() && d.name.endsWith(".md"))
              .map((d) => d.name.replace(/\.md$/, "")),
          ),
          project.meta.projectPath !== null
            ? readdir(
                resolve(project.meta.projectPath, ".claude", "commands"),
                {
                  withFileTypes: true,
                },
              ).then((dirents) =>
                dirents
                  .filter((d) => d.isFile() && d.name.endsWith(".md"))
                  .map((d) => d.name.replace(/\.md$/, "")),
              )
            : [],
        ]);

        return c.json({
          globalCommands:
            globalCommands.status === "fulfilled" ? globalCommands.value : [],
          projectCommands:
            projectCommands.status === "fulfilled" ? projectCommands.value : [],
          defaultCommands: ["init", "compact"],
        });
      })

      .get("/projects/:projectId/git/branches", async (c) => {
        const { projectId } = c.req.param();
        const { project } = await getProject(projectId);

        if (project.meta.projectPath === null) {
          return c.json({ error: "Project path not found" }, 400);
        }

        try {
          const result = await getBranches(project.meta.projectPath);
          return c.json(result);
        } catch (error) {
          console.error("Get branches error:", error);
          if (error instanceof Error) {
            return c.json({ error: error.message }, 400);
          }
          return c.json({ error: "Failed to get branches" }, 500);
        }
      })

      .get("/projects/:projectId/git/commits", async (c) => {
        const { projectId } = c.req.param();
        const { project } = await getProject(projectId);

        if (project.meta.projectPath === null) {
          return c.json({ error: "Project path not found" }, 400);
        }

        try {
          const result = await getCommits(project.meta.projectPath);
          return c.json(result);
        } catch (error) {
          console.error("Get commits error:", error);
          if (error instanceof Error) {
            return c.json({ error: error.message }, 400);
          }
          return c.json({ error: "Failed to get commits" }, 500);
        }
      })

      .post(
        "/projects/:projectId/git/diff",
        zValidator(
          "json",
          z.object({
            fromRef: z.string().min(1, "fromRef is required"),
            toRef: z.string().min(1, "toRef is required"),
          }),
        ),
        async (c) => {
          const { projectId } = c.req.param();
          const { fromRef, toRef } = c.req.valid("json");
          const { project } = await getProject(projectId);

          if (project.meta.projectPath === null) {
            return c.json({ error: "Project path not found" }, 400);
          }

          try {
            const result = await getDiff(
              project.meta.projectPath,
              fromRef,
              toRef,
            );
            return c.json(result);
          } catch (error) {
            console.error("Get diff error:", error);
            if (error instanceof Error) {
              return c.json({ error: error.message }, 400);
            }
            return c.json({ error: "Failed to get diff" }, 500);
          }
        },
      )

      .post(
        "/projects/:projectId/git/commit",
        zValidator(
          "json",
          z.object({
            message: z.string().min(1, "Commit message is required"),
            allChanges: z.boolean().optional().default(false),
            amend: z.boolean().optional().default(false),
          }),
        ),
        async (c) => {
          const { projectId } = c.req.param();
          const { message, allChanges, amend } = c.req.valid("json");
          const { project } = await getProject(projectId);

          if (project.meta.projectPath === null) {
            return c.json({ error: "Project path not found" }, 400);
          }

          try {
            const result = await commit(project.meta.projectPath, {
              message,
              allChanges,
              amend,
            });
            return c.json(result);
          } catch (error) {
            console.error("Git commit error:", error);
            if (error instanceof Error) {
              return c.json({ error: error.message }, 400);
            }
            return c.json({ error: "Failed to commit" }, 500);
          }
        },
      )

      // Session-aware git routes
      .get(
        "/projects/:projectId/sessions/:sessionId/git/branches",
        async (c) => {
          const { projectId, sessionId } = c.req.param();

          try {
            const sessionCwd = await getSessionCwd(projectId, sessionId);
            const result = await getBranches(sessionCwd);
            return c.json(result);
          } catch (error) {
            console.error("Get session branches error:", error);
            if (error instanceof Error) {
              return c.json({ error: error.message }, 400);
            }
            return c.json({ error: "Failed to get session branches" }, 500);
          }
        },
      )

      .get(
        "/projects/:projectId/sessions/:sessionId/git/commits",
        async (c) => {
          const { projectId, sessionId } = c.req.param();

          try {
            const sessionCwd = await getSessionCwd(projectId, sessionId);
            const result = await getCommits(sessionCwd);
            return c.json(result);
          } catch (error) {
            console.error("Get session commits error:", error);
            if (error instanceof Error) {
              return c.json({ error: error.message }, 400);
            }
            return c.json({ error: "Failed to get session commits" }, 500);
          }
        },
      )

      .post(
        "/projects/:projectId/sessions/:sessionId/git/diff",
        zValidator(
          "json",
          z.object({
            fromRef: z.string().min(1, "fromRef is required"),
            toRef: z.string().min(1, "toRef is required"),
          }),
        ),
        async (c) => {
          const { projectId, sessionId } = c.req.param();
          const { fromRef, toRef } = c.req.valid("json");

          try {
            const sessionCwd = await getSessionCwd(projectId, sessionId);
            const result = await getDiff(sessionCwd, fromRef, toRef);
            return c.json(result);
          } catch (error) {
            console.error("Get session diff error:", error);
            if (error instanceof Error) {
              return c.json({ error: error.message }, 400);
            }
            return c.json({ error: "Failed to get session diff" }, 500);
          }
        },
      )

      .post(
        "/projects/:projectId/sessions/:sessionId/git/commit",
        zValidator(
          "json",
          z.object({
            message: z.string().min(1, "Commit message is required"),
            allChanges: z.boolean().optional().default(false),
            amend: z.boolean().optional().default(false),
          }),
        ),
        async (c) => {
          const { projectId, sessionId } = c.req.param();
          const { message, allChanges, amend } = c.req.valid("json");

          try {
            const sessionCwd = await getSessionCwd(projectId, sessionId);
            const result = await commit(sessionCwd, {
              message,
              allChanges,
              amend,
            });
            return c.json(result);
          } catch (error) {
            console.error("Git session commit error:", error);
            if (error instanceof Error) {
              return c.json({ error: error.message }, 400);
            }
            return c.json({ error: "Failed to commit" }, 500);
          }
        },
      )

      .get("/mcp/list", async (c) => {
        const { servers } = await getMcpList();
        return c.json({ servers });
      })

      .post(
        "/projects/:projectId/new-session",
        zValidator(
          "json",
          z.object({
            message: z.string(),
            createWorktree: z.boolean().optional().default(false),
          }),
        ),
        async (c) => {
          const { projectId } = c.req.param();
          const { message, createWorktree } = c.req.valid("json");
          const { project } = await getProject(projectId);
          const config = c.get("config");

          if (project.meta.projectPath === null) {
            return c.json({ error: "Project path not found" }, 400);
          }

          let cwd = project.meta.projectPath;

          if (createWorktree) {
            try {
              // Import worktree management functions
              const { createWorktree: createWorktreeFunc, isGitRepository } =
                await import("../service/worktree/management");

              // Check if project is a git repository
              if (!(await isGitRepository(project.meta.projectPath))) {
                return c.json(
                  { error: "Project is not a git repository" },
                  400,
                );
              }

              // Create worktree
              cwd = await createWorktreeFunc(
                project.meta.projectPath,
                project.claudeProjectPath,
                config.worktreesPath,
              );
            } catch (error) {
              console.error("Failed to create worktree:", error);
              return c.json(
                {
                  error: `Failed to create worktree: ${error instanceof Error ? error.message : String(error)}`,
                },
                500,
              );
            }
          }

          try {
            const task = await taskController.startOrContinueTask(
              {
                projectId,
                cwd,
              },
              message,
            );

            return c.json({
              taskId: task.id,
              sessionId: task.sessionId,
              userMessageId: task.userMessageId,
              worktreePath: createWorktree ? cwd : undefined,
            });
          } catch (error) {
            console.error("Failed to start new session:", error);
            return c.json(
              {
                error:
                  error instanceof Error
                    ? error.message
                    : "Failed to start session",
              },
              500,
            );
          }
        },
      )

      .post(
        "/projects/:projectId/sessions/:sessionId/resume",
        zValidator(
          "json",
          z.object({
            resumeMessage: z.string(),
          }),
        ),
        async (c) => {
          const { projectId, sessionId } = c.req.param();
          const { resumeMessage } = c.req.valid("json");
          const { project } = await getProject(projectId);

          if (project.meta.projectPath === null) {
            return c.json({ error: "Project path not found" }, 400);
          }

          try {
            // Resolve the correct cwd for this session (handles worktree sessions)
            const sessionCwd = await getSessionCwd(projectId, sessionId);

            const task = await taskController.startOrContinueTask(
              {
                projectId,
                sessionId,
                cwd: sessionCwd,
              },
              resumeMessage,
            );

            return c.json({
              taskId: task.id,
              sessionId: task.sessionId,
              userMessageId: task.userMessageId,
            });
          } catch (error) {
            console.error("Failed to resume session:", error);
            return c.json(
              {
                error:
                  error instanceof Error
                    ? error.message
                    : "Failed to resume session",
              },
              500,
            );
          }
        },
      )

      .get("/tasks/alive", async (c) => {
        return c.json({
          aliveTasks: taskController.aliveTasks.map(
            (task): SerializableAliveTask => ({
              id: task.id,
              status: task.status,
              sessionId: task.sessionId,
              userMessageId: task.userMessageId,
            }),
          ),
        });
      })

      .post(
        "/tasks/abort",
        zValidator("json", z.object({ sessionId: z.string() })),
        async (c) => {
          const { sessionId } = c.req.valid("json");
          const aborted = taskController.abortTask(sessionId);
          return c.json({
            message: aborted
              ? "Task aborted"
              : "No alive task for given session; nothing to abort",
          });
        },
      )

      .post(
        "/cursor-open",
        zValidator("json", z.object({ filePath: z.string() })),
        async (c) => {
          const { filePath } = c.req.valid("json");

          try {
            return new Promise((resolve, reject) => {
              const childProcess = spawn("cursor", ["-a", filePath], {
                stdio: "ignore",
                detached: true,
              });

              childProcess.on("error", (error) => {
                console.error("Failed to start cursor:", error);
                reject(c.json({ error: "Failed to start cursor" }, 500));
              });

              childProcess.on("spawn", () => {
                // Process started successfully, unref so it doesn't keep the parent alive
                childProcess.unref();
                resolve(c.json({ message: "File opened in cursor" }));
              });

              // Timeout after 5 seconds
              setTimeout(() => {
                if (!childProcess.killed) {
                  childProcess.kill();
                  reject(c.json({ error: "Cursor command timed out" }, 500));
                }
              }, 5000);
            });
          } catch (error) {
            console.error("Error executing cursor command:", error);
            return c.json({ error: "Failed to execute cursor command" }, 500);
          }
        },
      )

      .get("/events/state_changes", async (c) => {
        return streamSSE(
          c,
          async (stream) => {
            const fileWatcher = getFileWatcher();
            const eventBus = getEventBus();

            let isConnected = true;

            // ハートビート設定
            const heartbeat = setInterval(() => {
              if (isConnected) {
                eventBus.emit("heartbeat", {
                  type: "heartbeat",
                });
              }
            }, 30 * 1000);

            // connection handling
            const abortController = new AbortController();
            let connectionResolve: ((value: undefined) => void) | undefined;
            const connectionPromise = new Promise<undefined>((resolve) => {
              connectionResolve = resolve;
            });

            const onConnectionClosed = () => {
              isConnected = false;
              connectionResolve?.(undefined);
              abortController.abort();
              clearInterval(heartbeat);
            };

            // 接続終了時のクリーンアップ
            stream.onAbort(() => {
              console.log("SSE connection aborted");
              onConnectionClosed();
            });

            // イベントリスナーを登録
            console.log("Registering SSE event listeners");
            eventBus.on("connected", async (event) => {
              if (!isConnected) {
                return;
              }
              await stream.writeSSE(sseEventResponse(event)).catch(() => {
                onConnectionClosed();
              });
            });

            eventBus.on("heartbeat", async (event) => {
              if (!isConnected) {
                return;
              }
              await stream.writeSSE(sseEventResponse(event)).catch(() => {
                onConnectionClosed();
              });
            });

            eventBus.on("project_changed", async (event) => {
              if (!isConnected) {
                return;
              }

              await stream.writeSSE(sseEventResponse(event)).catch(() => {
                console.warn("Failed to write SSE event");
                onConnectionClosed();
              });
            });

            eventBus.on("session_changed", async (event) => {
              if (!isConnected) {
                return;
              }

              await stream.writeSSE(sseEventResponse(event)).catch(() => {
                onConnectionClosed();
              });
            });

            eventBus.on("task_changed", async (event) => {
              if (!isConnected) {
                return;
              }

              await stream.writeSSE(sseEventResponse(event)).catch(() => {
                onConnectionClosed();
              });
            });

            // 初期接続確認メッセージ
            eventBus.emit("connected", {
              type: "connected",
              message: "SSE connection established",
            });

            fileWatcher.startWatching();

            await connectionPromise;
          },
          async (err, stream) => {
            console.error("Streaming error:", err);
            await stream.write("エラーが発生しました。");
          },
        );
      })
  );
};

export type RouteType = ReturnType<typeof routes>;
