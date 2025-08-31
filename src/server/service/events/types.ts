import type { WatchEventType } from "node:fs";

export type WatcherEvent =
  | {
      eventType: "project_changed";
      data: ProjectChangedData;
    }
  | {
      eventType: "session_changed";
      data: SessionChangedData;
    };

export type BaseSSEEvent = {
  id: string;
  timestamp: string;
};

export type SSEEvent = BaseSSEEvent &
  (
    | {
        type: "connected";
        message: string;
        timestamp: string;
      }
    | {
        type: "heartbeat";
        timestamp: string;
      }
    | {
        id: string;
        type: "project_changed";
        data: ProjectChangedData;
      }
    | {
        id: string;
        type: "session_changed";
        data: SessionChangedData;
      }
  );

export interface ProjectChangedData {
  projectId: string;
  fileEventType: WatchEventType;
}

export interface SessionChangedData {
  projectId: string;
  sessionId: string;
  fileEventType: WatchEventType;
}
