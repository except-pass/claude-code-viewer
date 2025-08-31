import { EventEmitter } from "node:events";
import { type FSWatcher, watch } from "node:fs";
import z from "zod";
import { claudeProjectPath } from "../paths";
import type { WatcherEvent } from "./types";

const fileRegExp = /(?<projectId>.*?)\/(?<sessionId>.*?)\.jsonl/;
const fileRegExpGroupSchema = z.object({
  projectId: z.string(),
  sessionId: z.string(),
});

export class FileWatcherService extends EventEmitter {
  private watcher: FSWatcher | null = null;
  private projectWatchers: Map<string, FSWatcher> = new Map();

  constructor() {
    super();
    this.startWatching();
  }

  private startWatching(): void {
    try {
      console.log("Starting file watcher on:", claudeProjectPath);
      // メインプロジェクトディレクトリを監視
      this.watcher = watch(
        claudeProjectPath,
        { persistent: false, recursive: true },
        (eventType, filename) => {
          if (!filename) return;

          const groups = fileRegExpGroupSchema.safeParse(
            filename.match(fileRegExp)?.groups,
          );

          if (!groups.success) return;

          const { projectId, sessionId } = groups.data;

          this.emit("project_changed", {
            eventType: "project_changed",
            data: { projectId, fileEventType: eventType },
          } satisfies WatcherEvent);

          this.emit("session_changed", {
            eventType: "session_changed",
            data: {
              projectId,
              sessionId,
              fileEventType: eventType,
            },
          } satisfies WatcherEvent);
        },
      );
      console.log("File watcher initialization completed");
    } catch (error) {
      console.error("Failed to start file watching:", error);
    }
  }

  public stop(): void {
    if (this.watcher) {
      this.watcher.close();
      this.watcher = null;
    }

    for (const [, watcher] of this.projectWatchers) {
      watcher.close();
    }
    this.projectWatchers.clear();
  }
}

// シングルトンインスタンス
let watcherInstance: FileWatcherService | null = null;

export const getFileWatcher = (): FileWatcherService => {
  if (!watcherInstance) {
    console.log("Creating new FileWatcher instance");
    watcherInstance = new FileWatcherService();
  }
  return watcherInstance;
};
