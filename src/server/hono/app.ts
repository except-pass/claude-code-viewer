import { Hono } from "hono";

// biome-ignore lint/complexity/noBannedTypes: add after
export type HonoContext = {};

export const honoApp = new Hono<HonoContext>().basePath("/api");

export type HonoAppType = typeof honoApp;
