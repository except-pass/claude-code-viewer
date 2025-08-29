import { hc } from "hono/client";
import type { RouteType } from "../../server/hono/route";

export const honoClient = hc<RouteType>("http://localhost:3400");
