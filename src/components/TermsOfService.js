import React from 'react';

const TermsOfService = () => {
  return (
    <div className="terms-container">
      <div className="terms-content">
        <h1>📋 利用規約</h1>
        
        <section className="terms-section">
          <h2>1. サービスについて</h2>
          <p>
            本サービス（日本語会話マッチング）は、日本語学習者と日本語教師を結びつけ、
            リアルタイムで会話練習できるプラットフォームです。
          </p>
        </section>

        <section className="terms-section">
          <h2>2. ユーザーの義務</h2>
          <ul>
            <li>ユーザーは真実かつ正確な情報を提供することに同意します</li>
            <li>他のユーザーを尊重し、礼儀正しく行動することを約束します</li>
            <li>不正なアクティビティや違法な行為は禁止されています</li>
            <li>本サービスを商用目的で利用することは禁止されています</li>
            <li>他のユーザーのプライバシーを保護する必要があります</li>
          </ul>
        </section>

        <section className="terms-section">
          <h2>3. 禁止事項</h2>
          <ul>
            <li>ハラスメント、脅迫、または差別的な行為</li>
            <li>性的なコンテンツや不適切な言動</li>
            <li>スパムや詐欺的な活動</li>
            <li>著作権や知的財産権の侵害</li>
            <li>システムへの不正アクセスやハッキング試行</li>
          </ul>
        </section>

        <section className="terms-section">
          <h2>4. レッスンについて</h2>
          <ul>
            <li>各レッスンは15分間です</li>
            <li>マッチング後のキャンセルは事前に通知してください</li>
            <li>レッスン内での録音・録画は禁止されています</li>
            <li>レッスン内容は個人的な学習目的に限定されます</li>
          </ul>
        </section>

        <section className="terms-section">
          <h2>5. 評価システム</h2>
          <p>
            各ユーザーは、レッスン終了後に相手を評価できます。
            評価は今後のマッチングの参考になります。
            不公正な評価は禁止されています。
          </p>
        </section>

        <section className="terms-section">
          <h2>6. 免責事項</h2>
          <p>
            本サービスはできるだけ正確な情報を提供するよう努めていますが、
            品質や継続性について明確な保証はしません。
            サービス利用によって生じた損害について、当社は責任を負いません。
          </p>
        </section>

        <section className="terms-section">
          <h2>7. サービスの中断</h2>
          <p>
            当社は、以下の理由により予告なくサービスを中断・終了することがあります：
          </p>
          <ul>
            <li>システムメンテナンス</li>
            <li>技術的な問題</li>
            <li>ユーザーの規約違反</li>
            <li>不可抗力による事由</li>
          </ul>
        </section>

        <section className="terms-section">
          <h2>8. 利用規約の変更</h2>
          <p>
            当社は、必要に応じて利用規約を変更することができます。
            変更は公告時点から有効となり、ユーザーは変更後も
            サービスを利用することで同意したものとみなします。
          </p>
        </section>

        <section className="terms-section">
          <h2>9. 準拠法</h2>
          <p>
            本利用規約は日本国法に準拠し、
            日本の裁判所が排他的管轄権を有します。
          </p>
        </section>

        <section className="terms-section">
          <h2>10. お問い合わせ</h2>
          <p>
            利用規約についてご質問がある場合は、
            「お問い合わせ」ページからご連絡ください。
          </p>
        </section>

        <div className="terms-footer">
          <p>最終更新：2025年11月15日</p>
        </div>
      </div>
    </div>
  );
};

export default TermsOfService;
