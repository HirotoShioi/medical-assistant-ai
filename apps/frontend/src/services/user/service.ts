import { getDB } from "@/lib/database/client";
import { schema } from "@/lib/database/schema";
import { z } from "zod";

async function getUserPreferences() {
  const db = await getDB();
  const preferences = await db.select().from(schema.userPreferences);
  return preferences[0];
}

const LLMModel = ["gpt-4o-mini", "gpt-4o"] as const;
async function updateUserPreferences(args: { llmModel: string }) {
  const inputSchema = z.object({
    llmModel: z.enum(LLMModel),
  });
  const parsed = inputSchema.safeParse(args);
  if (!parsed.success) {
    throw new Error("Invalid LLM Model");
  }
  const db = await getDB();
  await db.update(schema.userPreferences).set(parsed.data).returning();
}

export { getUserPreferences, updateUserPreferences, LLMModel };
