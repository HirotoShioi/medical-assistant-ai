import { useRef, useState } from "react";
import { useDropzone } from "react-dropzone";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogHeader,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { File } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useChatContext } from "@/pages/chat/context";
import { UsageTooltip } from "@/components/usage-tooltip";
import { useTranslation } from "react-i18next";
import { useAuthenticator } from "@aws-amplify/ui-react";

const FilePreview = ({ file }: { file: File }) => {
  switch (file.type) {
    case "image/png":
    case "image/jpeg":
    case "image/jpg":
      return (
        <img
          src={URL.createObjectURL(file)}
          alt={file.name}
          width={100}
          height={100}
          className="max-w-full h-auto"
        />
      );
    default:
      return (
        <div className="flex items-center gap-2">
          <File size={20} />
          {file.name}
        </div>
      );
  }
};

export default function ResourceUploader() {
  const {
    isResourceUploaderOpen,
    setIsResourceUploaderOpen,
    usage,
    uploadText,
    uploadFiles,
  } = useChatContext();
  const { t } = useTranslation();
  const textAreaRef = useRef<HTMLTextAreaElement>(null);
  const { user } = useAuthenticator((u) => [u.user]);

  // プレビューファイルの状態を配列に変更
  const [previewFiles, setPreviewFiles] = useState<File[]>([]);

  // onDropAccepted 関数に名前を変更し、複数ファイルに対応
  const onDropAccepted = async (acceptedFiles: File[]) => {
    setPreviewFiles(acceptedFiles);
  };

  // FIXME: なぜかファイル選択でマークダウンを選択するとプレビューが表示されない
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDropAccepted, // onDrop から onDropAccepted に変更
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
    if (!user || usage.isZero) {
      return;
    }
    if (textAreaRef.current?.value) {
      uploadText(textAreaRef.current.value);
    }

    if (previewFiles.length > 0) {
      uploadFiles(previewFiles);
    }
    setIsResourceUploaderOpen(false);
    setPreviewFiles([]); // プレビューをクリア
  };

  return (
    <Dialog
      open={isResourceUploaderOpen}
      onOpenChange={(open) => {
        setIsResourceUploaderOpen(open);
        if (!open) setPreviewFiles([]); // ダイアログが閉じられたときにプレビューをクリア
      }}
    >
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
          {previewFiles.length > 0 && (
            <div className="mt-4">
              <h3 className="text-lg font-semibold mb-2">
                {t("resourceUploader.uploadedFiles")}
              </h3>
              {previewFiles.map((file, index) => (
                <FilePreview key={index} file={file} />
              ))}
            </div>
          )}
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
