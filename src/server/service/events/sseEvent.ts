import type { BaseSSEEvent, SSEEvent } from "./types";

let eventId = 0;

export const sseEvent = <D extends Omit<SSEEvent, "id" | "timestamp">>(
  data: D,
): string => {
  return JSON.stringify({
    ...data,
    id: String(eventId++),
    timestamp: new Date().toISOString(),
  } satisfies D & BaseSSEEvent);
};
