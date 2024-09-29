import { useChat as c } from "ai/react";
import { convertToCoreMessages, Message, streamText, tool } from "ai";
import { saveMessage } from "@/services/messages";
import { createOpenAI } from "@ai-sdk/openai";
import { z } from "zod";
import { findRelevantContent } from "@/lib/ai/embeddings";
import { BASE_MODEL } from "@/constants";
import { fetchAuthSession } from "aws-amplify/auth";
import { getThreadSettingsById } from "@/services/threads/service";
import { getMessagesByThreadId } from "@/services/messages/services";
import { getResourcesByThreadId } from "@/services/resources/service";
import { generateDocument as generateDocument } from "@/lib/ai/generate-document";
import { ThreadSettings } from "@/models";

export function useChat(threadId: string, initialMessages?: Message[]) {
  const chat = c({
    id: threadId,
    initialMessages,
    api: "/api/chat",
    maxToolRoundtrips: 3,
    keepLastMessageOnError: true,
    fetch: (_input, init) => handleChat(new Request(`/chat/${threadId}`, init)),
    onFinish: async (message) => {
      await saveMessage({
        role: message.role,
        content: message.content,
        toolInvocations: JSON.stringify(message.toolInvocations),
        threadId: threadId!,
      });
    },
    onToolCall({ toolCall }) {
      console.log("Tool call", toolCall);
    },
  });
  return {
    ...chat,
    append: async (message: Message) => {
      await saveMessage({
        threadId: threadId,
        role: message.role,
        content: message.content,
        toolInvocations: JSON.stringify(message.toolInvocations),
      });
      chat.append(message);
    },
  };
}

async function handleChat(req: Request) {
  const body = await req.json();
  const threadId = req.url.split("/").pop();
  if (!body || !threadId) {
    return Response.json({ error: "No body" }, { status: 404 });
  }
  const session = await fetchAuthSession();
  if (!session.tokens?.idToken) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  const settings = await getThreadSettingsById(threadId);
  const { messages } = body as { messages: any[] };
  const model = createOpenAI({
    apiKey: session.tokens.idToken.toString(),
    baseURL: import.meta.env.VITE_API_URL,
  }).chat(BASE_MODEL);
  const result = await streamText({
    model: model,
    system: settings.systemMessage,
    maxRetries: 0,
    toolChoice: "auto",
    messages: convertToCoreMessages(messages),
    tools: {
      getRelavantInformation: getRelavantInformationTool(threadId),
      embedDocument: embedDocumentTool(),
      generateDocument: generateDocumentTool(threadId, settings),
    },
  });
  return result.toDataStreamResponse();
}

function getRelavantInformationTool(threadId: string) {
  return tool({
    description:
      "Get information from your knowledge base to answer user's questions. Rewrite it into 5 distinct queries that could be used to search for relevant information. Each query should focus on different aspects or potential interpretations of the original message. No questions, just a query maximizing the chance of finding relevant information.",
    parameters: z.object({
      queries: z
        .string()
        .describe("Search query you use to lookup the knowledge base")
        .array(),
    }),
    execute: async ({ queries }) => {
      console.log(queries);
      const contents = await Promise.all(
        queries.map((query) => findRelevantContent(query, threadId))
      );
      const uniqueContents = contents
        .flat()
        .filter(
          (content, index, self) =>
            index ===
            self.findIndex((t) => t.embeddingId === content.embeddingId)
        );
      return uniqueContents;
    },
  });
}

function embedDocumentTool() {
  return tool({
    description:
      "Embed a document into the knowledge base. Do not call this tool directly, it is used internally by the system.",
    parameters: z.object({
      title: z.string().describe("The title of the document."),
      content: z.string().describe("The content of the document."),
      fileType: z.string().describe("The file type of the document."),
    }),
    execute: async () => {
      return "Document saved";
    },
  });
}

function generateDocumentTool(threadId: string, settings: ThreadSettings) {
  return tool({
    description:
      "Generate a document from the chat and documents. Do not call this tool directly, it is used internally by the system.",
    parameters: z.object({}),
    execute: async () => {
      const [messages, documents] = await Promise.all([
        getMessagesByThreadId(threadId),
        getResourcesByThreadId(threadId),
      ]);
      return generateDocument({
        documentGenerationPrompt: settings.reportGenerationPrompt ?? undefined,
        messages,
        documents,
      });
    },
  });
}
export type ToolNames =
  | "getRelavantInformation"
  | "embedDocument"
  | "generateDocument";
