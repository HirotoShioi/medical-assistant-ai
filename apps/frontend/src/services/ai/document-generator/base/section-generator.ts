import { BASE_MODEL } from "@/constants";
import { getModel } from "@/lib/ai/model";
import { PromptTemplate } from "@langchain/core/prompts";
import { codeBlock } from "common-tags";
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
  instructions: string;
  messages: Message[];
  threadId: string;
  resourceSummaries: ResourceSummary[];
};

class SectionGenerator {
  readonly title: string;
  readonly example: string;
  readonly instructions: string;
  readonly messages: Message[];
  readonly resourceSummaries: ResourceSummary[];
  readonly threadId: string;

  constructor({
    title,
    example,
    instructions,
    messages,
    threadId,
    resourceSummaries,
  }: GenerateSectionParams) {
    this.title = title;
    this.example = example;
    this.instructions = instructions;
    this.messages = messages;
    this.threadId = threadId;
    this.resourceSummaries = resourceSummaries;
  }

  private async getModel() {
    return getModel({ model: BASE_MODEL, temperature: 0 });
  }

  private getPrompt() {
    return codeBlock`
# ${this.title}

## 指示
${this.instructions}

## 例
${this.example}
`;
  }

  private async selectResources() {
    const model = await this.getModel();
    const template = PromptTemplate.fromTemplate(`
{prompt}

## チャット履歴
{messages}

## アップロードされたドキュメント
{contents}

## 指示
以下のリストから、セクションの作成に関連するリソースIDを選択してください。

他の情報は一切含めないでください。
`);

    const modelWithSchema = model.withStructuredOutput(
      z.object({ resourceIds: z.array(z.string()) })
    );

    const concatResourceSummaries = (resourceSummaries: ResourceSummary[]) => {
      return resourceSummaries
        .map((resource) => `- ${resource.id}: ${resource.summary}`)
        .join("\n");
    };

    const { resourceIds } = await template.pipe(modelWithSchema).invoke({
      prompt: this.getPrompt(),
      messages: concatMessage(this.messages),
      contents: concatResourceSummaries(this.resourceSummaries),
    });
    return resourceIds;
  }

  private async retrieveInformation(resourceIds: string[]) {
    const resources = await getResourceByIds(resourceIds);
    return resources.map(({ content }) => content);
  }

  private async extractInformation(content: string[]): Promise<string> {
    const model = await this.getModel();
    const template = PromptTemplate.fromTemplate(`
{prompt}

## チャット履歴
{messages}

## ドキュメント
{contents}

## 指示
セクションの作成に必要な情報を、上記のドキュメントから抜き出してください。重要なポイントやキーフレーズを含めてください。出力はプレーンテキストで提供し、他の情報は含めないでください。
`);

    const result = await template
      .pipe(model)
      .pipe(new StringOutputParser())
      .invoke({
        prompt: this.getPrompt(),
        messages: concatMessage(this.messages),
        contents: content.join("\n"),
      });
    return result;
  }

  private async generateSection(prompt: string, content: string) {
    const model = await this.getModel();
    const template = PromptTemplate.fromTemplate(`
{prompt}

## チャット履歴
{messages}

## ドキュメントからの情報
{contents}

## 指示
上記の情報を基に、セクションを生成してください。出力はセクションのテキストのみを含め、他の情報は含めないでください。
`);

    const result = await template
      .pipe(model)
      .pipe(new StringOutputParser())
      .invoke({
        messages: concatMessage(this.messages),
        prompt: prompt,
        contents: content,
      });
    return result;
  }

  private async generatePrompt(content: string[]) {
    const model = await this.getModel();
    const template = PromptTemplate.fromTemplate(`
{prompt}

## チャット履歴
{messages}

## アップロードされたドキュメント
{contents}

## 指示
セクションを生成するためのプロンプトを作成してください。以下の点に注意してください:

- 例を参考に、プロンプトを作成してください。
- LLMが誤った情報を生成しないよう、必要なコンテキストや制約を含めてください。
- プロンプトは簡潔で具体的な指示であるべきです。
- 出力はプロンプトのテキストのみを含めてください。他の情報は含めないでください。
`);

    const result = await template
      .pipe(model)
      .pipe(new StringOutputParser())
      .invoke({
        prompt: this.getPrompt(),
        messages: concatMessage(this.messages),
        contents: content.join("\n"),
      });
    return result;
  }

  async generate() {
    const resourceIds = await this.selectResources();
    const content = await this.retrieveInformation(resourceIds);
    const [extractedContent, prompt] = await Promise.all([
      this.extractInformation(content),
      this.generatePrompt(content),
    ]);
    const section = await this.generateSection(prompt, extractedContent);
    return section;
  }
}

async function generateSection(config: GenerateSectionParams) {
  const sectionGenerator = new SectionGenerator(config);
  return sectionGenerator.generate();
}

export type { GenerateSectionParams, ResourceSummary };
export { generateSection };
