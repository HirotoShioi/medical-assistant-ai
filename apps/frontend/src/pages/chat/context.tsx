import React, { createContext, useContext, useState, useEffect } from "react";
import { Message } from "ai/react";
import { useChat } from "@/hooks/use-chat";
import { Document, Thread } from "@/models";
import { useNavigate } from "react-router-dom";
import { useAlert } from "@/components/alert";
import {
  loadFromLocalStorage,
  deleteFromLocalStorage,
} from "@/utils/local-storage";
import { useAutoScroll } from "@/hooks/use-auto-scroll";
import { useRenameThreadMutation } from "@/services/threads/mutations";
import { nameConversation } from "@/lib/ai/name-conversation";
import { useMediaQuery } from "@/hooks/use-media-query";
import { Usage } from "@/services/usage";
import { MAXIMUM_FILE_SIZE_IN_BYTES, PREVIEW_TEXT_LENGTH } from "@/constants";
import { parseFile } from "@/lib/file";
import { t } from "i18next";
import { nanoid } from "nanoid";
import { useAuthenticator } from "@aws-amplify/ui-react";
import { useDocumentCreateMutation } from "@/services/documents/mutations";

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
  setIsUploadingDocuments: React.Dispatch<React.SetStateAction<boolean>>;
  isSmallScreen: boolean;
  thread: Thread;
  usage: Usage;
  uploadFiles: (acceptedFiles: File[]) => Promise<void>;
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
  const { mutateAsync: renameThread } = useRenameThreadMutation();
  const { openAlert } = useAlert();
  const [isUploadingDocuments, setIsUploadingDocuments] = useState(false);
  const navigate = useNavigate();
  const isSmallScreen = useMediaQuery("(max-width: 1200px)");
  const [isDocumentUploaderOpen, setIsDocumentUploaderOpen] = useState(false);
  const { ref: scrollRef, scrollToEnd } = useAutoScroll();
  const chatHook = useChat(thread.id, messages);
  const { mutateAsync: embedDocument } = useDocumentCreateMutation();
  const { user } = useAuthenticator((u) => [u.user]);
  const [panelState, setPanelState] = useState<PanelState>(() => {
    if (window.innerWidth < 768) {
      return "closed";
    }
    return "list";
  });

  // ここもあとで修正する
  useEffect(() => {
    const message = loadFromLocalStorage(thread.id);
    if (message && messages.length <= 0) {
      const parsedMessage = JSON.parse(message);
      chatHook.append(parsedMessage);
      deleteFromLocalStorage(thread.id);
      nameConversation(parsedMessage.content).then((name) =>
        renameThread({ threadId: thread.id, title: name })
      );
    }
  }, [thread.id, messages, chatHook, openAlert, navigate, renameThread]);

  async function uploadFiles(acceptedFiles: File[]) {
    if (!user) {
      return;
    }
    setIsUploadingDocuments(true);
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
    try {
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
            {
              onError: (error) => {
                openAlert({
                  title: "Error",
                  description: error.message,
                  actions: [
                    {
                      label: "OK",
                    },
                  ],
                });
              },
            }
          );
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
    } finally {
      setIsUploadingDocuments(false);
    }
  }

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
        isUploadingDocuments,
        setIsUploadingDocuments,
        uploadFiles,
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
