import { XIcon, FileIcon, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Resource } from "@/models";
import { useMemo, useState } from "react";
import { ScrollArea } from "@radix-ui/react-scroll-area";
import { Markdown } from "@/components/markdown";
import ResourceUploader from "./resource-uploader";
import { useChatContext } from "@/pages/chat/context";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { Logo } from "@/components/logo";
import { useTranslation } from "react-i18next";
import { useResourceDeleteMutation } from "@/services/resources/mutations";
import { useToast } from "@/hooks/use-toast";

function ResourceItem({
  document,
  onSelect,
}: {
  document: Resource;
  onSelect: (document: Resource) => void;
}) {
  const deleteDocument = useResourceDeleteMutation();
  const { toast } = useToast();
  const { t } = useTranslation();
  async function handleDelete(e: React.MouseEvent<HTMLButtonElement>) {
    e.stopPropagation();
    deleteDocument.mutate(document.id, {
      onSuccess: () => {
        toast({
          title: t("documentPanel.deleteSuccess"),
          variant: "info",
          description: t("documentPanel.deleteSuccessDescription"),
        });
      },
      onError: () => {
        toast({
          title: t("documentPanel.deleteError"),
          description: t("documentPanel.deleteErrorDescription"),
        });
      },
    });
  }
  return (
    <div
      className="flex items-center p-2 bg-white rounded-lg shadow-md border hover:bg-gray-50 transition cursor-pointer w-full"
      onClick={() => onSelect(document)}
    >
      <div className="flex-shrink-0 w-10 h-10 flex items-center justify-center">
        <FileIcon className="w-6 h-6 text-gray-600" />
      </div>
      <div className="flex-1 flex items-center overflow-hidden">
        <p className="text-sm font-medium truncate">{document.title}</p>
      </div>
      <Button
        className="text-gray-400 hover:text-red-600 w-8 h-8 rounded-full hover:bg-gray-200"
        size="icon"
        onClick={(e) => handleDelete(e)}
        variant="ghost"
      >
        <XIcon className="w-4 h-4" />
      </Button>
    </div>
  );
}

function ResourceItemSkeleton() {
  return (
    <div className="flex items-center p-2 bg-white rounded-lg shadow-md border w-full">
      <Skeleton className="w-10 h-10 rounded-lg mr-3" />
      <Skeleton className="flex-1 h-5" />
      <Skeleton className="w-8 h-8 rounded-full ml-2" />
    </div>
  );
}

function ResourceList({
  documents,
  onSelect,
}: {
  documents: Resource[];
  onSelect: (document: Resource) => void;
}) {
  const { t } = useTranslation();
  if (documents.length === 0) {
    return (
      <div className="flex flex-row items-center justify-center px-2 gap-4">
        <FileIcon className="w-8 h-8 text-gray-500" />
        <p className="text-gray-500 text-sm mt-2">
          {t("documentPanel.dragAndDropFiles")}
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2 w-full px-4">
      {documents.map((document, index) => (
        <ResourceItem key={index} document={document} onSelect={onSelect} />
      ))}
    </div>
  );
}

function ResourceListSkeleton() {
  return (
    <div className="flex flex-col gap-2 w-full px-4">
      {[...Array(5)].map((_, index) => (
        <ResourceItemSkeleton key={index} />
      ))}
    </div>
  );
}

function Resources({ document }: { document: Resource }) {
  const rendered = useMemo(() => {
    switch (document.fileType) {
      case "text/plain":
        return <p className="whitespace-pre-wrap">{document.content}</p>;
      case "text/markdown":
        return <Markdown content={document.content} />;
      case "application/json":
        return (
          <div className="bg-gray-100 p-2 rounded-md">
            <code className="whitespace-pre-wrap">{document.content}</code>
          </div>
        );
      default:
        return <p className="whitespace-pre-wrap">{document.content}</p>;
    }
  }, [document.content, document.fileType]);
  return (
    <ScrollArea className="h-[calc(100vh-6rem)]">
      <div className="px-4 pb-4">{rendered}</div>
    </ScrollArea>
  );
}

function Header({
  document,
  onClose,
}: {
  document: Resource | null;
  onClose: () => void;
}) {
  const { t } = useTranslation();
  if (!document) {
    return (
      <div className="sticky">
        <div className="pb-4 top-0 p-2 flex items-center">
          <Logo />
        </div>
        <div className="flex justify-between items-center px-4">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold">
              {t("documentPanel.documents")}
            </h2>
            <ResourceUploader />
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="flex gap-2 flex-row w-full px-4 pt-4">
        <div className="flex-1 flex items-center overflow-hidden">
          <h2 className="text-lg font-semibold truncate">{document.title}</h2>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="rounded-full"
        >
          <X className="h-6 w-6" />
        </Button>
      </div>
    </>
  );
}

export function ResourcePanel() {
  const [selectedResource, setSelectedResource] = useState<Resource | null>(
    null
  );
  const {
    panelState,
    setPanelState,
    resources: documents,
    isSmallScreen,
    isUploadingResources: isUploadingDocuments,
  } = useChatContext();

  const panelWidth = isSmallScreen
    ? "100%"
    : panelState === "detail"
    ? "700px"
    : "300px";

  function setResource(document: Resource) {
    setSelectedResource(document);
    setPanelState("detail");
  }

  const handleClose = () => {
    if (selectedResource) {
      setSelectedResource(null);
      setPanelState("list");
    } else {
      setPanelState("closed");
    }
  };

  const isHidden = isSmallScreen || panelState === "closed";

  return (
    <div className={`z-[5] pointer-events-auto ${isHidden ? "hidden" : ""}`}>
      <div
        className={cn(
          "h-full shadow-md relative",
          panelState === "detail" ? "bg-white" : "bg-gray-50"
        )}
        style={{ width: panelWidth }}
      >
        <div className="flex flex-col gap-4">
          <Header document={selectedResource} onClose={handleClose} />
          <div className="overflow-hidden">
            <div className="w-full overflow-y-auto h-full">
              {isUploadingDocuments ? (
                <ResourceListSkeleton />
              ) : selectedResource ? (
                <Resources document={selectedResource} />
              ) : (
                <ResourceList documents={documents} onSelect={setResource} />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
