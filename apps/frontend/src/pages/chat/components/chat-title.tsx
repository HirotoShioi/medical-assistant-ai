import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
  DialogHeader,
  DialogFooter,
} from "@/components/ui/dialog";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { DialogTrigger } from "@radix-ui/react-dialog";
import { ArrowLeft, Pencil } from "lucide-react";
import { useNavigate, useRevalidator } from "react-router";
import { Thread } from "@/models";
import Dropdown from "@/components/dropdown";
import { useChatContext } from "../context";
import { useTranslation } from "react-i18next";
import { useRenameThreadMutation } from "@/services/threads/mutations";

export interface ChatTitleProps {
  thread: Thread;
}

function EditTitle({ thread }: ChatTitleProps) {
  const { t } = useTranslation();
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editedTitle, setEditedTitle] = useState(thread.title);
  const { revalidate } = useRevalidator();
  const { mutate: renameThread } = useRenameThreadMutation();
  const handleSaveTitle = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (editedTitle.trim() === "") return;
    renameThread(
      { threadId: thread.id, title: editedTitle },
      {
        onSettled: () => {
          setIsEditingTitle(false);
          revalidate();
        },
      }
    );
  };

  return (
    <Dialog open={isEditingTitle} onOpenChange={setIsEditingTitle}>
      <DialogTrigger className="focus:outline-none">
        <div className="flex flex-row gap-2 items-center text-gray-600 transition-colors duration-200 group">
          <h1 className="text-lg md:text-xl text-left">{thread.title}</h1>
          <Pencil
            size={18}
            className="cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity duration-200"
          />
        </div>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("chatTitle.renameChat")}</DialogTitle>
          <DialogDescription></DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSaveTitle}>
          <Input
            value={editedTitle}
            onChange={(e) => setEditedTitle(e.target.value)}
            placeholder={t("chatTitle.newTitle")}
            autoFocus
          />
          <button
            type="submit"
            className="hidden"
            id="edit-title-button"
          ></button>
        </form>
        <DialogFooter>
          <Button
            onClick={() =>
              document.getElementById("edit-title-button")?.click()
            }
            variant="outline"
          >
            {t("chatTitle.cancel")}
          </Button>
          <Button
            type="submit"
            onClick={() => {
              document.getElementById("edit-title-button")?.click();
            }}
          >
            {t("chatTitle.save")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function ChatTitle() {
  const { isSmallScreen, thread } = useChatContext();
  const navigate = useNavigate();
  return (
    <header className="md:px-4 py-2 flex justify-between items-center">
      <div className="flex gap-2 items-center">
        {isSmallScreen && (
          <Button
            variant="ghost"
            onClick={() => navigate("/")}
            size="icon"
            className="flex items-center justify-center"
          >
            <ArrowLeft size={20} />
          </Button>
        )}
        <EditTitle thread={thread} />
      </div>
      <Dropdown />
    </header>
  );
}
