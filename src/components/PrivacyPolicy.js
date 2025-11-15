import React from 'react';

const PrivacyPolicy = () => {
  return (
    <div className="privacy-container">
      <div className="privacy-content">
        <h1>🔒 プライバシーポリシー</h1>

        <section className="privacy-section">
          <h2>1. 個人情報の収集</h2>
          <p>
            当社は、サービス提供のため以下の個人情報を収集する場合があります：
          </p>
          <ul>
            <li>名前</li>
            <li>メールアドレス</li>
            <li>日本語レベル</li>
            <li>レッスン履歴</li>
            <li>評価情報</li>
            <li>利用地域（大まかな位置情報）</li>
          </ul>
        </section>

        <section className="privacy-section">
          <h2>2. 個人情報の利用目的</h2>
          <p>
            収集した個人情報は、以下の目的で利用されます：
          </p>
          <ul>
            <li>ユーザーアカウントの管理</li>
            <li>マッチング機能の提供</li>
            <li>レッスン予約・実施</li>
            <li>評価システムの運用</li>
            <li>ユーザーサポート</li>
            <li>サービス改善のための分析</li>
            <li>セキュリティ対策</li>
            <li>法令遵守</li>
          </ul>
        </section>

        <section className="privacy-section">
          <h2>3. 個人情報の共有</h2>
          <p>
            当社は、以下の場合を除き、ユーザーの同意なく第三者と
            個人情報を共有しません：
          </p>
          <ul>
            <li>レッスンマッチング時に、相手ユーザーとの情報共有（名前など）</li>
            <li>法律で要求された場合</li>
            <li>個人を特定できない統計情報の利用</li>
          </ul>
        </section>

        <section className="privacy-section">
          <h2>4. データセキュリティ</h2>
          <p>
            当社は、収集した個人情報を保護するため以下の対策を講じています：
          </p>
          <ul>
            <li>SSL/TLS暗号化通信の使用</li>
            <li>データベースの暗号化</li>
            <li>アクセス制限</li>
            <li>定期的なセキュリティ監査</li>
            <li>パスワード要件の設定</li>
          </ul>
          <p>
            ただし、インターネット通信は完全に安全ではないため、
            絶対的なセキュリティは保証できません。
          </p>
        </section>

        <section className="privacy-section">
          <h2>5. クッキーと追跡技術</h2>
          <p>
            本サービスは、以下の目的でクッキーを使用する場合があります：
          </p>
          <ul>
            <li>ユーザーセッション管理</li>
            <li>ログイン状態の保持</li>
            <li>ユーザープリファレンスの保存</li>
            <li>サービス利用の分析</li>
          </ul>
          <p>
            ユーザーは、ブラウザ設定でクッキーを制御できます。
          </p>
        </section>

        <section className="privacy-section">
          <h2>6. 個人情報の保持期間</h2>
          <p>
            個人情報は、以下の期間保持されます：
          </p>
          <ul>
            <li>アクティブユーザー：アカウント削除まで</li>
            <li>アカウント削除後：法律要件に応じて30日〜1年</li>
            <li>レッスン履歴：ユーザー要求時に削除可能</li>
          </ul>
        </section>

        <section className="privacy-section">
          <h2>7. ユーザーの権利</h2>
          <p>
            ユーザーは以下の権利を有します：
          </p>
          <ul>
            <li>個人情報へのアクセス請求</li>
            <li>個人情報の修正要求</li>
            <li>個人情報の削除要求（右の忘れられる権利）</li>
            <li>個人情報利用の停止要求</li>
            <li>個人情報の移行請求</li>
          </ul>
          <p>
            これらの要求は、お問い合わせフォームから行えます。
          </p>
        </section>

        <section className="privacy-section">
          <h2>8. 未成年ユーザー</h2>
          <p>
            本サービスは18歳以上のユーザーを対象としています。
            保護者の同意なく18歳未満のユーザーのアカウント作成は禁止されています。
            当社は、未成年ユーザーから個人情報を収集していることを知った場合、
            速やかにその情報を削除します。
          </p>
        </section>

        <section className="privacy-section">
          <h2>9. 第三者リンク</h2>
          <p>
            本サービスは、第三者ウェブサイトへのリンクを含む場合があります。
            当社は、第三者ウェブサイトのプライバシーポリシーについて
            責任を負いません。
          </p>
        </section>

        <section className="privacy-section">
          <h2>10. ポリシーの変更</h2>
          <p>
            当社は、本プライバシーポリシーを随時変更することができます。
            重大な変更の場合は、メールで通知します。
            変更後、ユーザーがサービスを利用し続けることで
            同意したものとみなします。
          </p>
        </section>

        <section className="privacy-section">
          <h2>11. お問い合わせ</h2>
          <p>
            プライバシーについてご質問・ご懸念がある場合は、
            「お問い合わせ」ページからご連絡ください。
            当社は、30日以内に対応いたします。
          </p>
        </section>

        <section className="privacy-section">
          <h2>12. GDPR準拠</h2>
          <p>
            EU/EEAのユーザーについて、当社はGDPR（一般データ保護規則）を
            準拠するよう努めています。
          </p>
        </section>

        <div className="privacy-footer">
          <p>最終更新：2025年11月15日</p>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
