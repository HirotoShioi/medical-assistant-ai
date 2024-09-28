import { ClipboardPlus, FilePlus2, PenSquareIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState, useRef, useEffect, useCallback } from "react";
import { useChatContext } from "@/pages/chat/context";
import { UsageTooltip } from "@/components/usage-tooltip";
import { useAuthenticator } from "@aws-amplify/ui-react";
import { useTranslation } from "react-i18next";
import { useMessageCreateMutation } from "@/services/messages/mutations";
import { cn } from "@/lib/utils";
import { Tooltip } from "@/components/tooltip";
import { useAlert } from "@/components/alert";

function ChatInput() {
  const { chatHook, usage, setIsDocumentUploaderOpen } = useChatContext();
  const [isFocused, setIsFocused] = useState(false);

  return (
    <div
      className={cn(
        "p-2 bg-muted lg:gap-1 rounded-xl border-2 shadow-md w-full transition-colors duration-200 ease-in-out",
        isFocused ? "border-blue-500" : "border-gray-300"
      )}
    >
      <ChatInputForm setIsFocused={setIsFocused} />
      <div className="flex justify-between">
        <div className="flex items-end gap-2 w-full">
          <Tooltip content="ファイルをアップロード">
            <Button
              className="p-2 rounded-lg h-8 w-8 border-0"
              onClick={() => setIsDocumentUploaderOpen(true)}
              size="icon"
              disabled={usage.isZero}
            >
              <FilePlus2 size={16} />
              <span className="sr-only">ファイルをアップロード</span>
            </Button>
          </Tooltip>
          <DocumentGenerationButton />
        </div>
        <div className="relative">
          <UsageTooltip usage={usage}>
            <Button
              type="button"
              onClick={() => document.getElementById("chat-submit")?.click()}
              disabled={
                chatHook.isLoading || chatHook.input.length <= 0 || usage.isZero
              }
              className={cn(
                "rounded-lg p-2 w-8 h-8",
                chatHook.isLoading || chatHook.input.length <= 0 || usage.isZero
                  ? "opacity-50 cursor-not-allowed"
                  : ""
              )}
              size="icon"
            >
              <PenSquareIcon className="h-4 w-4" />
              <span className="sr-only">Submit</span>
            </Button>
          </UsageTooltip>
        </div>
      </div>
    </div>
  );
}

function DocumentGenerationButton() {
  const { usage } = useChatContext();
  const { openAlert } = useAlert();
  function handleClick() {
    openAlert({
      title: "ドキュメント生成",
      description:
        "提供されたドキュメント、及びチャット履歴からドキュメントを生成します。生成には時間がかかる場合があります。",
      actions: [
        {
          label: "キャンセル",
          variant: "cancel",
          onClick: () => {},
        },
        {
          label: "生成",
          onClick: () => {},
        },
      ],
    });
  }
  return (
    <Tooltip content="ドキュメントを生成">
      <Button
        className="mr-2 p-2 rounded-lg h-8 w-8 border-0"
        onClick={handleClick}
        size="icon"
        disabled={usage.isZero}
      >
        <ClipboardPlus size={16} />
        <span className="sr-only">ドキュメントを生成</span>
      </Button>
    </Tooltip>
  );
}

interface ChatInputFormProps {
  setIsFocused: (isFocused: boolean) => void;
}

function ChatInputForm({ setIsFocused }: ChatInputFormProps) {
  const { t } = useTranslation();
  const { chatHook, usage, thread, scrollToEnd } = useChatContext();
  const [isComposing, setIsComposing] = useState(false);
  const [rows, setRows] = useState(1);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { user } = useAuthenticator((context) => [context.user]);
  const { mutateAsync: saveMessage } = useMessageCreateMutation();

  const calculateRows = useCallback(() => {
    if (textareaRef.current) {
      const lineHeight = 30;
      const maxLines = 10;
      const charsPerLine = Math.floor(textareaRef.current.clientWidth / 16);
      const lines = chatHook.input
        .split("\n")
        .reduce(
          (total, line) => total + Math.ceil(line.length / charsPerLine),
          0
        );
      setRows(Math.min(maxLines, Math.max(1, lines)));
      textareaRef.current.style.height = `${
        Math.min(maxLines, Math.max(1, lines)) * lineHeight
      }px`;
    }
  }, [chatHook.input]);

  useEffect(() => {
    calculateRows();
  }, [chatHook.input, calculateRows]);

  useEffect(() => {
    const handleResize = () => {
      calculateRows();
    };

    const resizeDebounce = setTimeout(() => {
      window.addEventListener("resize", handleResize);
    }, 300);

    return () => {
      clearTimeout(resizeDebounce);
      window.removeEventListener("resize", handleResize);
    };
  }, [calculateRows]);

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    chatHook.handleInputChange(e);
  };

  const handleFocus = () => setIsFocused(true);
  const handleBlur = () => setIsFocused(false);
  const submitMessage = async (input: string) => {
    if (!user || input.length <= 0) return;

    await saveMessage({
      role: "user",
      content: input,
      threadId: thread.id,
    });
    scrollToEnd();
    chatHook.handleSubmit();
  };

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        submitMessage(chatHook.input);
      }}
      className="w-full"
    >
      <textarea
        ref={textareaRef}
        className={cn(
          "w-full bg-muted rounded-lg border-0 focus:outline-none focus:ring-0 resize-none h-full",
          chatHook.isLoading || usage.isZero
            ? "cursor-not-allowed opacity-50"
            : ""
        )}
        style={{ minHeight: "20px" }}
        placeholder={t("chatInput.placeholder")}
        onChange={handleTextareaChange}
        disabled={chatHook.isLoading || usage.isZero}
        onCompositionStart={() => setIsComposing(true)}
        onCompositionEnd={() => setIsComposing(false)}
        onFocus={handleFocus}
        onBlur={handleBlur}
        id="chat-input"
        onKeyDown={(e) => {
          if (e.key === "Enter" && e.shiftKey) {
            return;
          }
          if (usage.isZero) {
            return;
          }
          if (e.key === "Enter" && !isComposing) {
            e.preventDefault();
            document.getElementById("chat-submit")?.click();
          }
        }}
        value={chatHook.input}
        tabIndex={0}
        rows={rows}
      />
      <button type="submit" id="chat-submit" className="hidden"></button>
    </form>
  );
}

export default ChatInput;
