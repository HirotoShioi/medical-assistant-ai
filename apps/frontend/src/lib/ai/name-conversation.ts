import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { getModel } from "./model";

/**
 * Names a conversation.
 * @param message The message to name the conversation.
 * @returns The name of the conversation.
 */
export async function nameConversation(message: string): Promise<string> {
  const model = await getModel({
    temperature: 0.5,
  });
  const messages = [
    new SystemMessage("You are a helpful assistant."),
    new HumanMessage(message),
    new HumanMessage(
      "Gives the conversation a short and concise name. Parentesis are not needed."
    ),
  ];
  const chain = model.pipe(new StringOutputParser());
  return chain.invoke(messages);
}
