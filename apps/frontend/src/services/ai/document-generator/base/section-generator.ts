import { BASE_MODEL } from "@/constants";
import { getModel } from "@/lib/ai/model";
import { PromptTemplate } from "@langchain/core/prompts";
import { z } from "zod";
import { Message } from "ai";
import { concatMessage } from "@/lib/ai/util";
import { getResourceByIds } from "@/services/resources/service";
import { StringOutputParser } from "@langchain/core/output_parsers";

// Types
interface ResourceSummary {
  id: string;
  summary: string;
}

interface GenerateSectionParams {
  title: string;
  example: string;
  prompt: string;
  messages: Message[];
  threadId: string;
  resourceSummaries: ResourceSummary[];
}

class SectionGenerator {
  readonly title: string;
  readonly example: string;
  readonly prompt: string;
  readonly messages: Message[];
  readonly resourceSummaries: ResourceSummary[];
  readonly threadId: string;

  constructor({
    title,
    example,
    prompt,
    messages,
    threadId,
    resourceSummaries,
  }: GenerateSectionParams) {
    this.title = title;
    this.example = example;
    this.prompt = prompt;
    this.messages = messages;
    this.threadId = threadId;
    this.resourceSummaries = resourceSummaries;
  }

  private async getModel() {
    return getModel({ model: BASE_MODEL, temperature: 0 });
  }

  private concatResourceSummaries(
    resourceSummaries: ResourceSummary[]
  ): string {
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
あなたは優秀な医療情報アシスタントです。
以下はリソースのリストです:

# チャット履歴
{messages}

# リソース
{resourceSummaries}

セクション「{title}」の作成に関連するリソースIDを選択してください。

- 出力はリソースIDの配列のみであり、他の情報を含めないでください。
    `;

    const promptTemplate = PromptTemplate.fromTemplate(prompt);
    const { resourceIds } = await promptTemplate.pipe(modelWithSchema).invoke({
      title: this.title,
      resourceSummaries: this.concatResourceSummaries(this.resourceSummaries),
      messages: concatMessage(this.messages),
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
あなたは優秀な医療情報専門家です。
以下はドキュメントの内容です:

# ドキュメント
{contents}

セクション「{title}」の作成に必要な情報を、上記のドキュメントから抜き出してください。

- 重要なポイント、キーフレーズ、関連する医学的知識を含めてください。
- 出力はプレーンテキストで提供し、不要な情報は省いてください。
- 特に診断基準や治療方針については正確に抽出し、記述してください。
    `;

    const promptTemplate = PromptTemplate.fromTemplate(prompt);

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
あなたは医療分野における高度な専門知識を持つアシスタントです。
以下はセクション「{title}」を作成するための情報です:
この情報を基に、セクションを生成するための正確かつ具体的なプロンプトを作成してください。

# チャット履歴
{messages}

# コンテンツ
{content}

# 出力例

{example}

# 注意点
- 出力は、セクション生成に必要なすべての詳細な指示を含めてください。
- 生成されるセクションが誤った情報を含まないように、医学的に必要なコンテキストや制約をしっかり記述してください。
- 情報が不足している場合、どの情報が必要であるかを明確に示してください。
    `;

    const promptTemplate = PromptTemplate.fromTemplate(prompt);
    const result = await promptTemplate
      .pipe(model)
      .pipe(new StringOutputParser())
      .invoke({
        title: this.title,
        content,
        messages: concatMessage(this.messages),
        example: this.example,
      });

    return result;
  }

  private async generateSection(
    prompt: string,
    content: string
  ): Promise<string> {
    const model = await this.getModel();

    const fullPrompt = `
あなたは医療分野における高度な専門知識を持つアシスタントです。
以下はセクション「{title}」を作成するための情報です:

{content}

以下のプロンプトに従って、セクションを生成してください。

プロンプト:

{prompt}

# 出力例

{example}

# 注意点
- 上記の情報を基に、専門的な観点から医学的に正確で詳細なセクションを生成してください。
- 生成するセクションには、診断情報や治療方針の重要な点を必ず含めてください。
- 出力はセクションのテキストのみとし、他の情報を含めないでください。
- 情報が不足している場合、どの情報が必要であるかを具体的に示してください。
    `;

    const promptTemplate = PromptTemplate.fromTemplate(fullPrompt);

    const result = await promptTemplate
      .pipe(model)
      .pipe(new StringOutputParser())
      .invoke({
        title: this.title,
        content,
        prompt,
        example: this.example,
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
