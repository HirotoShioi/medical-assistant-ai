// Langchainを用いて診療情報提供を作成する
// 提供書は4つに分割されているので、AIを用いてそれぞれ作成し、最終的に結合させる

import { BaseSectionProcessor, DocumentGenerator, Config } from "./base";
import { getMessagesByThreadId } from "@/services/messages/services";
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
    const [messages] = await Promise.all([getMessagesByThreadId(threadId)]);
    const course = await courseUntilAdmission.invoke(threadId, messages);
    // const currentMedication = new CurrentMedication(threadId, messages);
    // const pastHistoryAndFamilyHistory = new PastHistoryAndFamilyHistory(
    //   threadId,
    //   messages
    // );
    return course;
  }
}

class courseUntilAdmission extends BaseSectionProcessor {
  config: Config;
  constructor(threadId: string, messages: Message[]) {
    super();
    this.config = {
      sectionName: "CourseUntilAdmission",
      messages: messages,
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
        You are an expert medical information specialist. Based on the following conversation with the user, please propose three effective search queries to obtain the necessary information to create the "Course Until Admission" section.

<Conversation with the user>
{messages}
</Conversation with the user>

<Instructions>
- The proposed search queries should be specific and allow you to accurately retrieve the required information.
- Keep each query concise.
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
  static async invoke(threadId: string, messages: Message[]) {
    return new courseUntilAdmission(threadId, messages).process();
  }
}
