import { getModel } from "@/lib/ai/model";
import { generateSection, GenerateSectionParams } from "./section-generator";
import { PromptTemplate } from "@langchain/core/prompts";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { getResourcesByThreadId } from "@/services/resources/service";
import { getMessagesByThreadId } from "@/services/messages/services";

type GenerateDocumentConfig = Omit<GenerateDocumentParams, "threadId">;
type GenerateDocumentParams = {
  title: string;
  prompt: string;
  description: string;
  threadId: string;
  sectionGeneratorParam: Omit<
    GenerateSectionParams,
    "threadId" | "resourceSummaries" | "messages"
  >[];
};

async function generateDocument(params: GenerateDocumentParams) {
  const { threadId, prompt, sectionGeneratorParam } = params;
  const messages = await getMessagesByThreadId(threadId);
  const resources = await getResourcesByThreadId(threadId);
  const sections = await Promise.all(
    sectionGeneratorParam.map((section) =>
      generateSection({
        ...section,
        threadId,
        messages,
        resourceSummaries: resources,
      })
    )
  );
  const model = await getModel({
    model: "gpt-4o",
    temperature: 0,
  });
  const prompTemplate = PromptTemplate.fromTemplate(`
    {prompt}

    <sections>
    {sections}
    </sections>

    # 注意点
    - セクションのテキストのみを使用してください。
    - 文章の構成は厳格に守ってください。余計な文章を追加したり、削除したりしないでください。
    - もし、セクションのテキストが不足している場合、どの情報が必要であるかを明確に示してください。
    `);
  const chain = prompTemplate.pipe(model).pipe(new StringOutputParser());
  const result = await chain.invoke({
    prompt: prompt,
    sections: sections.join("\n"),
  });
  return result;
}

export { generateDocument };
export type { GenerateDocumentParams, GenerateDocumentConfig };
