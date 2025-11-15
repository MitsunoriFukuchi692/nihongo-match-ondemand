import React, { useState } from 'react';

const Login = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    // バリデーション
    if (!email || !password) {
      setError('メールアドレスとパスワードを入力してください');
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

    setLoading(true);

    // LocalStorage からユーザーデータを取得
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const user = users.find(u => u.email === email && u.password === password);

    setTimeout(() => {
      if (user) {
        // ログイン成功
        localStorage.setItem('currentUser', JSON.stringify({
          id: user.id,
          email: user.email,
          name: user.name,
          loginTime: new Date().toISOString()
        }));
        console.log('✅ ログイン成功:', user.name);
        onLoginSuccess(user);
      } else {
        // ログイン失敗
        setError('メールアドレスまたはパスワードが正しくありません');
        setLoading(false);
      }
    }, 500);
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2>🔐 ログイン</h2>
        
        <form onSubmit={handleSubmit} className="auth-form">
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

          {error && <div className="error-message">❌ {error}</div>}

          <button 
            type="submit" 
            className="auth-button"
            disabled={loading}
          >
            {loading ? '⏳ ログイン中...' : '🔐 ログイン'}
          </button>
        </form>

        <p className="auth-link">
          アカウントをお持ちでありませんか？
          <br />
          <a href="#register">📝 新規登録はこちら</a>
        </p>
      </div>
    </div>
  );
};

export default Login;
