import { BASE_MODEL } from "@/constants";
import { findRelevantContent } from "@/lib/ai/embeddings";
import { getModel } from "@/lib/ai/model";
import { concatMessage } from "@/lib/ai/util";
import { ThreadSettings } from "@/models";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { PromptTemplate } from "@langchain/core/prompts";
import { Message } from "ai";
import { z } from "zod";

export interface DocumentGenerator {
  generatorId: string;
  generateDocument: (
    threadId: string,
    settings: ThreadSettings
  ) => Promise<string>;
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

export interface Config {
  sectionName: string;
  threadId: string;
  messages: Message[];
  prompts: {
    generateQuery: string;
    generateSection: string;
    extractInformation: string;
  };
}

export interface ISectionProcessor {
  process(): Promise<string>;
}

export abstract class BaseSectionProcessor implements ISectionProcessor {
  abstract config: Config;

  private async generateQueries(): Promise<string[]> {
    const model = await getModel({
      model: BASE_MODEL,
      temperature: 0,
    });
    const template = PromptTemplate.fromTemplate(
      this.config.prompts.generateQuery
    );
    const modelWithSchema = model.withStructuredOutput(
      z.object({
        queries: z.array(z.string()),
      })
    );
    const { queries } = await template.pipe(modelWithSchema).invoke({
      messages: concatMessage(this.config.messages),
    });
    return queries;
  }

  private async retrieveInformation(queries: string[]): Promise<string[]> {
    const contents = await Promise.all(
      queries.map((query) => findRelevantContent(query, this.config.threadId))
    );
    const uniqueContents = contents
      .flat()
      .filter(
        (content, index, self) =>
          index === self.findIndex((t) => t.embeddingId === content.embeddingId)
      );
    return uniqueContents.map((c) => c.content);
  }

  private async generateSectionContent(content: string): Promise<string> {
    const model = await getModel({
      model: BASE_MODEL,
      temperature: 0,
    });
    const template = PromptTemplate.fromTemplate(
      this.config.prompts.generateSection
    );
    const result = await template
      .pipe(model)
      .pipe(new StringOutputParser())
      .invoke({
        content: content,
      });
    return result;
  }

  private async extractInformation(content: string[]): Promise<string> {
    const model = await getModel({
      model: BASE_MODEL,
      temperature: 0,
    });
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
    const retrievedContens = await this.retrieveInformation(queries);
    const extractedInformation = await this.extractInformation(
      retrievedContens
    );
    const result = await this.generateSectionContent(extractedInformation);
    return result;
  }

  private concatSectionContent(content: string[]): string {
    return content.join("\n");
  }
}
