import { getDB } from "@/lib/database/client";
import { schema } from "@/lib/database/schema";
import { NewMessageParams } from "@/models";

export async function saveMessage(input: NewMessageParams) {
  const db = await getDB();
  return db
    .insert(schema.messages)
    .values({
      role: input.role as "user" | "assistant" | "tool",
      content: input.content,
      toolInvocations: input.toolInvocations,
      threadId: input.threadId,
    })
    .returning();
}
