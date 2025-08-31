import { streamSSE } from "hono/streaming";
import { getFileWatcher } from "../service/events/fileWatcher";
import { sseEvent } from "../service/events/sseEvent";
import type { WatcherEvent } from "../service/events/types";
import { getProject } from "../service/project/getProject";
import { getProjects } from "../service/project/getProjects";
import { getSession } from "../service/session/getSession";
import { getSessions } from "../service/session/getSessions";
import type { HonoAppType } from "./app";

export const routes = (app: HonoAppType) => {
  return app
    .get("/projects", async (c) => {
      const { projects } = await getProjects();
      return c.json({ projects });
    })

    .get("/projects/:projectId", async (c) => {
      const { projectId } = c.req.param();

      const [{ project }, { sessions }] = await Promise.all([
        getProject(projectId),
        getSessions(projectId),
      ] as const);

      return c.json({ project, sessions });
    })

    .get("/projects/:projectId/sessions/:sessionId", async (c) => {
      const { projectId, sessionId } = c.req.param();
      const { session } = await getSession(projectId, sessionId);
      return c.json({ session });
    })

    .get("/events/state_changes", async (c) => {
      return streamSSE(
        c,
        async (stream) => {
          const fileWatcher = getFileWatcher();
          let isConnected = true;
          let eventId = 0;

          // ハートビート設定
          const heartbeat = setInterval(() => {
            if (isConnected) {
              stream
                .writeSSE({
                  data: sseEvent({
                    type: "heartbeat",
                    timestamp: new Date().toISOString(),
                  }),
                  event: "heartbeat",
                  id: String(eventId++),
                })
                .catch(() => {
                  console.warn("Failed to write SSE event");
                  isConnected = false;
                  onConnectionClosed();
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
          fileWatcher.on("project_changed", async (event: WatcherEvent) => {
            if (!isConnected) {
              return;
            }

            if (event.eventType !== "project_changed") {
              return;
            }

            await stream
              .writeSSE({
                data: sseEvent({
                  type: event.eventType,
                  ...event.data,
                }),
                event: event.eventType,
                id: String(eventId++),
              })
              .catch(() => {
                console.warn("Failed to write SSE event");
                onConnectionClosed();
              });
          });
          fileWatcher.on("session_changed", async (event: WatcherEvent) => {
            if (!isConnected) {
              return;
            }

            await stream
              .writeSSE({
                data: sseEvent({
                  ...event.data,
                  type: event.eventType,
                }),
                event: event.eventType,
                id: String(eventId++),
              })
              .catch(() => {
                onConnectionClosed();
              });
          });

          // 初期接続確認メッセージ
          await stream.writeSSE({
            data: sseEvent({
              type: "connected",
              message: "SSE connection established",
              timestamp: new Date().toISOString(),
            }),
            event: "connected",
            id: String(eventId++),
          });

          await connectionPromise;
        },
        async (err, stream) => {
          console.error("Streaming error:", err);
          await stream.write("エラーが発生しました。");
        },
      );
    });
};

export type RouteType = ReturnType<typeof routes>;
