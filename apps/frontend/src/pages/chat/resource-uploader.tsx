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

export default function ResourceUploader() {
  const {
    isResourceUploaderOpen,
    setIsResourceUploaderOpen,
    usage,
    uploadFiles,
    uploadText: uploadTextMutation,
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
      "image/png": [],
      "image/jpeg": [],
      "image/jpg": [],
    },
  });

  const handleUploadText = async () => {
    if (!user || usage.isZero || !textAreaRef.current?.value) {
      return;
    }
    setIsResourceUploaderOpen(false);
    await uploadTextMutation(textAreaRef.current.value);
  };

  return (
    <Dialog
      open={isResourceUploaderOpen}
      onOpenChange={setIsResourceUploaderOpen}
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
            {t("resourceUploader.addResources")}
          </DialogTitle>
          <DialogDescription className="text-lg">
            {t("resourceUploader.addResourcesDescription")}
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-4">
          <textarea
            className="w-full h-80 p-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            ref={textAreaRef}
            placeholder={t("resourceUploader.enterText")}
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
                ? t("resourceUploader.dropFiles")
                : t("resourceUploader.dragAndDropFiles")}
            </p>
          </div>
        </div>
        <DialogFooter className="flex justify-end">
          <UsageTooltip usage={usage}>
            <Button onClick={handleUploadText} disabled={usage.isZero}>
              {t("resourceUploader.add")}
            </Button>
          </UsageTooltip>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
