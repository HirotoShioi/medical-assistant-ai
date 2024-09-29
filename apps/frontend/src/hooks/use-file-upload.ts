import { useState } from "react";
import { useAlert } from "@/components/alert";
import { MAXIMUM_FILE_SIZE_IN_BYTES, PREVIEW_TEXT_LENGTH } from "@/constants";
import { parseFile } from "@/lib/file";
import { t } from "i18next";
import { nanoid } from "nanoid";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { convertTextToMarkdown } from "@/lib/ai/convert-text-to-markdown";
import { embedResource } from "@/services/resources/service";
import { Message } from "ai/react";

export function useFileUpload(
  threadId: string,
  appendMessage: (message: Message) => void
) {
  const { openAlert } = useAlert();
  const [isResourceUploaderOpen, setIsResourceUploaderOpen] = useState(false);
  const queryClient = useQueryClient();

  const uploadFiles = async (acceptedFiles: File[]) => {
    if (acceptedFiles.length <= 0) {
      return;
    }
    if (acceptedFiles.some((file) => file.size >= MAXIMUM_FILE_SIZE_IN_BYTES)) {
      openAlert({
        title: t("file.fileSizeIsTooLarge"),
        description: t("file.pleaseUploadFilesSmallerThan1MB"),
        actions: [
          {
            label: "OK",
          },
        ],
      });
      return;
    }
    const fileWithText = await Promise.all(
      acceptedFiles.map(async (file) => {
        const { content, fileType } = await parseFile(file, file.type);
        await embedResource({
          threadId,
          content,
          title: file.name,
          fileType,
        });
        return {
          text: content,
          file,
        };
      })
    );
    const message: Message = {
      id: nanoid(),
      role: "assistant",
      content: "",
      toolInvocations: fileWithText.map(({ text, file }) => ({
        state: "result",
        toolCallId: nanoid(),
        toolName: "embedDocument",
        args: {},
        result: {
          success: true,
          fileId: nanoid(),
          file: {
            name: file.name,
            size: file.size,
            type: file.type,
          },
          preview: text.slice(0, PREVIEW_TEXT_LENGTH).trim(),
        },
      })),
    };
    appendMessage(message);
    setIsResourceUploaderOpen(false);
  };

  const uploadFilesMutation = useMutation({
    mutationFn: uploadFiles,
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["usage"] });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["resources", { threadId }] });
    },
  });

  const uploadText = useMutation({
    mutationFn: async (text: string) => {
      const markdown = await convertTextToMarkdown(text);
      const file = new File([markdown.content], markdown.title, {
        type: "text/markdown",
      });
      return uploadFiles([file]);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["resources", { threadId }] });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["usage"] });
    },
  });

  return {
    isResourceUploaderOpen,
    setIsResourceUploaderOpen,
    uploadFiles: uploadFilesMutation.mutateAsync,
    uploadText: uploadText.mutateAsync,
    isUploadingResources: uploadFilesMutation.isPending || uploadText.isPending,
  };
}
