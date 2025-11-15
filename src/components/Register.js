import React, { useState } from 'react';

const Register = ({ onRegisterSuccess }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // バリデーション
    if (!name || !email || !password || !passwordConfirm) {
      setError('すべてのフィールドを入力してください');
      return;
    }

    if (!email.includes('@')) {
      setError('有効なメールアドレスを入力してください');
      return;
    }

    if (password.length < 6) {
      setError('パスワードは6文字以上である必要があります');
      return;
    }

    if (password !== passwordConfirm) {
      setError('パスワードが一致しません');
      return;
    }

    setLoading(true);

    // LocalStorage から既存ユーザーを取得
    const users = JSON.parse(localStorage.getItem('users') || '[]');

    // 既に登録されているメールかチェック
    if (users.some(u => u.email === email)) {
      setError('このメールアドレスは既に登録されています');
      setLoading(false);
      return;
    }

    // 新規ユーザーを作成
    const newUser = {
      id: Date.now(),
      name,
      email,
      password,
      createdAt: new Date().toISOString()
    };

    // LocalStorage に保存
    users.push(newUser);
    localStorage.setItem('users', JSON.stringify(users));

    setTimeout(() => {
      setSuccess('✅ アカウントが作成されました！ログインしてください。');
      setName('');
      setEmail('');
      setPassword('');
      setPasswordConfirm('');
      setLoading(false);

      // 3秒後にログイン画面に遷移
      setTimeout(() => {
        onRegisterSuccess(newUser);
      }, 1500);
    }, 500);
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2>📝 新規登録</h2>
        
        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label>👤 名前</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="田中太郎"
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label>📧 メールアドレス</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="example@gmail.com"
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label>🔑 パスワード</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="6文字以上"
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label>🔑 パスワード（確認）</label>
            <input
              type="password"
              value={passwordConfirm}
              onChange={(e) => setPasswordConfirm(e.target.value)}
              placeholder="パスワードを再度入力"
              disabled={loading}
            />
          </div>

          {error && <div className="error-message">❌ {error}</div>}
          {success && <div className="success-message">{success}</div>}

          <button 
            type="submit" 
            className="auth-button"
            disabled={loading}
          >
            {loading ? '⏳ 登録中...' : '📝 登録'}
          </button>
        </form>

        <p className="auth-link">
          既にアカウントをお持ちですか？
          <br />
          <a href="#login">🔐 ログインはこちら</a>
        </p>
      </div>
    </div>
  );
};

export default Register;
