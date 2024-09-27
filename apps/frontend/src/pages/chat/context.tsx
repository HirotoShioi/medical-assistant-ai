import React, { createContext, useContext, useState } from "react";
import { Message } from "ai/react";
import { useChat } from "@/hooks/use-chat";
import { Document, Thread } from "@/models";
import { useAlert } from "@/components/alert";
import { useAutoScroll } from "@/hooks/use-auto-scroll";
import { useMediaQuery } from "@/hooks/use-media-query";
import { Usage } from "@/services/usage";
import { MAXIMUM_FILE_SIZE_IN_BYTES, PREVIEW_TEXT_LENGTH } from "@/constants";
import { parseFile } from "@/lib/file";
import { t } from "i18next";
import { nanoid } from "nanoid";
import { useAuthenticator } from "@aws-amplify/ui-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { convertTextToMarkdown } from "@/lib/ai/convert-text-to-markdown";
import { embedDocument } from "@/services/documents/service";

export type PanelState = "closed" | "list" | "detail";

interface ChatContextType {
  chatHook: ReturnType<typeof useChat>;
  panelState: PanelState;
  setPanelState: React.Dispatch<React.SetStateAction<PanelState>>;
  documents: Document[];
  scrollRef: (element: HTMLDivElement | null) => void;
  scrollToEnd: () => void;
  isDocumentUploaderOpen: boolean;
  setIsDocumentUploaderOpen: React.Dispatch<React.SetStateAction<boolean>>;
  isUploadingDocuments: boolean;
  isSmallScreen: boolean;
  thread: Thread;
  usage: Usage;
  uploadFiles: (acceptedFiles: File[]) => Promise<void>;
  uploadText: (text: string) => Promise<void>;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export type ChatContextProviderProps = {
  children: React.ReactNode;
  thread: Thread;
  messages: Message[];
  documents: Document[];
  usage: Usage;
};
export function ChatContextProvider({
  children,
  thread,
  messages,
  documents,
  usage,
}: ChatContextProviderProps) {
  const { openAlert } = useAlert();
  const isSmallScreen = useMediaQuery("(max-width: 1200px)");
  const [isDocumentUploaderOpen, setIsDocumentUploaderOpen] = useState(false);
  const { ref: scrollRef, scrollToEnd } = useAutoScroll();
  const chatHook = useChat(thread.id, messages);
  const { user } = useAuthenticator((u) => [u.user]);
  const [panelState, setPanelState] = useState<PanelState>(() => {
    if (window.innerWidth < 768) {
      return "closed";
    }
    return "list";
  });

  async function uploadFiles(acceptedFiles: File[]) {
    if (!user) {
      return;
    }
    setIsDocumentUploaderOpen(false);
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
        await embedDocument(
          {
            threadId: thread.id,
            content,
            title: file.name,
            fileType,
          },
        )
        return {
          text: content,
          file,
        };
      })
    );
    const message: Message = {
      id: nanoid(),
      role: "assistant" as const,
      content: "",
      toolInvocations: fileWithText.map(({ text, file }) => ({
        state: "result" as const,
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
    chatHook.append(message);
    setPanelState("list");
    scrollToEnd();
  }

  const queryClient = useQueryClient();
  const uploadFilesMutation = useMutation({
    mutationFn: async (acceptedFiles: File[]) => {
      return uploadFiles(acceptedFiles);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["usage"],
      });
      queryClient.invalidateQueries({
        queryKey: ["documents", { threadId: thread.id }],
      });
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
      queryClient.invalidateQueries({
        queryKey: ["usage"],
      });
      queryClient.invalidateQueries({
        queryKey: ["documents", { threadId: thread.id }],
      });
    },
  });
  return (
    <ChatContext.Provider
      value={{
        chatHook,
        panelState,
        setPanelState,
        isSmallScreen,
        documents,
        scrollRef,
        scrollToEnd,
        isDocumentUploaderOpen,
        setIsDocumentUploaderOpen,
        isUploadingDocuments: uploadFilesMutation.isPending || uploadText.isPending,
        uploadFiles: uploadFilesMutation.mutateAsync,
        uploadText: uploadText.mutateAsync,
        thread,
        usage,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
}

export const useChatContext = () => {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error("useChatContext must be used within a ChatContextProvider");
  }
  return context;
};
