import { useMutation, useQueryClient } from "@tanstack/react-query";
import { GeneratePatientReferralDocument } from "@/services/ai/document-generator/generate-patient-referral-document";
import { nanoid } from "nanoid";
import { Message } from "ai/react";

export function useDocumentGenerator(
  threadId: string,
  appendMessage: (message: Message) => void
) {
  const queryClient = useQueryClient();

  const generateDocument = useMutation({
    mutationFn: async () => {
      const generator = new GeneratePatientReferralDocument();
      const result = await generator.generateDocument(threadId);
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
