import { BASE_MODEL } from "@/constants";
import { getModel } from "@/lib/ai/model";
import { PromptTemplate } from "@langchain/core/prompts";
import { z } from "zod";
import { Message } from "ai";
import { concatMessage } from "@/lib/ai/util";
import { getResourceByIds } from "@/services/resources/service";
import { StringOutputParser } from "@langchain/core/output_parsers";

type ResourceSummary = {
  id: string;
  summary: string;
};

type GenerateSectionParams = {
  title: string;
  example: string;
  systemMessage: string;
  messages: Message[];
  threadId: string;
  resourceSummaries: ResourceSummary[];
};

class SectionGenerator {
  readonly title: string;
  readonly example: string;
  readonly systemMessage: string;
  readonly messages: Message[];
  readonly resourceSummaries: ResourceSummary[];
  readonly threadId: string;

  constructor({
    title,
    example,
    systemMessage,
    messages,
    threadId,
    resourceSummaries,
  }: GenerateSectionParams) {
    this.title = title;
    this.example = example;
    this.systemMessage = systemMessage;
    this.messages = messages;
    this.threadId = threadId;
    this.resourceSummaries = resourceSummaries;
  }

  private async getModel() {
    return getModel({ model: BASE_MODEL, temperature: 0 });
  }

  private concatResourceSummaries(resourceSummaries: ResourceSummary[]): string {
    return resourceSummaries
      .map((resource) => `- ${resource.id}: ${resource.summary}`)
      .join("\n");
  }

  private async selectResources() {
    const model = await this.getModel();

    const modelWithSchema = model.withStructuredOutput(
      z.object({ resourceIds: z.array(z.string()) })
    );

    const prompt = `
あなたは優秀なアシスタントです。

以下はリソースのリストです:

{resourceSummaries}

セクション「{title}」の作成に関連するリソースIDを選択してください。

関連するリソースIDを配列として返してください。

他の情報は一切含めないでください。
    `;

    const promptTemplate = PromptTemplate.fromTemplate(prompt)
    const { resourceIds } = await promptTemplate.pipe(modelWithSchema).invoke({
      title: this.title,
      resourceSummaries: this.concatResourceSummaries(this.resourceSummaries),
    });

    return resourceIds;
  }

  private async retrieveInformation(resourceIds: string[]) {
    const resources = await getResourceByIds(resourceIds);
    return resources.map(({ content }) => content);
  }

  private async extractInformation(contents: string[]): Promise<string> {
    const model = await this.getModel();

    const prompt = `
あなたは優秀なアシスタントです。

以下はドキュメントの内容です:

{contents}

セクション「{title}」の作成に必要な情報を、上記のドキュメントから抜き出してください。

- 重要なポイントやキーフレーズを含めてください。
- 出力はプレーンテキストで提供し、他の情報は含めないでください。
    `;

    const promptTemplate = PromptTemplate.fromTemplate(prompt)

    const result = await promptTemplate
      .pipe(model)
      .pipe(new StringOutputParser())
      .invoke({
        title: this.title,
        contents: contents.join("\n"),
      });

    return result;
  }

  private async generatePrompt(content: string): Promise<string> {
    const model = await this.getModel();

    const prompt = `
あなたは優秀なアシスタントです。

以下はセクション「{title}」の作成に必要な情報です:

{content}

以下はチャット履歴です:

{messages}

この情報とチャット履歴を基に、セクションを生成するためのプロンプトを作成してください。

- LLMが誤った情報を生成しないよう、必要なコンテキストや制約を含めてください。
- プロンプトは簡潔で具体的な指示であるべきです。
- 出力はプロンプトのテキストのみを含めてください。他の情報は含めないでください。
    `;

    const promptTemplate = PromptTemplate.fromTemplate(prompt)
    const result = await promptTemplate
      .pipe(model)
      .pipe(new StringOutputParser())
      .invoke({
        title: this.title,
        content,
        messages: concatMessage(this.messages),
      });

    return result;
  }

  private async generateSection(prompt: string, content: string): Promise<string> {
    const model = await this.getModel();

    const fullPrompt = `
あなたは優秀なアシスタントです。

以下はセクション「{title}」の作成に必要な情報です:

{content}

以下のプロンプトに従って、セクションを生成してください。

プロンプト:

{prompt}

- 上記の情報を基に、セクションを生成してください。
- 出力はセクションのテキストのみを含め、他の情報は含めないでください。
    `;

    const promptTemplate = PromptTemplate.fromTemplate(fullPrompt)

    const result = await promptTemplate
      .pipe(model)
      .pipe(new StringOutputParser())
      .invoke({
        title: this.title,
        content,
        prompt,
      });

    return result;
  }

  async generate() {
    const resourceIds = await this.selectResources();
    const contents = await this.retrieveInformation(resourceIds);
    const extractedContent = await this.extractInformation(contents);
    const prompt = await this.generatePrompt(extractedContent);
    return this.generateSection(prompt, extractedContent);
  }
}

async function generateSection(config: GenerateSectionParams) {
  const sectionGenerator = new SectionGenerator(config);
  return sectionGenerator.generate();
}

export type { GenerateSectionParams, ResourceSummary };
export { generateSection };
