import { BASE_MODEL } from "@/constants";
import { getModel } from "@/lib/ai/model";
import { concatMessage } from "@/lib/ai/util";
import { ThreadSettings } from "@/models";
import { getResourceByIds } from "@/services/resources/service";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { PromptTemplate } from "@langchain/core/prompts";
import { Message } from "ai";
import { z } from "zod";

interface DocumentGenerator {
  generatorId: string;
  generateDocument: (
    threadId: string,
    settings: ThreadSettings
  ) => Promise<string>;
}

type ResourceSummary = {
  id: string;
  summary: string;
};

interface Config {
  sectionName: string;
  threadId: string;
  messages: Message[];
  resourceSummaries: ResourceSummary[];
  prompts: {
    generateQuery: string;
    generateSection: string;
    extractInformation: string;
  };
}

// 全てのドキュメントは同じフローで始められる
// 1. クエリ生成（Query Generation）：
// AIに各セクションに必要な情報を得るための検索クエリを生成してもらいます。

// 2. 情報の収集（Information Retrieval）：
// 生成されたクエリを使用して、Embeddingsやチャット履歴から関連する情報を検索します。

// 3. 構造化データの抽出（Structured Data Extraction）：
// 検索結果から必要な情報を構造化データとして抽出します。
// ここでもしデータが不足している場合は、ユーザーにデータの不足を知らせて再度データを入力してもらう？

// 4. 文章の生成（Text Generation）：
// 構造化データを用いて、セクションごとの文章を生成します。

// 5. セクションの統合（Section Integration）：
// 生成された各セクションを統合し、最終的な診断情報提供書を作成します。
// 共通のSectionProcessorクラス
abstract class BaseSectionProcessor {
  abstract config: Config;

  private async getModel() {
    return getModel({ model: BASE_MODEL, temperature: 0 });
  }

  private async generateQueries(): Promise<string[]> {
    const model = await this.getModel();
    const template = PromptTemplate.fromTemplate(
      this.config.prompts.generateQuery
    );
    const modelWithSchema = model.withStructuredOutput(
      z.object({ resourceIds: z.array(z.string()) })
    );
    const { resourceIds } = await template.pipe(modelWithSchema).invoke({
      messages: concatMessage(this.config.messages),
    });
    return resourceIds;
  }

  private async retrieveInformation(resourceIds: string[]): Promise<string[]> {
    const resources = await getResourceByIds(resourceIds);
    return resources.map(({ content }) => content);
  }

  private async generateSectionContent(content: string): Promise<string> {
    const model = await this.getModel();
    const template = PromptTemplate.fromTemplate(
      this.config.prompts.generateSection
    );
    const result = await template
      .pipe(model)
      .pipe(new StringOutputParser())
      .invoke({ content });
    return result;
  }

  private async extractInformation(content: string[]): Promise<string> {
    const model = await this.getModel();
    const template = PromptTemplate.fromTemplate(
      this.config.prompts.extractInformation
    );
    const result = await template
      .pipe(model)
      .pipe(new StringOutputParser())
      .invoke({
        messages: concatMessage(this.config.messages),
        content: this.concatSectionContent(content),
      });
    return result;
  }

  async process(): Promise<string> {
    const queries = await this.generateQueries();
    const retrievedContents = await this.retrieveInformation(queries);
    const extractedInformation = await this.extractInformation(
      retrievedContents
    );
    return await this.generateSectionContent(extractedInformation);
  }

  private concatSectionContent(content: string[]): string {
    return content.join("\n");
  }
}

export { BaseSectionProcessor };
export type { Config, ResourceSummary, DocumentGenerator };
