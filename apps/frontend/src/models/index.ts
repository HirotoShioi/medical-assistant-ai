import {
  schema,
  insertDocumentSchema,
  insertMessageSchema,
  insertThreadSettingsSchema,
} from "@/lib/database/schema";
import { z } from "zod";
import type { Template } from "./template";

type Thread = typeof schema.threads.$inferSelect;
type Embedding = typeof schema.embeddings.$inferSelect;
type Message = typeof schema.messages.$inferSelect;
type NewDocumentParams = z.infer<typeof insertDocumentSchema>;
type Document = typeof schema.documents.$inferSelect;
type DatabaseTemplate = typeof schema.templates.$inferSelect;
type NewMessageParams = z.infer<typeof insertMessageSchema>;
type ThreadSettings = typeof schema.threadSettings.$inferSelect;
type NewThreadSettingsParams = z.infer<typeof insertThreadSettingsSchema>;

export type {
  NewMessageParams,
  NewDocumentParams,
  Document,
  Message,
  Thread,
  Embedding,
  DatabaseTemplate,
  Template,
  ThreadSettings,
  NewThreadSettingsParams,
};
