import React, { useState } from 'react';

const Contact = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // バリデーション
    if (!name || !email || !subject || !message) {
      setError('すべてのフィールドを入力してください');
      return;
    }

    if (!email.includes('@')) {
      setError('有効なメールアドレスを入力してください');
      return;
    }

    if (message.length < 10) {
      setError('お問い合わせ内容は10文字以上である必要があります');
      return;
    }

    setLoading(true);

    // LocalStorage に保存
    const contacts = JSON.parse(localStorage.getItem('contacts') || '[]');
    const newContact = {
      id: Date.now(),
      name,
      email,
      subject,
      message,
      createdAt: new Date().toISOString(),
      status: 'new'
    };

    contacts.push(newContact);
    localStorage.setItem('contacts', JSON.stringify(contacts));

    setTimeout(() => {
      setSuccess('✅ お問い合わせが送信されました。ご連絡ありがとうございます。');
      setName('');
      setEmail('');
      setSubject('');
      setMessage('');
      setLoading(false);

      // 3秒後にメッセージを消す
      setTimeout(() => {
        setSuccess('');
      }, 3000);
    }, 500);
  };

  return (
    <div className="contact-container">
      <div className="contact-card">
        <h2>📧 お問い合わせ</h2>
        <p className="contact-description">
          ご質問、ご提案、バグ報告など、お気軽にお問い合わせください。
          <br />
          内容を確認して、可能な限り早くご返信いたします。
        </p>

        <form onSubmit={handleSubmit} className="contact-form">
          <div className="form-group">
            <label>👤 お名前 <span className="required">*</span></label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="田中太郎"
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label>📧 メールアドレス <span className="required">*</span></label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="example@gmail.com"
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label>📝 件名 <span className="required">*</span></label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="例：チャット機能について"
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label>💬 お問い合わせ内容 <span className="required">*</span></label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="お問い合わせ内容をここに入力してください（10文字以上）"
              rows="6"
              disabled={loading}
            />
            <p className="form-hint">
              {message.length} / 最低10文字
            </p>
          </div>

          {error && <div className="error-message">❌ {error}</div>}
          {success && <div className="success-message">{success}</div>}

          <button 
            type="submit" 
            className="contact-button"
            disabled={loading}
          >
            {loading ? '⏳ 送信中...' : '📧 送信'}
          </button>
        </form>

        <div className="contact-info">
          <h3>📞 その他の連絡方法</h3>
          <p>
            緊急のご連絡は、以下の方法でもお受けしています：
          </p>
          <ul>
            <li>📧 Email: support@robostudy.jp</li>
            <li>🐦 Twitter: @robostudy_official</li>
            <li>📱 LINE: @robostudy</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default Contact;
