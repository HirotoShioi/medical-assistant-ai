import { getDB } from "@/lib/database/client";
import { schema } from "@/lib/database/schema";
import { NewMessageParams } from "@/models";
import { eq } from "drizzle-orm";
import { Message } from "@ai-sdk/react";
import { Message as MessageRow } from "@/models";
import { ToolInvocation } from "ai";
export async function saveMessage(input: NewMessageParams) {
  const db = await getDB();
  return db
    .insert(schema.messages)
    .values({
      role: input.role as "user" | "assistant" | "data" | "system",
      content: input.content,
      toolInvocations: input.toolInvocations,
      threadId: input.threadId,
    })
    .returning();
}

export async function getMessagesByThreadId(threadId: string) {
  const db = await getDB();
  const messages = await db
    .select()
    .from(schema.messages)
    .where(eq(schema.messages.threadId, threadId));
  return messages.map(toMessage);
}

const toMessage = (message: MessageRow): Message => {
  return {
    id: message.id,
    role: message.role,
    content: message.content,
    toolInvocations: JSON.parse(
      message.toolInvocations as string
    ) as ToolInvocation[],
  };
};
