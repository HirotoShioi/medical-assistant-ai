import { Message } from "ai/react";
import { Markdown } from "@/components/markdown";
import { ToolNames } from "@/hooks/use-chat";
import { useTranslation } from "react-i18next";
import { memo } from "react";

type ToolInvocation = {
  toolCallId: string;
  toolName: string;
  args: Record<string, any>;
};

function ToolMessage({ toolInvocation }: { toolInvocation: ToolInvocation }) {
  const { t } = useTranslation();
  const message = () => {
    switch (toolInvocation.toolName as ToolNames) {
      case "getRelavantInformation":
        return t("toolMessage.searchingInformation");
      case "embedResource":
        return t("toolMessage.embeddingResources");
      case "generateDocument":
        return t("toolMessage.generatingDocument");
      case "searchWeb":
        return t("toolMessage.searchingWeb");
      case "searchMedicine":
        return t("toolMessage.searchingMedicine");
      default:
        return t("toolMessage.processing");
    }
  };
  return (
    <div className="self-stretch text-xs flex gap-3 justify-center items-center text-neutral-400 before:h-[1px] before:flex-grow before:bg-neutral-300 after:h-[1px] after:flex-grow after:bg-neutral-300">
      <span>{message()}</span>
    </div>
  );
}

export type ChatMessageProps = {
  message: Message;
  isLast: boolean;
};

function ChatMessage({ message }: ChatMessageProps) {
  if (message.role === "user") {
    return (
      <div className="text-base w-full">
        <div className="flex justify-end w-full">
          <div className="max-w-[70%] rounded-3xl px-5 py-2.5 bg-muted">
            <Markdown content={message.content} />
          </div>
        </div>
      </div>
    );
  }

  if (message.content.length <= 0 && message.toolInvocations) {
    return (
      <div className="md:max-w-3xl xl:max-w-[48rem]">
        <div className="flex text-center w-full">
          <div className="w-full p-4">
            {message.toolInvocations.map((toolInvocation, index) => {
              return (
                <ToolMessage key={index} toolInvocation={toolInvocation} />
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="flex justify-start w-full">
        <div className="w-full p-4">
          <Markdown content={message.content} />
        </div>
      </div>
    </div>
  );
}

// Memoizing is important here - otherwise React continually
// re-renders previous messages unnecessarily (big performance hit)
export default memo(ChatMessage, (prevProps, nextProps) => {
  // Always re-render the last message to fix a bug where `useChat()`
  // doesn't trigger a re-render when multiple tool calls are added
  // to the same message. Otherwise shallow compare.
  // to the same message. Otherwise shallow compare.
  return (
    !nextProps.isLast &&
    prevProps.isLast === nextProps.isLast &&
    prevProps.message === nextProps.message
  );
});
