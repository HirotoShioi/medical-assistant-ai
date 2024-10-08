import Header from "@/components/header";
import { Markdown } from "@/components/markdown";
import { pageWrapperStyles } from "@/styles/common";
import { useTranslation } from "react-i18next";

const policyJa = `
## はじめに

本アプリケーションをご利用いただくことで、以下の利用規約に同意いただいたものとみなされます。ご利用の前に必ずお読みください。これらの規約に同意いただけない場合は、サービスのご利用をお控えください。

## サービスの利用

1. **利用目的**  
   本アプリケーションは、医療機関や医療従事者向けの事務支援ツールとして設計されており、診断・治療の意思決定に直接関与するものではありません。ユーザーは、アプリケーションが提供する情報や機能を、診療情報の整理や文書作成に限り使用するものとします。

2. **責任の範囲**  
   本アプリケーションで提供される情報は、参考として提供されるものであり、診断・治療に関する最終的な判断は、すべて医療従事者の責任において行われるものとします。当社は、本アプリケーションの使用によって生じたあらゆる損害について、一切の責任を負いません。

3. **データの保存**  
   ユーザーが本アプリケーションに入力したデータは、すべてローカルに保存され、外部サーバーに送信されることはありません。ユーザーは、ブラウザ上の設定を通じてデータを削除することができます。

4. **禁止事項**  
   ユーザーは、以下の行為を行ってはなりません。
   - 本アプリケーションを不正目的で使用すること
   - 法律や規制に違反する行為を行うこと
   - アプリケーションのシステムやセキュリティに対する不正なアクセスや操作を行うこと

## サービスの変更および終了

当社は、ユーザーに事前通知することなく、本アプリケーションの機能の変更、アップデート、またはサービスの提供を終了する権利を有します。これにより生じるいかなる損害についても、当社は責任を負いません。

## 免責事項

本アプリケーションは、利用可能な範囲で提供され、いかなる保証も行いません。ユーザーは自己責任で本アプリケーションを利用するものとし、当社はサービスの中断、エラー、セキュリティ侵害、データの損失に対して一切の責任を負いません。

## 改定

当社は、必要に応じて本利用規約を改定する権利を有します。改定された規約は、アプリケーション上で告知され、ユーザーは改定後にアプリケーションを利用することで、改定後の規約に同意したものとみなされます。
`;

const privacyPolicyJa = `
## データの取扱いについて

### 収集する情報

1. **ユーザー提供情報**:
   - アカウント登録やアプリの利用時に、名前、メールアドレス、連絡先情報などの個人情報を提供いただく場合があります。
   - アプリの利用中に入力された診療情報やその他のデータは、すべてローカルに保存され、外部サーバーに送信されることはありません。

2. **自動的に収集される情報**:
   - アプリ利用時に、IPアドレス、ブラウザタイプ、デバイスタイプなどの技術的情報が自動的に収集されることがあります。これらのデータはユーザー体験の改善や技術的なサポートのために利用されます。

### データの取扱い方法

- **ローカルストレージ**: ユーザーの入力データや設定情報は、すべてローカルストレージやIndexedDBに保存され、当社のサーバーに送信されることはありません。これにより、すべてのデータはユーザーのブラウザにのみ存在します。
- **安全な通信**: メッセージ送信時、ブラウザは直接APIサーバーと安全なHTTPS接続を通じて通信します。中間サーバーは存在せず、データのプライバシーが保護されます。
- **データの削除**: ユーザーはブラウザ上でいつでもデータ（APIキー、設定、履歴）を削除することができます。
- **トラッキングとクッキー**: アプリの機能向上のために、エラーログやトラッキングツールが使用される場合がありますが、クッキーの使用は最小限に抑えられています。

### 第三者サービスの利用

当アプリは、以下の第三者ツールを使用してサービスの最適化や技術サポートを行う場合があります。

- **分析ツール**: ユーザーの操作や利用状況を把握し、アプリの改善に役立てます。
- **エラーロギングツール**: 技術的なエラーの発生状況をモニタリングし、アプリの安定性向上に寄与します。

これらの第三者ツールは、独自のプライバシーポリシーを有しており、ユーザーはそれらを確認することを推奨します。

### クッキーの使用

当アプリ自体は直接的なクッキーを使用しません。ただし、利用する第三者ツール（例: 分析ツール、エラーロギングツール）がクッキーを使用する場合があります。また、認証のためにクッキーが使用されることがあります。クッキーの受け入れや拒否は、ブラウザの設定で管理できます。

### 第三者リンクとコンテンツ

アプリには第三者のウェブサイトへのリンクが含まれる場合がありますが、これらの外部サイトのコンテンツやプライバシーポリシーについては当アプリは関与しておりません。ユーザーは、各リンク先のプライバシーポリシーを確認することを推奨します。
`;
const policyEn = `
## Terms of Service

## Introduction

By using this application, you agree to the following terms and conditions. Please read them carefully before using our services. If you do not agree with these terms, you may not use the service.

## Use of the Service

1. **Purpose of Use**  
   This application is designed as an administrative support tool for healthcare institutions and professionals. It does not directly participate in decision-making related to diagnosis or treatment. Users may only use the features and information provided by this application for the purpose of organizing medical information and creating documents.

2. **Scope of Responsibility**  
   The information provided by this application is for reference purposes only, and the final decision regarding diagnosis and treatment is the sole responsibility of healthcare professionals. We are not responsible for any damages arising from the use of this application.

3. **Data Storage**  
   All data inputted by the user into this application is stored locally on the user’s device and is not transmitted to any external servers. Users may delete their data through their browser settings.

4. **Prohibited Actions**  
   Users are prohibited from:
   - Using the application for illegal or unauthorized purposes.
   - Engaging in any actions that violate laws or regulations.
   - Attempting to gain unauthorized access to the system or security of the application.

## Changes and Termination of the Service

We reserve the right to change, update, or terminate any feature of this application without prior notice to users. We are not liable for any damages that may result from changes or the termination of the service.

## Disclaimer

This application is provided "as is" and without any warranty. Users assume all risks related to the use of the application, and we are not responsible for any interruptions, errors, security breaches, or data loss that may occur while using the service.

## Modifications

We reserve the right to modify these Terms of Service at any time. Revised terms will be posted on the application, and by continuing to use the application after changes are posted, you agree to the updated terms.
`;

const privacyPolicyEn = `

## Data Handling Information

### Information We Collect

1. **User-Provided Information**:
   - When you register for an account or use our application, you may provide us with personal information such as your name, email address, and contact details.
   - Any medical or related information inputted during the use of the application is stored locally on your device and is not transmitted to external servers.

2. **Automatically Collected Information**:
   - When you use the application, technical information such as your IP address, browser type, and device type may be automatically collected. This information is used to improve user experience and provide technical support.

### How We Handle Your Data

- **Local Storage**: All user input and settings are stored locally in your browser using Local Storage or IndexedDB, and no data is sent to our servers. This ensures that all data remains on your device.
- **Secure Requests**: When you send messages, your browser directly communicates with the API server via secure HTTPS connections. No intermediary servers are involved, ensuring your data remains private.
- **Data Deletion**: You can delete all your data, including API keys, configurations, and chat histories, directly from your browser at any time.
- **Tracking and Cookies**: To improve functionality, we may use tracking and error logging tools, though cookie usage is kept to a minimum.

### Use of Third-Party Services

Our application may use the following third-party services to assist with service optimization and technical support:

- **Analytics Tools**: Used to understand user interactions and improve the application.
- **Error Logging Tools**: Used to monitor and resolve technical errors to enhance application stability.

These third-party services have their own privacy policies, which we encourage you to review.

### Cookies

The application itself does not use cookies directly. However, third-party services such as analytics or error logging tools may use cookies. Cookies may also be used for authentication purposes. You can manage cookie preferences through your browser settings.

### Third-Party Links and Content

The application may contain links to third-party websites. We are not responsible for the content or privacy policies of these websites. We recommend reviewing their privacy policies separately.
`;
export default function PolicyPage() {
  const { t, i18n } = useTranslation();
  const policy = i18n.language === "ja" ? policyJa : policyEn;
  const privacyPolicy =
    i18n.language === "ja" ? privacyPolicyJa : privacyPolicyEn;
  return (
    <>
      <Header />
      <div className={pageWrapperStyles}>
        <div className="space-y-4">
          <h1 className="text-2xl font-bold bg-white">{t("policy.title")}</h1>
          <div className="border rounded-lg p-4 space-y-4 bg-white">
            <Markdown content={policy} />
          </div>
          <h1 className="text-2xl font-bold">{t("policy.privacyPolicy")}</h1>
          <div className="border rounded-lg p-4 space-y-4 bg-white">
            <Markdown content={privacyPolicy} />
          </div>
        </div>
      </div>
    </>
  );
}
