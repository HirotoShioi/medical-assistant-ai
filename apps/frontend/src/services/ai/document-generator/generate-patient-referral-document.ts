// Langchainを用いて診療情報提供を作成する
// 提供書は4つに分割されているので、AIを用いてそれぞれ作成し、最終的に結合させる

import { ThreadSettings } from "@/models";
import { DocumentGenerator } from "./base";
import { getMessagesByThreadId } from "@/services/messages/services";
import { getDocumentsByThreadId } from "@/services/documents/service";
import { generateDocument as gen } from "@/lib/ai/generate-document";
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
  async generateDocument(
    threadId: string,
    settings: ThreadSettings
  ): Promise<string> {
    const [messages, documents] = await Promise.all([
      getMessagesByThreadId(threadId),
      getDocumentsByThreadId(threadId),
    ]);
    return gen({
      documentGenerationPrompt: settings.reportGenerationPrompt ?? undefined,
      messages,
      documents,
    });
  }
}
