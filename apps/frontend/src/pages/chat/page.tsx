import { useNavigate, useParams } from "react-router";
import { useEffect, useState } from "react";
import ChatMessage from "./components/chat-message";
import ChatInput from "./components/chat-input";
import { ResourcePanel } from "./components/resource-panel";
import { ChatContextProvider, useChatContext } from "@/pages/chat/context";
import React from "react";
import { ChatTitle } from "./components/chat-title";
import { useUsageQuery } from "@/services/usage/queries";
import { useMessagesQuery } from "@/services/messages/queries";
import { useResourcesQuery } from "@/services/resources/queries";
import { FullPageLoader } from "@/components/fulll-page-loader";
import { useTranslation } from "react-i18next";
import {
  useThreadQuery,
  useThreadSettingsQuery,
} from "@/services/threads/queries";
import { useDropzone } from "react-dropzone";
import { Loader2 } from "lucide-react";
import ResourceUploader from "./components/resource-uploader";

const Resource = React.memo(ResourcePanel);

function ChatContainer({ children }: { children: React.ReactNode }) {
  return (
    <div className="md:max-w-3xl xl:max-w-[48rem] w-full mx-auto">
      {children}
    </div>
  );
}

function FileUploadOverlay() {
  return (
    <div className="absolute inset-0 flex items-center justify-center text-center bg-white/80 backdrop-filter backdrop-blur-sm transition-all duration-300 ease-in-out z-50">
      <p className="text-2xl font-bold text-black">
        ファイルをここにドラッグ＆ドロップしてください
      </p>
    </div>
  );
}

function DocumentGeneratorLoaderOverlay() {
  const { t } = useTranslation();
  const [dots, setDots] = useState("");

  useEffect(() => {
    const interval = setInterval(() => {
      setDots((prevDots) => (prevDots.length >= 3 ? "" : prevDots + "."));
    }, 500);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center text-center bg-white/80 backdrop-filter backdrop-blur-sm transition-all duration-300 ease-in-out z-50 gap-4">
      <Loader2 className="w-10 h-10 animate-spin" />
      <div className="text-sm text-gray-500">
        <span
          dangerouslySetInnerHTML={{ __html: t("page.generatingDocument") }}
        ></span>
        <span className="inline-block w-8 text-left">{dots}</span>
      </div>
    </div>
  );
}

function ChatPageContent() {
  const {
    chatHook,
    scrollRef,
    scrollToEnd,
    isSmallScreen,
    uploadFiles,
    isGeneratingDocument,
    isResourceUploaderOpen: isDocumentUploaderOpen,
  } = useChatContext();
  const [isDragging, setIsDragging] = useState(false);

  const { getRootProps, getInputProps } = useDropzone({
    onDragEnter: () => (isDocumentUploaderOpen ? null : setIsDragging(true)),
    onDragLeave: () => setIsDragging(false),
    onDrop: (acceptedFiles) => {
      if (isDocumentUploaderOpen) {
        return;
      }
      setIsDragging(false);
      uploadFiles(acceptedFiles);
    },
    noClick: true,
    accept: {
      "application/pdf": [],
      "text/markdown": [],
      "text/plain": [],
      "text/csv": [],
      "application/json": [],
      "image/png": [],
      "image/jpeg": [],
      "image/jpg": [],
    },
  });

  useEffect(() => {
    scrollToEnd();
  }, [scrollToEnd]);

  return (
    <div {...getRootProps()} className="flex flex-row h-screen min-w-[20rem]">
      <input {...getInputProps()} />
      {isDragging && <FileUploadOverlay />}
      {!isSmallScreen && <Resource />}
      {isGeneratingDocument && <DocumentGeneratorLoaderOverlay />}
      <ResourceUploader />
      <div className="w-full h-full flex flex-col">
        <ChatTitle />
        <div className="flex-grow overflow-hidden flex flex-col relative">
          <div className="flex-grow overflow-y-auto" ref={scrollRef}>
            <div className="mx-auto">
              {chatHook.messages.map((message, i) => (
                <ChatContainer key={message.id}>
                  <ChatMessage
                    message={message}
                    isLast={i === chatHook.messages.length - 1}
                  />
                </ChatContainer>
              ))}
            </div>
          </div>
          <div className="mx-auto w-full py-4">
            <ChatContainer>
              <ChatInput />
            </ChatContainer>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ChatPage() {
  const params = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const threadQuery = useThreadQuery(params.threadId!);
  const usageQuery = useUsageQuery();
  const messagesQuery = useMessagesQuery(threadQuery.data?.id);
  const resourceQuery = useResourcesQuery(threadQuery.data?.id);
  const threadSettingsQuery = useThreadSettingsQuery(threadQuery.data?.id);
  if (
    !usageQuery.data ||
    !messagesQuery.data ||
    !resourceQuery.data ||
    !threadSettingsQuery.data
  ) {
    return <FullPageLoader label={t("page.loading")} />;
  }
  if (threadQuery.data === null) {
    navigate("/");
    return null;
  }
  return (
    <ChatContextProvider
      thread={threadQuery.data!}
      messages={messagesQuery.data}
      resources={resourceQuery.data}
      usage={usageQuery.data}
      threadSettings={threadSettingsQuery.data}
    >
      <ChatPageContent />
    </ChatContextProvider>
  );
}
