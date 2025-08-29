import { z } from 'zod'
import { ToolResultContentSchema } from '../content/ToolResultContentSchema'
import { TextContentSchema } from '../content/TextContentSchema'
import { ImageContentSchema } from '../content/ImageContentSchema'


const UserMessageContentSchema = z.union([
  z.string(),
  TextContentSchema,
  ToolResultContentSchema,
  ImageContentSchema
])

export type UserMessageContent = z.infer<typeof UserMessageContentSchema>

export const UserMessageSchema = z.object({
  role: z.literal('user'),
  content: z.union([
    z.string(),
    z.array(z.union([
      z.string(),
      UserMessageContentSchema
    ]))
  ]),
}).strict()
