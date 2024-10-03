// https://github.com/drizzle-team/drizzle-orm/discussions/2532
import { bigint, pgTable, serial, text } from "drizzle-orm/pg-core";
import { drizzle } from "drizzle-orm/pglite";
import { count, eq, sql } from "drizzle-orm";
import { PGliteWorker } from "@electric-sql/pglite/worker";
import { initialTemplates } from "./initialTemplates";
import { nanoid } from "nanoid";
import { schema } from "./schema";

const createDrizzleMigrationsTable = sql`
CREATE TABLE IF NOT EXISTS "__drizzle_migrations" (
	"id" serial PRIMARY KEY NOT NULL,
	"hash" text NOT NULL,
	"timestamp" bigint NOT NULL,
	CONSTRAINT "__drizzle_migrations_hash_unique" UNIQUE("hash")
);`;

const drizzleMigrations = pgTable("__drizzle_migrations", {
  id: serial("id").primaryKey(),
  hash: text("hash").unique().notNull(),
  timestamp: bigint("timestamp", { mode: "number" }).notNull(),
});

export const migrations = [
  "CREATE EXTENSION IF NOT EXISTS vector;",
  `CREATE TABLE IF NOT EXISTS "threads" (
    "id" varchar(191) PRIMARY KEY NOT NULL,
    "title" text NOT NULL,
    "created_at" timestamp DEFAULT now() NOT NULL,
    "updated_at" timestamp DEFAULT now() NOT NULL
  );`,
  `CREATE TABLE IF NOT EXISTS "resources" (
    "id" varchar(191) PRIMARY KEY NOT NULL,
    "summary" text NOT NULL,
    "title" text NOT NULL,
    "thread_id" varchar(191) NOT NULL,
    "file_type" text NOT NULL,
    "content" text NOT NULL,
    "created_at" timestamp DEFAULT now() NOT NULL,
    "updated_at" timestamp DEFAULT now() NOT NULL,
    FOREIGN KEY ("thread_id") REFERENCES "threads" ("id") ON DELETE CASCADE
  );`,
  `CREATE TABLE IF NOT EXISTS "embeddings" (
    "id" varchar(191) PRIMARY KEY NOT NULL,
    "resource_id" varchar(191) NOT NULL,
    "thread_id" varchar(191) NOT NULL,
    "content" text NOT NULL,
    "embedding" vector(1536) NOT NULL,
    "created_at" timestamp DEFAULT now() NOT NULL,
    "updated_at" timestamp DEFAULT now() NOT NULL,
    FOREIGN KEY ("resource_id") REFERENCES "resources" ("id") ON DELETE CASCADE
  );`,
  `CREATE INDEX IF NOT EXISTS "embeddingIndex" ON "embeddings" USING hnsw (embedding vector_cosine_ops);`,
  `CREATE TABLE IF NOT EXISTS "messages" (
    "id" varchar(191) PRIMARY KEY NOT NULL,
    "thread_id" varchar(191) NOT NULL,
    "role" text NOT NULL CHECK (role IN ('user', 'assistant', 'tool', 'function', 'system', 'data')),
    "content" text NOT NULL,
    "tool_invocations" jsonb,
    "created_at" timestamp DEFAULT now() NOT NULL,
    FOREIGN KEY ("thread_id") REFERENCES "threads" ("id") ON DELETE CASCADE
  );`,
  `CREATE TABLE IF NOT EXISTS "templates" (
    "id" varchar(191) PRIMARY KEY NOT NULL,
    "title" text NOT NULL,
    "overview" text NOT NULL,
    "description" text NOT NULL,
    "system_message" text NOT NULL,
    "initial_assistant_message" text NOT NULL,
    "type" text NOT NULL CHECK (type IN ('report', 'summary', 'chat')),
    "report_generation_prompt" text,
    "icon" varchar(50) NOT NULL,
    "created_at" timestamp DEFAULT now() NOT NULL,
    "updated_at" timestamp DEFAULT now() NOT NULL,
    "original_template" jsonb
  );`,
  `CREATE TABLE IF NOT EXISTS "thread_settings" (
    "id" varchar(191) PRIMARY KEY NOT NULL,
    "thread_id" varchar(191) NOT NULL,
    "template_id" varchar(191),
    "template_title" text NOT NULL,
    "template_overview" text NOT NULL,
    "system_message" text NOT NULL,
    "initial_assistant_message" text NOT NULL,
    "template_type" text NOT NULL CHECK (template_type IN ('report', 'summary', 'chat')),
    "report_generation_prompt" text,
    "created_at" timestamp DEFAULT now() NOT NULL,
    "updated_at" timestamp DEFAULT now() NOT NULL
  );`,
];

async function createHash(str: string) {
  const encoder = new TextEncoder();
  const data = encoder.encode(str);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  return hashHex;
}

export async function applyMigrations(pglite: PGliteWorker) {
  const db = drizzle(pglite as any);
  await db.execute(createDrizzleMigrationsTable);
  const [migrationCount] = await db
    .select({ value: count() })
    .from(drizzleMigrations);
  if (migrationCount.value === migrations.length) {
    return;
  }
  for (const migration of migrations) {
    const hash = await createHash(migration);
    const result = await db
      .select()
      .from(drizzleMigrations)
      .where(eq(drizzleMigrations.hash, hash));
    if (result.length === 0) {
      const migrationQueries = migration
        .toString()
        .split("--> statement-breakpoint");
      for (const query of migrationQueries) {
        await pglite.exec(query);
      }
      await db
        .insert(drizzleMigrations)
        .values({ hash, timestamp: Date.now() });
    } else {
      console.log(`Migration hash ${hash} already exists`);
    }
  }
  if (migrationCount.value === 0) {
    await db.insert(schema.templates).values(
      initialTemplates.map((t) => ({
        ...t,
        id: nanoid(),
        originalTemplate: JSON.stringify(t),
      }))
    );
  }
}
