import { useNavigate, useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { MessageComponent } from "./message";
import { ChatInput } from "./chat-input";
import { DocumentPanel } from "./document-panel";
import { ChatContextProvider, useChatContext } from "@/pages/chat/context";
import React from "react";
import { ChatTitle } from "./chat-title";
import { useUsageQuery } from "@/services/usage/queries";
import { useMessagesQuery } from "@/services/messages/queries";
import { useDocumentsQuery } from "@/services/documents/queries";
import { FullPageLoader } from "@/components/fulll-page-loader";
import { useTranslation } from "react-i18next";
import { useThreadQuery } from "@/services/threads/queries";
import { useDropzone } from "react-dropzone";

const Document = React.memo(DocumentPanel);

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

function ChatPageContent() {
  const {
    chatHook,
    scrollRef,
    scrollToEnd,
    isSmallScreen,
    uploadFiles,
    isDocumentUploaderOpen,
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
    },
  });

  useEffect(() => {
    scrollToEnd();
  }, [scrollToEnd]);

  return (
    <div {...getRootProps()} className="flex flex-row h-screen min-w-[20rem]">
      <input {...getInputProps()} />
      {isDragging && <FileUploadOverlay />}
      {!isSmallScreen && <Document />}
      <div className="w-full h-full flex flex-col">
        <ChatTitle />
        <div className="flex-grow overflow-hidden flex flex-col">
          <div className="flex-grow overflow-y-auto" ref={scrollRef}>
            <div className="mx-auto">
              {chatHook.messages.map((message) => (
                <ChatContainer key={message.id}>
                  <MessageComponent message={message} />
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
  const documentQuery = useDocumentsQuery(threadQuery.data?.id);
  if (!usageQuery.data || !messagesQuery.data || !documentQuery.data) {
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
      documents={documentQuery.data}
      usage={usageQuery.data}
    >
      <ChatPageContent />
    </ChatContextProvider>
  );
}