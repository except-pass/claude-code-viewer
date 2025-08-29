import { z } from "zod";
import { TodoToolResultSchema } from "./TodoSchema";
import { CommonToolResultSchema } from "./CommonToolSchema";

export const ToolUseResultSchema = z.union([
  z.string(),
  TodoToolResultSchema,
  CommonToolResultSchema,
]);
