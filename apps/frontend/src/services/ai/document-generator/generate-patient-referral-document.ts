// Langchainを用いて診療情報提供を作成する
// 提供書は4つに分割されているので、AIを用いてそれぞれ作成し、最終的に結合させる

import {
  BaseSectionProcessor,
  DocumentGenerator,
  Config,
  ResourceSummary,
} from "./base";
import { getMessagesByThreadId } from "@/services/messages/services";
import { getResourcesByThreadId } from "@/services/resources/service";
import { Message } from "ai";
import { codeBlock } from "common-tags";

// 1. 既往歴 <- 入院時のカルテから
// 入院の経緯 <- 入院時のカルテから
// 入院後の経過
//   入院中のADL
//   入院中の食事
//   入院中のcode
//   心肺停止時の対応内容
// 締め

// 2. 現在の処方内容
// 薬品名 容量 一回何錠 一日何回 飲むタイミング

// 3.既往歴及び家族歴
// 家族の背景（家族がかかっている病気)
// 生活歴
// 喫煙
// 飲酒

// 4. 備考
// 薬の細かい内容、とくに抗菌薬

export class GeneratePatientReferralDocument implements DocumentGenerator {
  generatorId = "generate-patient-referral-document";
  async generateDocument(threadId: string): Promise<string> {
    const [messages, resourceSummaries] = await Promise.all([
      getMessagesByThreadId(threadId),
      getResourcesByThreadId(threadId),
    ]);
    const [after, before, currentPrescription, pastMedicalFamilyHistory] =
      await Promise.all([
        courseUntilAdmission.invoke(threadId, messages, resourceSummaries),
        beforeAdmissionCourse.invoke(threadId, messages, resourceSummaries),
        currentPrescriptions.invoke(threadId, messages, resourceSummaries),
        pastMedicalFamilyHistoryProcessor.invoke(
          threadId,
          messages,
          resourceSummaries
        ),
      ]);
    return codeBlock`
    # 入院に至る経緯
    
    ${before}

    # 入院後の経過
    
    ${after}

    # 現在の処方内容
    
    ${currentPrescription}

    # 既往歴及び家族歴
    
    ${pastMedicalFamilyHistory}
    `;
  }
}

class courseUntilAdmission extends BaseSectionProcessor {
  config: Config;
  constructor(
    threadId: string,
    messages: Message[],
    resourceSummaries: ResourceSummary[]
  ) {
    super();
    this.config = {
      sectionName: "CourseUntilAdmission",
      messages: messages,
      resourceSummaries,
      threadId,
      prompts: {
        extractInformation: codeBlock`
        You are an expert medical information specialist. From the following text, please extract the information necessary to create the "Course After Admission" section.

<Chat History>
{messages}
</Chat History>

<Uploaded Documents>
{contents}
</Uploaded Documents>

Here's a example of a document that you will created from the above information.

<Example>
# 意識障害
# アルコール多飲歴
# 栄養摂取量不足
入院時の髄液検査では髄膜炎を示唆する所見はなく、頭部CT画像でも明らかな異常所見は認めませんでしたが、頭部MRI画像では中脳に軽度の高信号域が認められました。患者様は元々相当な大酒家であり、栄養摂取も十分ではなかったことが予想され、Wernicke脳症が疑われました。そのため、ビタミンB1を7月21〜22日は1500mg、23〜28日は500mg点滴し、29日からはアリナミンF 25mgを3錠3回投与で加療を継続しています。
入院翌日から徐々に意識レベルは改善し、入院3日目（7月23日）には簡単な会話ができるようになりましたが、現在も認識障害が続いており、簡単な会話のみが可能です。アルコール性認知症やコルサコフ症候群が疑われています。
</Example>
`,
        generateQuery: codeBlock`
        You are an expert medical information specialist. Based on the following conversation with the user, specify the document IDs that are relevant to the "Course Until Admission" section.

<Conversation with the user>
{messages}
</Conversation with the user>

<Documents>
{contents}
</Documents>
`,
        generateSection: codeBlock`
You are an excellent medical clerk. Using the following patient information, please create the "Course After Admission" section of the Medical Information Provision Document.

<Patient Information>
{content}
<Patient Information>

<Example>
# 意識障害
# アルコール多飲歴
# 栄養摂取量不足
入院時の髄液検査では髄膜炎を示唆する所見はなく、頭部CT画像でも明らかな異常所見は認めませんでしたが、頭部MRI画像では中脳に軽度の高信号域が認められました。患者様は元々相当な大酒家であり、栄養摂取も十分ではなかったことが予想され、Wernicke脳症が疑われました。そのため、ビタミンB1を7月21〜22日は1500mg、23〜28日は500mg点滴し、29日からはアリナミンF 25mgを3錠3回投与で加療を継続しています。
入院翌日から徐々に意識レベルは改善し、入院3日目（7月23日）には簡単な会話ができるようになりましたが、現在も認識障害が続いており、簡単な会話のみが可能です。アルコール性認知症やコルサコフ症候群が疑われています。
</Example>

<Instructions>
- Write in a polite and formal style.
- Separate each item into appropriate paragraphs to enhance readability.
- Adhere to the prescribed format, and use bullet points where necessary.
- Conclude with the following statement: "以上、簡単ではございますが当院での加療内容となります。不足の情報がございましたら、気兼ねなくご連絡いただけますと幸いです。<Patient Name>殿の引き続きの御加療を何卒よろしくお願い申し上げます。"
</Instructions>
Generated Section:`,
      },
    };
  }
  static async invoke(
    threadId: string,
    messages: Message[],
    resourceSummaries: ResourceSummary[]
  ) {
    return new courseUntilAdmission(
      threadId,
      messages,
      resourceSummaries
    ).process();
  }
}

class beforeAdmissionCourse extends BaseSectionProcessor {
  config: Config;
  constructor(
    threadId: string,
    messages: Message[],
    resourceSummaries: ResourceSummary[]
  ) {
    super();
    this.config = {
      sectionName: "BeforeAdmissionCourse",
      messages: messages,
      resourceSummaries,
      threadId,
      prompts: {
        extractInformation: `
You are an expert medical information specialist. From the following text, please extract the necessary information to create the "Course Until Admission" section.

<Chat History>
{messages}
</Chat History>

<Uploaded Documents>
{contents}
</Uploaded Documents>

Here is an example of the type of document you will create from the above information:

<Example>
平素よりお世話になっております。 この度は患者様のお受け入れを頂き、誠にありがとうございます。当院の7月20日から8月28日までの入院経過について、
情報提供させていただきます。 患者様はアルコール多飲歴、胃静脈瘤破裂などの既往があり、前医の鴨川国保病院がかかりつけの、独居・70歳男性
（元血液内科医）です。ADLはかろうじて自立しておりました。入院1週間前までは、KPである姪御さんとSNSで会話ができていましたが、
入院3日前に近所のスーパーで「老人がフラフラしている」との通報があり、病院受診が提案されましたが、患者様は強く拒否しました。
周囲の制止も振り切り、自分で車を運転し自宅に向かう途中、木に衝突しました。その際も救急搬送が提案されましたが、拒否しておりました。 
入院当日（7月21日）、救急隊および警察が安否確認のため自宅を訪れたところ、患者様が自宅の壁とベッドの間で動けなくなっているのを発見。
呼びかけに応答はなく、従命が通らない状態で、顔面には大量の小さい虫が這っているような状況でした。そのため、救急搬送され当科に入院となりました。
当院到着時にはほとんど従命が入らず、発話もほぼできず、意思疎通が不可能な状態でした。
</Example>
        `,
        generateQuery: `
You are an expert medical information specialist. Based on the following conversation with the user, please propose three effective search queries to obtain the necessary information to create the "Course Until Admission" section.

<Conversation with the user>
{messages}
</Conversation with the user>

<Instructions>
- The proposed search queries should be specific and allow you to accurately retrieve the required information.
- Keep each query concise.
</Instructions>
        `,
        generateSection: `
You are an excellent medical clerk. Using the following patient information, please create the "Course Until Admission" section of the Medical Information Provision Document.

<Patient Information>
{content}
</Patient Information>

<Example>
平素よりお世話になっております。 この度は患者様のお受け入れを頂き、誠にありがとうございます。当院の7月20日から8月28日までの入院経過について、
情報提供させていただきます。 患者様はアルコール多飲歴、胃静脈瘤破裂などの既往があり、前医の鴨川国保病院がかかりつけの、独居・70歳男性
（元血液内科医）です。ADLはかろうじて自立しておりました。入院1週間前までは、KPである姪御さんとSNSで会話ができていましたが、
入院3日前に近所のスーパーで「老人がフラフラしている」との通報があり、病院受診が提案されましたが、患者様は強く拒否しました。
周囲の制止も振り切り、自分で車を運転し自宅に向かう途中、木に衝突しました。その際も救急搬送が提案されましたが、拒否しておりました。 
入院当日（7月21日）、救急隊および警察が安否確認のため自宅を訪れたところ、患者様が自宅の壁とベッドの間で動けなくなっているのを発見。
呼びかけに応答はなく、従命が通らない状態で、顔面には大量の小さい虫が這っているような状況でした。そのため、救急搬送され当科に入院となりました。
当院到着時にはほとんど従命が入らず、発話もほぼできず、意思疎通が不可能な状態でした。
</Example>

<Instructions>
- Write in a polite and formal style.
- Include necessary details such as the reason for admission, ADL at admission, date and symptoms (chief complaint), medical facility visited, diagnosis, and department admitted to.
- Follow the prescribed format and enhance readability.
</Instructions>

Generated Section:
        `,
      },
    };
  }
  static async invoke(
    threadId: string,
    messages: Message[],
    resourceSummaries: ResourceSummary[]
  ) {
    return new beforeAdmissionCourse(
      threadId,
      messages,
      resourceSummaries
    ).process();
  }
}

class currentPrescriptions extends BaseSectionProcessor {
  config: Config;
  constructor(
    threadId: string,
    messages: Message[],
    resourceSummaries: ResourceSummary[]
  ) {
    super();
    this.config = {
      sectionName: "CurrentPrescriptions",
      messages: messages,
      resourceSummaries,
      threadId,
      prompts: {
        extractInformation: `
あなたは優秀な医療情報専門家です。以下のテキストから、「現在の処方」セクションを作成するために必要な情報を抽出してください。

<チャット履歴>
{messages}
</チャット履歴>

<アップロードされたドキュメント>
{contents}
</アップロードされたドキュメント>

以下は、上記の情報から作成されるドキュメントの例です。

<例>
- タケキャブ20mg 1T 1x 朝食後
- アリナミンF 25mg 3T 3x 朝昼夕食後
- デエビゴ2.5mg 1T 1x 就寝前（良眠時スキップ可）
- マグミット330mg 3T 3x 朝昼夕食後（軟便時スキップ可）
</例>
        `,
        generateQuery: `
あなたは優秀な医療情報専門家です。以下のユーザーとの会話内容に基づいて、「現在の処方」セクションを作成するために必要な情報を得るための効果的な検索クエリを3つ提案してください。

<ユーザーとの会話内容>
{messages}
</ユーザーとの会話内容>

<指示>
- 提案する検索クエリは具体的で、必要な情報を正確に取得できるものとしてください。
- 各クエリは簡潔に記載してください。
</指示>
        `,
        generateSection: `
あなたは優秀な医療事務員です。以下の患者の処方情報を用いて、診断情報提供書の「現在の処方」セクションを作成してください。

<処方情報>
{content}
</処方情報>

<例>
- タケキャブ20mg 1T 1x 朝食後
- アリナミンF 25mg 3T 3x 朝昼夕食後
- デエビゴ2.5mg 1T 1x 就寝前（良眠時スキップ可）
- マグミット330mg 3T 3x 朝昼夕食後（軟便時スキップ可）
</例>

<指示>
- 薬剤名、用量、1回あたりの処方量、1日に処方される回数、および服用時間を記載してください。
- 必要に応じて特記事項を括弧内に記載してください。
- 箇条書きでわかりやすく記載してください。
</指示>

作成されたセクション：
        `,
      },
    };
  }
  static async invoke(
    threadId: string,
    messages: Message[],
    resourceSummaries: ResourceSummary[]
  ) {
    return new currentPrescriptions(
      threadId,
      messages,
      resourceSummaries
    ).process();
  }
}

class pastMedicalFamilyHistoryProcessor extends BaseSectionProcessor {
  config: Config;
  constructor(
    threadId: string,
    messages: Message[],
    resourceSummaries: ResourceSummary[]
  ) {
    super();
    this.config = {
      sectionName: "PastMedicalFamilyHistory",
      resourceSummaries,
      messages: messages,
      threadId,
      prompts: {
        extractInformation: `
あなたは優秀な医療情報専門家です。以下のテキストから、「既往歴および家族歴」セクションを作成するために必要な情報を抽出してください。

<チャット履歴>
{messages}
</チャット履歴>

<アップロードされたドキュメント>
{contents}
</アップロードされたドキュメント>

以下は、上記の情報から作成されるドキュメントの例です。

<例>
【既往歴/併存症】
両側乳癌術後、高血圧症、慢性心不全、Moderate AR/MR/TR、腹部大動脈瘤、鉄欠乏性貧血、脂質異常症、食道裂孔ヘルニア、大腸ポリープ、腰痛症、脊柱管狭窄症、骨粗鬆症、不眠症、胃潰瘍、めまい症
【アレルギー】
なし
【生活歴】
飲酒: なし
喫煙: 40本×40年（2006年禁煙）
同居: 独居
ADL: 杖歩行、食事自立、更衣自立、排泄自立、入浴はヘルパー
</例>
        `,
        generateQuery: `
あなたは優秀な医療情報専門家です。以下のユーザーとの会話内容に基づいて、「既往歴および家族歴」セクションを作成するために必要な情報を得るための効果的な検索クエリを3つ提案してください。

<ユーザーとの会話内容>
{messages}
</ユーザーとの会話内容>

<指示>
- 提案する検索クエリは具体的で、必要な情報を正確に取得できるものとしてください。
- 各クエリは簡潔に記載してください。
</指示>
        `,
        generateSection: `
あなたは優秀な医療事務員です。以下の患者情報を用いて、診断情報提供書の「既往歴および家族歴」セクションを作成してください。

<患者情報>
{content}
</患者情報>

<例>
【既往歴/併存症】
両側乳癌術後、高血圧症、慢性心不全、Moderate AR/MR/TR、腹部大動脈瘤、鉄欠乏性貧血、脂質異常症、食道裂孔ヘルニア、大腸ポリープ、腰痛症、脊柱管狭窄症、骨粗鬆症、不眠症、胃潰瘍、めまい症
【アレルギー】
なし
【生活歴】
飲酒: なし
喫煙: 40本×40年（2006年禁煙）
同居: 独居
ADL: 杖歩行、食事自立、更衣自立、排泄自立、入浴はヘルパー
</例>

<指示>
- 患者の既往歴、家族歴、アレルギー、生活歴（飲酒、喫煙、同居状況、ADLなど）を記載してください。
- 箇条書きや見出しを使用して、情報を整理してください。
- 必要に応じて特記事項を含めてください。
</指示>

作成されたセクション：
        `,
      },
    };
  }
  static async invoke(
    threadId: string,
    messages: Message[],
    resourceSummaries: ResourceSummary[]
  ) {
    return new pastMedicalFamilyHistoryProcessor(
      threadId,
      messages,
      resourceSummaries
    ).process();
  }
}
