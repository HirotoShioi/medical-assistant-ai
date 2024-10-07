import { BASE_MODEL } from "@/constants";
import { ChatOpenAI, ChatOpenAIFields } from "@langchain/openai";
import { fetchAuthSession } from "aws-amplify/auth";

export async function getModel(options?: Partial<ChatOpenAIFields>) {
  const session = await fetchAuthSession();
  if (!session.tokens?.idToken) {
    throw new Error("No session");
  }
  return new ChatOpenAI(
    {
      ...options,
      model: options?.model ?? BASE_MODEL,
      maxRetries: options?.maxRetries ?? 0,
      temperature: options?.temperature ?? 0,
      apiKey: session.tokens.idToken.toString(),
    },
    {
      baseURL: import.meta.env.VITE_API_URL,
    }
  );
}
