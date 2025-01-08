import { z } from "zod";
import { getModel } from "./model";
import { codeBlock } from "common-tags";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { BASE_MODEL } from "@/constants";

const schema = z.object({
  systemMessage: z.string().describe("System message"),
  initialAssistantMessage: z.string().describe("The initial message the assistant will send to the user"),
});

export type GenerateTemplateMessageOutput = z.infer<typeof schema>;

type GenerateTemplateMessageInput = {
  title: string;
  overview: string;
  description: string;
  systemMessage: string;
  initialAssistantMessage: string;
};

export async function generateTemplateMessage({
  title,
  overview,
  description,
  systemMessage,
  initialAssistantMessage,
}: GenerateTemplateMessageInput): Promise<GenerateTemplateMessageOutput> {
  const model = await getModel({
    model: BASE_MODEL,
  });
  const withStructuredOutput = model.withStructuredOutput(schema);
  const prompt = codeBlock`
現在のプロンプトと変更の説明が与えられた場合、言語モデルがタスクを効果的に完了できるよう、詳細なシステムプロンプトを作成してください。

最終的な出力は、完全に修正されたプロンプトをそのまま出力してください。ただし、その前に、レスポンスの先頭で <reasoning> タグを使用して、以下を明確に分析してください：

<reasoning>
- **単純な変更**: (はい/いいえ) 変更の説明は明確で単純ですか？（もしそうなら、以下の質問はスキップしてください）
- **推論**: (はい/いいえ) 現在のプロンプトには推論、分析、または一連の思考がありますか？
  - **識別**: (最大10言)そうであれば、どのセクションが推論を利用していますか？
  - **結論**: (はい/いいえ) 一連の思考は結論を定めるために使用されていますか？
  - **順序**: (前/後) 一連の思考は結論の前または後にありますか？
- **構造**: (はい/いいえ) 入力プロンプトには明確に定義された構造がありますか？
- **例**: (はい/いいえ) 入力プロンプトにはFew-shotの例がありますか？
  - **代表性**: (1-5) 存在する場合、それらの例はどの程度代表的ですか？
- **複雑さ**: (1-5) 入力プロンプトはどの程度複雑ですか？
  - **タスク**: (1-5) 暗示されるタスクの複雑さはどの程度ですか？
  - **必要性**: ()
- **具体性**: (1-5) プロンプトの詳細さと具体性はどの程度ですか？（長さとは無関係）
- **優先順位**: (リスト) 最も重要なカテゴリーを1～3つ挙げてください。
- **結論**: (最大30言) 前述の評価を踏まえ、どのように変更すべきかを非広講で記述してください。この説明は、列挙されたカテゴリーに固執して必ずしも守る必要はありません。
</reasoning>

---

# ガイドライン

- **タスクの理解**: 主な目的、目標、要件、制約、期待される出力を把握してください。
- **最小限の変更**: 既存のプロンプトが提供されている場合、単純な場合にのみ改善してください。複雑なプロンプトの場合、先に明確さを高め、欠けている要素を追加してください。元の構造を変更しないようにしてください。
- **結論の前に推論**: 結論が出される前に推論のステップを推奨してください。  
  **注意！** ユーザーが推論が後に行われる例を提供した場合、その順序を逆にしてください！例を結論で始めることは絶対に避けてください。
  - **推論の順序**: プロンプト内の推論部分と結論部分を特定し、それぞれの順序を決定してください。必要に応じて順序を逆にします。
  - 結論、分類、または結果は常に最後に表示されるべきです。
- **例**: 必要であれば高質な例を追加し、複雑な要素にはプレースホルダー [ ] を使用してください。
  - どの種類の例が必要か、何個必要か、プレースホルダーが必要な場合はその複雑さに応じて決定してください。
- **明確さと簡潔さ**: 明確で具体的な言葉を使い、不要な指示やさらない説明を避けてください。
- **フォーマット**: 可読性のためにMarkdown機能を使用してください。  
  **注意！** コードブロックは特に指定されない限り使用しないでください。
- **ユーザーコンテンツの保持**: 入力タスクやプロンプトが広義なガイドラインや例を含む場合、それらを完全に保持してください。または可能な限り忠実に保ってください。曖昧な場合はサブステップに分解することを検討してください。提供された詳細、ガイドライン、例、変数、またはプレースホルダーを保持してください。
- **定数**: プロンプト挿入攻撃を避けるために、ガイドライン、ルーブリック、例などの定数をプロンプトに含めてください。
- **出力形式**: 最も適切な出力形式を明確に指定してください。これには、長さや構文（例: 短い文、段落、JSONなど）が含まれます。
  - 明確に定義された構造化データ（分類、JSONなど）を出力するタスクでは、JSONを出力することを推奨してください。
  - JSONは明示的に指定されない限り、コードブロックで囲まないでください。

---

最終的なプロンプトは以下の構造に従う必要があります。追加のコメントを含めず、完成したシステムプロンプトのみを出力してください。**特に**、プロンプトの冒頭や末尾に追加のメッセージ（例: "---"）を含めないでください。

---

[タスクを簡潔に指示する説明 - プロンプトの最初の行で記述、セクション見出しは不要]

[必要に応じて追加の詳細]

[詳細なステップを記載する必要がある場合のオプションセクション]

# ステップ [オプション]

[タスクを達成するために必要な手順の詳細な分解（必要に応じて）]

# 出力形式

[出力の形式がどのように構造化されるべきかを具体的に明記（例: 長さ、JSON、Markdownなど）]

# 例 [オプション]

[必要に応じて、適切に定義された1～3の例を記載。プレースホルダーを使用して複雑な要素を明確に示す。]
[例が期待される実際の例の長さより短い場合、または異なる場合、それを明記しプレースホルダーを使用してください！]

# メモ [オプション]

[エッジケース、詳細、または特定の重要な考慮事項を繰り返し強調するセクション（必要に応じて）]
[**注意**: 必ず <reasoning> セクションから始めてください。次に出力するトークンは <reasoning> でなければなりません。]
  `;
  const messages = [
    new SystemMessage({
      content: prompt,
    }),
    new HumanMessage({
      content: codeBlock`
title: ${title}
overview: ${overview}
description: ${description}
systemMessage: ${systemMessage}
initialAssistantMessage: ${initialAssistantMessage}
      `,
    }),
  ];
  const result = await withStructuredOutput.invoke(messages);
  return result;
}
