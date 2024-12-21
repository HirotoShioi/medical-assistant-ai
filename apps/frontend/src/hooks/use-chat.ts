import { useChat as c } from "ai/react";
import { convertToCoreMessages, Message, streamText, tool } from "ai";
import { saveMessage } from "@/services/messages";
import { createOpenAI } from "@ai-sdk/openai";
import { z } from "zod";
import { findRelevantContent } from "@/lib/ai/embeddings";
import { MAX_STEPS_FOR_TOOL_CALLS } from "@/constants";
import { fetchAuthSession } from "aws-amplify/auth";
import { getThreadSettingsById } from "@/services/threads/service";
import { getMessagesByThreadId } from "@/services/messages/services";
import { getResourcesByThreadId } from "@/services/resources/service";
import { generateDocument } from "@/lib/ai/generate-document";
import { codeBlock } from "common-tags";
import { getUserPreferences } from "@/services/user/service";
import { Resource } from "@/models";
import { searchMedicine } from "@/lib/api";

export function useChat(threadId: string, initialMessages?: Message[]) {
  const chat = c({
    id: threadId,
    initialMessages,
    api: "/api/chat",
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
  const [settings, userPreferences, resources] = await Promise.all([
    getThreadSettingsById(threadId),
    getUserPreferences(),
    getResourcesByThreadId(threadId),
  ]);
  const { messages } = body as { messages: any[] };
  const model = createOpenAI({
    apiKey: session.tokens.idToken.toString(),
    baseURL: import.meta.env.VITE_API_URL,
  }).chat(userPreferences.llmModel);
  const result = await streamText({
    model: model,
    system: codeBlock`Today's date: ${new Date().toLocaleDateString()}
    ${settings.systemMessage}`,
    maxRetries: 0,
    maxSteps: MAX_STEPS_FOR_TOOL_CALLS,
    toolChoice: "auto",
    messages: convertToCoreMessages(messages),
    tools: {
      getRelavantInformation: getRelavantInformationTool(threadId, resources),
      embedResource: embedResourceTool(),
      generateDocument: generateDocumentTool(threadId),
      searchMedicine: searchMedicineTool(),
    },
  });
  return result.toDataStreamResponse();
}

function getRelavantInformationTool(threadId: string, resources: Resource[]) {
  const availableResources = resources
    .map((resource) => `${resource.title} - ${resource.summary}`)
    .join("\n");
  return tool({
    description: codeBlock`
    Get information from your knowledge base to answer user's questions. 
    - If no resources are available, return an empty array.
    
    Available resources:
    ${resources.length > 0 ? availableResources : "No resources available"}
    `,
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
      return contents
        .flat()
        .filter(
          (content, index, self) =>
            index ===
            self.findIndex((t) => t.embeddingId === content.embeddingId)
        )
        .map(({ content }) => content);
    },
  });
}

function embedResourceTool() {
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

// WARNING: This tool is not used anymore, but it is kept here so that the tool names are being shown in the UI
function generateDocumentTool(threadId: string) {
  return tool({
    description:
      "Generate a document from the chat and documents. Do not call this tool directly, it is used internally by the system.",
    parameters: z.object({}),
    execute: async () => {
      const [messages, settings, documents] = await Promise.all([
        getMessagesByThreadId(threadId),
        getThreadSettingsById(threadId),
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

// function searchWebTool() {
//   return tool({
//     description: codeBlock`
// Search the web and gather relevant information:
// - Group similar queries together and send them as a batch whenever possible.
// - Ensure that the queries are concise and specific to get accurate results.
// - Limit the number of individual queries to avoid unnecessary searches.
// - Return a summary of the findings for each batch.
//     `,
//     parameters: z.object({
//       queries: z.string().describe("The queries to search the web for."),
//     }),
//     execute: async ({ queries }) => {
//       return searchWeb(queries);
//     },
//   });
// }

function searchMedicineTool() {
  return tool({
    description: codeBlock`
    This tool enables you to search for medicine information. It'll return a list of medicines that match the query.
    `,
    parameters: z.object({
      medicineNames: z
        .array(
          z.string().describe("The name of the medicine to search for.")
        )
        .describe("List of medicine names to search for."),
    }),
    execute: async ({ medicineNames }) => {
      const medicines = await Promise.all(
        medicineNames.map((name) => searchMedicine(name))
      );
      return medicines.flat();
    },
  });
}

export type ToolNames =
  | "getRelavantInformation"
  | "embedResource"
  | "generateDocument"
  | "searchWeb"
  | "searchMedicine";
