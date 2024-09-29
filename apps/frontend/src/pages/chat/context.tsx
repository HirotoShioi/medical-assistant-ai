import { createContext, useContext } from "react";
import { useChat } from "@/hooks/use-chat";
import { useAutoScroll } from "@/hooks/use-auto-scroll";
import { useMediaQuery } from "@/hooks/use-media-query";
import { useFileUpload } from "@/hooks/use-file-upload";
import { useDocumentGenerator } from "@/hooks/use-document-generator";
import { PanelContextProvider } from "@/contexts/panel-context";
import { Thread, ThreadSettings } from "@/models";
import { Usage } from "@/services/usage";
import { Resource } from "@/models";
import { Message } from "ai/react";

export interface ChatContextType {
  chatHook: ReturnType<typeof useChat>;
  resources: Resource[];
  scrollRef: (element: HTMLDivElement | null) => void;
  scrollToEnd: () => void;
  isLoading: boolean;
  isSmallScreen: boolean;
  thread: Thread;
  threadSettings: ThreadSettings;
  usage: Usage;
  isResourceUploaderOpen: boolean;
  setIsResourceUploaderOpen: (isOpen: boolean) => void;
  uploadFiles: (files: File[]) => void;
  uploadText: (text: string) => void;
  generateDocument: () => Promise<void>;
  isGeneratingDocument: boolean;
  isUploadingResources: boolean;
}

export interface ChatContextProviderProps {
  children: React.ReactNode;
  thread: Thread;
  messages: Message[];
  resources: Resource[];
  usage: Usage;
  threadSettings: ThreadSettings;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export function ChatContextProvider({
  children,
  thread,
  messages,
  resources,
  usage,
  threadSettings,
}: ChatContextProviderProps) {
  const isSmallScreen = useMediaQuery("(max-width: 1200px)");
  const { ref: scrollRef, scrollToEnd } = useAutoScroll();
  const chatHook = useChat(thread.id, messages);

  const {
    isResourceUploaderOpen,
    setIsResourceUploaderOpen,
    uploadFiles,
    uploadText,
    isUploadingResources,
  } = useFileUpload(thread.id, chatHook.append);

  const { generateDocument, isGeneratingDocument } = useDocumentGenerator(
    thread.id,
    threadSettings,
    chatHook.append
  );

  const isLoading =
    chatHook.isLoading || isUploadingResources || isGeneratingDocument;

  return (
    <PanelContextProvider>
      <ChatContext.Provider
        value={{
          chatHook,
          resources,
          scrollRef,
          scrollToEnd,
          isLoading,
          thread,
          threadSettings,
          usage,
          isSmallScreen,
          isResourceUploaderOpen,
          setIsResourceUploaderOpen,
          uploadFiles,
          uploadText,
          generateDocument,
          isGeneratingDocument,
          isUploadingResources,
        }}
      >
        {children}
      </ChatContext.Provider>
    </PanelContextProvider>
  );
}

export const useChatContext = () => {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error("useChatContext must be used within a ChatContextProvider");
  }
  return context;
};
