import { z } from 'zod'
import { UserEntrySchema } from './entry/UserEntrySchema'
import { AssistantEntrySchema } from './entry/AssistantEntrySchema'
import { SummaryEntrySchema } from './entry/SummaryEntrySchema'
import { SystemEntrySchema } from './entry/SystemEntrySchema'

export const ConversationSchema = z.union([
  UserEntrySchema,
  AssistantEntrySchema,
  SummaryEntrySchema,
  SystemEntrySchema,
])

export type Conversation = z.infer<typeof ConversationSchema>
