import { getModel } from "./model";
import { Message } from "ai/react";
import { Resource } from "@/models";
import { PromptTemplate } from "@langchain/core/prompts";
import { codeBlock } from "common-tags";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { z } from "zod";
import { concatMessage } from "./util";

type GenerateDocumentParams = {
  documentGenerationPrompt?: string;
  messages: Message[];
  documents: Resource[];
};

export async function generateDocument({
  documentGenerationPrompt,
  messages,
  documents,
}: GenerateDocumentParams) {
  const [cleanedData, { requests }] = await Promise.all([
    cleanseData(messages, documents),
    extractRequests(messages),
  ]);
  const model = await getModel();
  const instructions =
    documentGenerationPrompt ??
    codeBlock`
    Focus on key medical information, including but not limited to:
    - Patient's symptoms
    - Diagnosis
    - Treatment recommendations
    - Relevant medical history
    - Lab results`;

  const template = PromptTemplate.fromTemplate(codeBlock`
    You are a medical report generation specialist specialized in generating medical reports. Your task is to create a concise report based **only** on the data provided below. Do not include any information that is not present in the data. Avoid any assumptions or fabrications.

    {instructions}

    **Important Instructions**:
    - Use **only** the data provided between *** START OF DATA *** and *** END OF DATA ***.
    - Do not add any information or make assumptions beyond the provided data.
    - Follow any specific requests from the user as listed below.
    - Present the information in a clear and professional manner suitable for healthcare professionals.

    The user's requests are as follows:
    {requests}

    *** START OF DATA ***
    {data}
    *** END OF DATA ***
  `);
  return template
    .pipe(model)
    .pipe(new StringOutputParser())
    .invoke({
      data: cleanedData,
      requests: requests?.join("\n") ?? "",
      instructions,
    });
}

// 会話履歴から、ユーザーのリクエストを抽出する
async function extractRequests(messages: Message[]) {
  const model = await getModel();
  const schema = z.object({
    requests: z.array(z.string()).nullable(),
  });
  const modelWithSchema = model.withStructuredOutput(schema);
  const template = PromptTemplate.fromTemplate(codeBlock`
  You are a medical data analysis assistant.
  Your task is to extract the **user's specific requests** regarding how the medical report should be generated from the chat history below.

  **Instructions**:
  - Only extract the user's requests or instructions related to the report generation.
  - Do not include any other information or conversation.
  - Present each request as a bullet point in a numbered list.

  Only return the requests. Do not include any explanations or additional commentary.

  *** START OF CHAT ***
  {messages}
  *** END OF CHAT ***
  `);
  return template
    .pipe(modelWithSchema)
    .invoke({ messages: concatMessage(messages) });
}

// 会話履歴から、不要な情報を削除する
async function cleanseData(messages: Message[], documents: Resource[]) {
  const model = await getModel();
  const template = PromptTemplate.fromTemplate(codeBlock`
  You are an assistant tasked with cleaning the following medical data for report generation. Your job is to process the data carefully, following these instructions:

  **Instructions**:
  1. **Remove duplicate information**: If the same information appears multiple times, keep only one instance. However, if similar information is recorded on different dates or times, retain them all.
  2. **Discard irrelevant information**: Exclude any data that is not directly related to the patient's symptoms, diagnosis, treatment, or relevant medical history.
  3. **Focus on clinical data**: Ensure that the remaining data is clinically significant and would assist healthcare professionals in understanding the patient's condition.
  4. **Avoid fabrications**: Do not add, infer, or fabricate any information. Only use the data provided.

  **Output Format**:
  - Present the cleaned data in a clear and organized manner.
  - Use headings and bullet points where appropriate.
  - Do not include any explanations, comments, or additional text outside of the data.

  **Data Sources**:

  *** START OF CHAT MESSAGES ***
  {messages}
  *** END OF CHAT MESSAGES ***

  *** START OF DOCUMENTS ***
  {documents}
  *** END OF DOCUMENTS ***
  `);
  // role: 内容となるように整形する

  // **Title** \n
  // - 内容 \n
  // となるように整形する
  const concatDocuments = (documents: Resource[]) => {
    return documents.map((d) => `**${d.title}** \n\n ${d.content}`).join("\n");
  };

  const chain = template.pipe(model).pipe(new StringOutputParser());
  return chain.invoke({
    messages: concatMessage(messages),
    documents: concatDocuments(documents),
  });
}
