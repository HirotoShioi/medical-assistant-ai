import { getModel } from "@/lib/ai/model";
import { generateSection, GenerateSectionParams } from "./section-generator";
import { PromptTemplate } from "@langchain/core/prompts";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { getResourcesByThreadId } from "@/services/resources/service";
import { getMessagesByThreadId } from "@/services/messages/services";

type GenerateDocumentConfig = Omit<GenerateDocumentParams, "threadId">;
type GenerateDocumentParams = {
  title: string;
  description: string;
  example: string;
  threadId: string;
  sectionGeneratorParam: Omit<
    GenerateSectionParams,
    "threadId" | "resourceSummaries" | "messages"
  >[];
};

async function generateDocument(params: GenerateDocumentParams) {
  const { threadId, sectionGeneratorParam } = params;
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
  const prompt = PromptTemplate.fromTemplate(`
    You are an expert medical document generator.
    Please combine the following sections into a single document.

    <sections>
    {sections}
    </sections>
    `);
  const chain = prompt.pipe(model).pipe(new StringOutputParser());
  const result = await chain.invoke({
    sections: sections.join("\n"),
  });
  return result;
}

export { generateDocument };
export type { GenerateDocumentParams, GenerateDocumentConfig };
