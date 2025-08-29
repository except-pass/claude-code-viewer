import { z } from 'zod'
import { TextContentSchema } from './TextContentSchema'
import { ImageContentSchema } from './ImageContentSchema'

export const ToolResultContentSchema = z.object({
  type: z.literal('tool_result'),
  tool_use_id: z.string(),
  content: z.union([z.string(), z.array(z.union([
    TextContentSchema,
    ImageContentSchema
  ]))]),
  is_error: z.boolean().optional(),
}).strict()


export type ToolResultContent = z.infer<typeof ToolResultContentSchema>
