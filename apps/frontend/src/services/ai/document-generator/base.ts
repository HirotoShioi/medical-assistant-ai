import { ThreadSettings } from "@/models";

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

// interface ISectionProcessor {
//   sectionName: string;
//   generateQueries(): Promise<string[]>;
//   retrieveInformation(queries: string[]): Promise<string>;
//   extractStructuredData(retrievedText: string): Promise<any>;
//   generateSectionContent(structuredData: any): Promise<string>;
//   processSection(): Promise<string>;
// }
