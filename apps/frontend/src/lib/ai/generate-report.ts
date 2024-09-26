import { BASE_CHAT_MODEL } from "@/constants";
import { getModel } from "./model";
import { Message } from "ai/react";
import { Document } from "@/models";
import { PromptTemplate } from "@langchain/core/prompts";
import { codeBlock } from "common-tags";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { z } from "zod";

export async function generateReport(
  messages: Message[],
  documents: Document[]
) {
  const [cleanedData, { requests }] = await Promise.all([
    cleanseData(messages, documents),
    extractRequests(messages),
  ]);
  const model = await getModel({
    model: BASE_CHAT_MODEL,
    temperature: 0,
  });
  const template = PromptTemplate.fromTemplate(codeBlock`
    You are a medical data analysis assistant. Based on the following data, provide a concise report focused on the key medical information, including but not limited to the patient's symptoms, diagnosis, treatment recommendations, and any relevant history or lab results.

    *** START OF DATA ***
    {data}
    *** END OF DATA ***

    The user's requests are as follows:
    {requests}
  `);
  return template
    .pipe(model)
    .pipe(new StringOutputParser())
    .invoke({ data: cleanedData, requests: requests?.join("\n") ?? "" });
}

// 会話履歴から、ユーザーのリクエストを抽出する
async function extractRequests(messages: Message[]) {
  const model = await getModel({
    model: BASE_CHAT_MODEL,
    temperature: 0,
  });
  const schema = z.object({
    requests: z.array(z.string()).nullable(),
  });
  const modelWithSchema = model.withStructuredOutput(schema);
  const template = PromptTemplate.fromTemplate(codeBlock`
    You are a medical data analysis assistant.
    Your job is to extract the user's requests from the following chat history about how the report should be generated.
    The requests will then be passed to a report generation assistant.

    Only return the requests, no any explanation or commentary.

    *** START OF CHAT ***
    {messages}
    *** END OF CHAT ***
  `);
  return template
    .pipe(modelWithSchema)
    .invoke({ messages: concatMessage(messages) });
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

    Only return the data, no any explanation or commentary.

    Here is the data:

    *** START OF CHAT ***
    {messages}
    *** END OF CHAT ***

    *** START OF DOCUMENTS ***
    {documents}
    *** END OF DOCUMENTS ***
  `);
  // role: 内容となるように整形する

  // **Title** \n
  // - 内容 \n
  // となるように整形する
  const concatDocuments = (documents: Document[]) => {
    return documents.map((d) => `**${d.title}** \n\n ${d.content}`).join("\n");
  };

  const chain = template.pipe(model).pipe(new StringOutputParser());
  return chain.invoke({
    messages: concatMessage(messages),
    documents: concatDocuments(documents),
  });
}

const concatMessage = (messages: Message[]) => {
  return messages.map((m) => `${m.role}: ${m.content}`).join("\n");
};
