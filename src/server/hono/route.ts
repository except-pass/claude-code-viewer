import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import type { HonoAppType } from "./app";

const helloBodySchema = z.object({
  name: z.string(),
});

export const routes = (app: HonoAppType) => {
  return (
    app
      // routes
      .get("/hello", zValidator("json", helloBodySchema), (c) => {
        const { name } = c.req.valid("json");
        return c.json({ message: `Hello ${name}` });
      })
  );
};

export type RouteType = ReturnType<typeof routes>;
