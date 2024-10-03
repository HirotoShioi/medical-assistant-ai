import { Message } from "ai/react";
import {
  AIMessage,
  BaseMessage,
  HumanMessage,
  SystemMessage,
  ToolMessage,
} from "@langchain/core/messages";
import { ToolInvocation } from "ai";

export function convertToLangchainMessage(messages: Message[]): BaseMessage[] {
  return messages.map((message) => toLangChainMessage(message)).flat();
}

function toLangChainMessage(message: Message): BaseMessage[] {
  switch (message.role) {
    case "user":
      return [new HumanMessage({ content: message.content, id: message.id })];
    case "system":
      return [new SystemMessage({ content: message.content, id: message.id })];
    case "assistant": {
      if (message.content.length > 0) {
        return [new AIMessage({ content: message.content, id: message.id })];
      }
      if (!message.toolInvocations || message.toolInvocations.length <= 0) {
        return [];
      }
      return message.toolInvocations.map(toToolMessage);
    }
    case "tool": {
      if (!message.toolInvocations) {
        return [];
      }
      return message.toolInvocations.map(toToolMessage);
    }
    case "data": {
      return [new HumanMessage(message.content)];
    }
    default:
      return [];
  }
}

function toToolMessage(toolInvocation: ToolInvocation): ToolMessage {
  switch (toolInvocation.state) {
    case "result":
      return new ToolMessage({
        id: toolInvocation.toolCallId,
        content: toolInvocation.result,
        tool_call_id: toolInvocation.toolCallId,
        name: toolInvocation.toolName,
      });
    // 以下は呼ばれない想定
    case "call":
      return new ToolMessage({
        id: toolInvocation.toolCallId,
        content: toolInvocation.args,
        additional_kwargs: toolInvocation.args,
        tool_call_id: toolInvocation.toolCallId,
        name: toolInvocation.toolName,
      });
    case "partial-call":
    default:
      return new ToolMessage({
        id: toolInvocation.toolCallId,
        content: toolInvocation.args,
        tool_call_id: toolInvocation.toolCallId,
        name: toolInvocation.toolName,
      });
  }
}

export function concatMessage(messages: Message[]): string {
  return messages.map((m) => `${m.role}: ${m.content}`).join("\n");
}
