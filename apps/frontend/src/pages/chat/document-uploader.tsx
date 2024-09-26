// src/components/LargeDialog.jsx

import { useRef } from "react";
import { useDropzone } from "react-dropzone";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogTitle,
  DialogHeader,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { CirclePlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useChatContext } from "@/pages/chat/context";
import { UsageTooltip } from "@/components/usage-tooltip";
import { cn } from "@/lib/utils";
import { useTranslation } from "react-i18next";
import { useAuthenticator } from "@aws-amplify/ui-react";
import { convertTextToMarkdown } from "@/lib/ai/convert-text-to-markdown";

export default function DocumentUploader() {
  const {
    isDocumentUploaderOpen,
    setIsDocumentUploaderOpen,
    usage,
    uploadFiles,
    setIsUploadingDocuments,
  } = useChatContext();
  const { t } = useTranslation();
  const textAreaRef = useRef<HTMLTextAreaElement>(null);
  const { user } = useAuthenticator((u) => [u.user]);

  const onDrop = async (acceptedFiles: File[]) => {
    await uploadFiles(acceptedFiles);
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: onDrop,
    accept: {
      "application/pdf": [],
      "text/markdown": [],
      "text/plain": [],
      "text/csv": [],
      "application/json": [],
    },
  });

  const uploadText = async () => {
    if (!user || usage.isZero || !textAreaRef.current?.value) {
      return;
    }
    setIsUploadingDocuments(true);
    setIsDocumentUploaderOpen(false);
    try {
      const markdown = await convertTextToMarkdown(textAreaRef.current.value);
      const file = new File([markdown.content], markdown.title, {
        type: "text/markdown",
      });
      await uploadFiles([file]);
    } finally {
      setIsUploadingDocuments(false);
    }
  };

  return (
    <Dialog
      open={isDocumentUploaderOpen}
      onOpenChange={setIsDocumentUploaderOpen}
    >
      <DialogTrigger className="focus:outline-none" disabled={usage.isZero}>
        <CirclePlus
          size={20}
          className={cn(
            "focus:outline-none cursor-pointer",
            usage.isZero ? "opacity-50 cursor-not-allowed" : ""
          )}
        />
      </DialogTrigger>
      <DialogContent className="max-w-4xl p-6">
        <DialogHeader>
          <DialogTitle className="text-2xl">
            {t("documentUploader.addDocuments")}
          </DialogTitle>
          <DialogDescription className="text-lg">
            {t("documentUploader.addDocumentsDescription")}
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-4">
          <textarea
            className="w-full h-80 p-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            ref={textAreaRef}
            placeholder={t("documentUploader.enterText")}
            disabled={usage.isZero}
          />
          <div
            {...getRootProps()}
            className={`flex items-center justify-center p-10 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${
              isDragActive ? "border-blue-500 bg-blue-50" : "border-gray-300"
            }`}
          >
            <input {...getInputProps()} disabled={usage.isZero} />
            <p className="text-gray-500">
              {isDragActive
                ? t("documentUploader.dropFiles")
                : t("documentUploader.dragAndDropFiles")}
            </p>
          </div>
        </div>
        <DialogFooter className="flex justify-end">
          <UsageTooltip usage={usage}>
            <Button onClick={uploadText} disabled={usage.isZero}>
              {t("documentUploader.add")}
            </Button>
          </UsageTooltip>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}