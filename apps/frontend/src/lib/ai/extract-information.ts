import { BASE_CHAT_MODEL } from "@/constants";
import { getModel } from "./model";
import { Message } from "ai/react";
import { Document } from "@/models";
import { PromptTemplate } from "@langchain/core/prompts";
import { codeBlock } from "common-tags";
import { StringOutputParser } from "@langchain/core/output_parsers";

export async function summarizeChat(
  messages: Message[],
  documents: Document[]
) {
  const cleanedData = await cleanseData(messages, documents);
  const model = await getModel({
    model: BASE_CHAT_MODEL,
    temperature: 0,
  });
  const template = PromptTemplate.fromTemplate(codeBlock`
    You are a medical data analysis assistant. Based on the following data, provide a concise summary focused on the key medical information, including but not limited to the patient's symptoms, diagnosis, treatment recommendations, and any relevant history or lab results.

    *** START OF DATA ***
    {data}
    *** END OF DATA ***
  `);
  return template
    .pipe(model)
    .pipe(new StringOutputParser())
    .invoke({ data: cleanedData });
}

// 会話履歴から、不要な情報を削除する
async function cleanseData(messages: Message[], documents: Document[]) {
  const model = await getModel({
    model: BASE_CHAT_MODEL,
    temperature: 0,
  });
  const template = PromptTemplate.fromTemplate(codeBlock`
    You are an assistant tasked with cleaning the following medical data. 
    Your job is to:
    1. Remove any duplicate information. Information that are similar but on a different day or time should not be removed.
    2. Discard any information that is irrelevant to the patient's symptoms, diagnosis, or treatment.
    3. Focus on clinical data that could assist healthcare professionals.
    4. Remove any information that could be a hallucination or made up by the assistant.

    Here is the data:

    *** START OF CHAT ***
    {messages}
    *** END OF CHAT ***

    *** START OF DOCUMENTS ***
    {documents}
    *** END OF DOCUMENTS ***
  `);
  // role: 内容となるように整形する
  const concatChat = (messages: Message[]) => {
    return messages.map((m) => `${m.role}: ${m.content}`).join("\n");
  };

  // **Title** \n
  // - 内容 \n
  // となるように整形する
  const concatDocuments = (documents: Document[]) => {
    return documents.map((d) => `**${d.title}** \n\n ${d.content}`).join("\n");
  };

  const chain = template.pipe(model).pipe(new StringOutputParser());
  return chain.invoke({
    messages: concatChat(messages),
    documents: concatDocuments(documents),
  });
}
