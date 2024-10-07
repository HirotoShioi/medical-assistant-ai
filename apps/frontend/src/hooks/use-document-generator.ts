import { useMutation, useQueryClient } from "@tanstack/react-query";
import { generateDocument as generateDocumentFn } from "@/lib/ai/generate-document";
import { nanoid } from "nanoid";
import { Message } from "ai/react";
import { getThreadSettingsById } from "@/services/threads/service";
import { getResourcesByThreadId } from "@/services/resources/service";
import { getMessagesByThreadId } from "@/services/messages/services";

export function useDocumentGenerator(
  threadId: string,
  appendMessage: (message: Message) => void
) {
  const queryClient = useQueryClient();

  const generateDocument = useMutation({
    mutationFn: async () => {
      const [threadSettings, messages, documents] = await Promise.all([
        getThreadSettingsById(threadId),
        getMessagesByThreadId(threadId),
        getResourcesByThreadId(threadId),
      ]);
      const result = await generateDocumentFn({
        documentGenerationPrompt: threadSettings.reportGenerationPrompt ?? "",
        messages,
        documents,
      });
      const message: Message = {
        id: nanoid(),
        role: "assistant",
        content: "",
        toolInvocations: [
          {
            state: "result",
            toolCallId: nanoid(),
            toolName: "generateDocument",
            args: {},
            result: {
              success: true,
              fileId: nanoid(),
              result: result,
            },
          },
        ],
      };
      appendMessage(message);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["usage"] });
      queryClient.invalidateQueries({ queryKey: ["documents", { threadId }] });
    },
  });

  return {
    generateDocument: generateDocument.mutateAsync,
    isGeneratingDocument: generateDocument.isPending,
  };
}
