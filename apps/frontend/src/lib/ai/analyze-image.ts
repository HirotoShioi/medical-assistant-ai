import { HumanMessage } from "@langchain/core/messages";
import { getModel } from "./model";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { codeBlock } from "common-tags";
import { createWorker } from "tesseract.js";

// 画像BlobをBase64に変換する関数
const blobToBase64 = (blob: Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      resolve(result.split(",")[1]); // Base64部分のみ取得
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};

// Tesseract.jsを使って画像をOCR処理する関数
const ocrImage = async (imageBlob: Blob, fileType: string): Promise<string> => {
  const worker = await createWorker("jpn");
  await worker.load(); // Tesseractのロード

  // 画像BlobをOCR解析
  const base64Image = await blobToBase64(imageBlob);
  const {
    data: { text },
  } = await worker.recognize(`data:image/${fileType};base64,${base64Image}`);

  await worker.terminate(); // ワーカーを終了

  return text; // 抽出したテキストを返す
};

export async function analyzeImage(
  imageBlob: Blob,
  fileType: string
): Promise<string> {
  // まず、画像をOCRで解析する
  const extractedText = await ocrImage(imageBlob, fileType);

  const base64Image = await blobToBase64(imageBlob);
  // OpenAI GPTモデルを初期化
  const model = await getModel({
    modelName: "gpt-4o-mini",
    temperature: 0,
  });

  // HumanMessageを作成
  const message = new HumanMessage({
    content: [
      {
        type: "text",
        text: codeBlock`次の画像はある患者の処方内容の画像です。画像を分析して、それぞれの薬について以下の内容を個別に抽出してください。
1. 薬剤名称
2. 1日の服用回数
3. 1回の服用量
4. 1日の服用量

**注意事項**:
- 出力形式は必ずマークダウン形式のテーブルで表示してください。
- Do not include any explanations, comments, or additional text outside of the data.

**出力形式**:
| 薬剤名称            | 1日の服用回数 | 1回の服用量 | 1日の服用量 |
|---------------------|---------------|-------------|-------------|
| ランジオールOD錠 15mg | 1回            | 1錠          | 1錠          |
| メトグルコ錠          | 2回            | 1錠          | 2錠          |
        `,
      },
      {
        type: "text", // 抽出されたテキストを画像の代わりに送信
        text: extractedText,
      },
      {
        type: "image_url",
        image_url: {
          url: `data:image/${fileType};base64,${base64Image}`,
        },
      },
    ],
  });

  // モデルにメッセージを送信し、レスポンスを受け取る
  const response = await model.pipe(new StringOutputParser()).invoke([message]);

  return response;
}
