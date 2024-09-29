import { nanoid } from "@/lib/utils";
import { EMBEDDING_DIMENSIONS, MAX_VARCHAR_LENGTH } from "@/constants";
import {
  index,
  jsonb,
  pgTable,
  text,
  timestamp,
  varchar,
  vector,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";

const resources = pgTable("resources", {
  id: varchar("id", { length: MAX_VARCHAR_LENGTH })
    .primaryKey()
    .$defaultFn(() => nanoid()),
  title: text("title").notNull(),
  content: text("content").notNull(),
  fileType: varchar("file_type").notNull(),
  threadId: varchar("thread_id", { length: MAX_VARCHAR_LENGTH })
    .notNull()
    .references(() => threads.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at")
    .notNull()
    .default(sql`now()`),
  updatedAt: timestamp("updated_at")
    .notNull()
    .default(sql`now()`),
});

// Schema for resources - used to validate API requests
const insertResourceSchema = createSelectSchema(resources).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

const embeddings = pgTable(
  "embeddings",
  {
    id: varchar("id", { length: MAX_VARCHAR_LENGTH })
      .primaryKey()
      .$defaultFn(() => nanoid()),
    resourceId: varchar("resource_id", {
      length: MAX_VARCHAR_LENGTH,
    }).references(() => resources.id, { onDelete: "cascade" }),
    threadId: varchar("thread_id", { length: MAX_VARCHAR_LENGTH }).notNull(),
    content: text("content").notNull(),
    embedding: vector("embedding", {
      dimensions: EMBEDDING_DIMENSIONS,
    }).notNull(),
    createdAt: timestamp("created_at")
      .notNull()
      .default(sql`now()`),
    updatedAt: timestamp("updated_at")
      .notNull()
      .default(sql`now()`),
  },
  (table) => ({
    embeddingIndex: index("embeddingIndex").using(
      "hnsw",
      table.embedding.op("vector_cosine_ops")
    ),
  })
);

const messages = pgTable("messages", {
  id: varchar("id", { length: MAX_VARCHAR_LENGTH })
    .primaryKey()
    .$defaultFn(() => nanoid()),
  role: text("role", {
    enum: ["user", "assistant", "tool", "function", "system", "data"],
  }).notNull(),
  content: text("content").notNull(),
  threadId: varchar("thread_id", { length: MAX_VARCHAR_LENGTH })
    .notNull()
    .references(() => threads.id, { onDelete: "cascade" }),
  toolInvocations: jsonb("tool_invocations"),
  createdAt: timestamp("created_at")
    .default(sql`now()`)
    .notNull(),
});

const insertMessageSchema = createInsertSchema(messages).extend({}).omit({
  id: true,
  createdAt: true,
});

const threads = pgTable("threads", {
  id: varchar("id", { length: MAX_VARCHAR_LENGTH })
    .primaryKey()
    .$defaultFn(() => nanoid()),
  createdAt: timestamp("created_at")
    .default(sql`now()`)
    .notNull(),
  title: varchar("title").notNull(),
  updatedAt: timestamp("updated_at")
    .default(sql`now()`)
    .notNull(),
});

const templates = pgTable("templates", {
  id: varchar("id", { length: 191 }).primaryKey().notNull(),
  title: text("title").notNull(),
  overview: text("overview").notNull(),
  description: text("description").notNull(),
  systemMessage: text("system_message").notNull(),
  initialAssistantMessage: text("initial_assistant_message").notNull(),
  type: text("type", {
    enum: ["report", "summary", "consultation"],
  }).notNull(),
  reportGenerationPrompt: text("report_generation_prompt"), // reportタイプの場合に必要
  icon: varchar("icon", { length: 50 }).notNull(), // Lucideのアイコン名を格納するフィールド
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  originalTemplate: jsonb("original_template"),
});

const insertTemplateSchema = createInsertSchema(templates).extend({}).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

const threadSettings = pgTable("thread_settings", {
  id: varchar("id", { length: MAX_VARCHAR_LENGTH })
    .primaryKey()
    .$defaultFn(() => nanoid()),

  threadId: varchar("thread_id", { length: MAX_VARCHAR_LENGTH })
    .notNull()
    .references(() => threads.id, { onDelete: "cascade" }),

  templateId: varchar("template_id", { length: MAX_VARCHAR_LENGTH }).references(
    () => templates.id,
    { onDelete: "set null" }
  ),

  templateTitle: text("template_title").notNull(),

  templateOverview: text("template_overview").notNull(),

  systemMessage: text("system_message").notNull(),

  initialAssistantMessage: text("initial_assistant_message").notNull(),

  templateType: text("template_type", {
    enum: ["report", "summary", "consultation"],
  }).notNull(),

  reportGenerationPrompt: text("report_generation_prompt"),

  createdAt: timestamp("created_at")
    .default(sql`now()`)
    .notNull(),
  updatedAt: timestamp("updated_at")
    .default(sql`now()`)
    .notNull(),
});

const insertThreadSettingsSchema = createInsertSchema(threadSettings).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const schema = {
  embeddings,
  messages,
  resources,
  threads,
  templates,
  threadSettings,
};

export {
  insertResourceSchema,
  insertMessageSchema,
  insertTemplateSchema,
  insertThreadSettingsSchema,
};
