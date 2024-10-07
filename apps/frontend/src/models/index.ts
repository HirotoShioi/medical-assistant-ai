import {
  schema,
  insertResourceSchema,
  insertMessageSchema,
  insertThreadSettingsSchema,
} from "@/lib/database/schema";
import { z } from "zod";
import type { Template } from "./template";

type Thread = typeof schema.threads.$inferSelect;
type Embedding = typeof schema.embeddings.$inferSelect;
type Message = typeof schema.messages.$inferSelect;
type NewResourceParams = z.infer<typeof insertResourceSchema>;
type Resource = typeof schema.resources.$inferSelect;
type DatabaseTemplate = typeof schema.templates.$inferSelect;
type NewMessageParams = z.infer<typeof insertMessageSchema>;
type ThreadSettings = typeof schema.threadSettings.$inferSelect;
type NewThreadSettingsParams = z.infer<typeof insertThreadSettingsSchema>;
type UserPreferences = typeof schema.userPreferences.$inferSelect;
export type {
  NewMessageParams,
  NewResourceParams,
  Resource,
  Message,
  Thread,
  Embedding,
  DatabaseTemplate,
  Template,
  ThreadSettings,
  NewThreadSettingsParams,
  UserPreferences,
};
