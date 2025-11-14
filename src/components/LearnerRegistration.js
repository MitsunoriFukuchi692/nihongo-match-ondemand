import React, { useState } from 'react';

function LearnerRegistration({ onSubmit }) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    preferredTime: 'morning',
    level: 'beginner'
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      alert('名前を入力してください');
      return;
    }

    if (!formData.email.trim()) {
      alert('メールアドレスを入力してください');
      return;
    }

    setIsSubmitting(true);
    setMessage('');

    try {
      // localStorageに保存
      const learnerData = {
        id: Date.now(),
        name: formData.name,
        email: formData.email,
        proficiencyLevel: formData.level,
        preferredTime: formData.preferredTime,
        registeredAt: new Date().toISOString()
      };

      localStorage.setItem('currentLearner', JSON.stringify(learnerData));
      console.log('✅ 学習者情報をlocalStorageに保存しました:', learnerData);

      // 親コンポーネントに通知
      onSubmit(learnerData);

      // フォームをリセット
      setFormData({
        name: '',
        email: '',
        preferredTime: 'morning',
        level: 'beginner'
      });

      setMessage('✅ 登録が完了しました！ホームに移動します...');
      
      // 2秒後にホームに自動遷移（App.jsで処理）
      setTimeout(() => {
        console.log('🏠 ホームページに移動します');
      }, 2000);

    } catch (error) {
      console.error('❌ 登録エラー:', error);
      alert('登録中にエラーが発生しました');
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{
      maxWidth: '500px',
      margin: '0 auto',
      padding: '20px'
    }}>
      <h2 style={{ textAlign: 'center', marginBottom: '30px' }}>
        🎓 学習者登録
      </h2>

      {message && (
        <div style={{
          padding: '15px',
          backgroundColor: '#d4edda',
          borderRadius: '5px',
          color: '#155724',
          marginBottom: '20px',
          textAlign: 'center',
          fontWeight: 'bold'
        }}>
          {message}
        </div>
      )}

      <form onSubmit={handleSubmit} style={{
        backgroundColor: '#f8f9fa',
        padding: '20px',
        borderRadius: '8px',
        border: '1px solid #dee2e6'
      }}>
        {/* 名前 */}
        <div style={{
          marginBottom: '20px'
        }}>
          <label style={{
            display: 'block',
            marginBottom: '8px',
            fontWeight: 'bold',
            fontSize: '14px'
          }}>
            名前 *
          </label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="例：太郎"
            disabled={isSubmitting}
            style={{
              width: '100%',
              padding: '12px',
              borderRadius: '5px',
              border: '1px solid #ddd',
              fontSize: '14px',
              boxSizing: 'border-box'
            }}
          />
        </div>

        {/* メールアドレス */}
        <div style={{
          marginBottom: '20px'
        }}>
          <label style={{
            display: 'block',
            marginBottom: '8px',
            fontWeight: 'bold',
            fontSize: '14px'
          }}>
            メールアドレス *
          </label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="例：taro@example.com"
            disabled={isSubmitting}
            style={{
              width: '100%',
              padding: '12px',
              borderRadius: '5px',
              border: '1px solid #ddd',
              fontSize: '14px',
              boxSizing: 'border-box'
            }}
          />
        </div>

        {/* 希望時間帯 */}
        <div style={{
          marginBottom: '20px'
        }}>
          <label style={{
            display: 'block',
            marginBottom: '8px',
            fontWeight: 'bold',
            fontSize: '14px'
          }}>
            希望時間帯
          </label>
          <select 
            name="preferredTime" 
            value={formData.preferredTime} 
            onChange={handleChange}
            disabled={isSubmitting}
            style={{
              width: '100%',
              padding: '12px',
              borderRadius: '5px',
              border: '1px solid #ddd',
              fontSize: '14px',
              boxSizing: 'border-box'
            }}
          >
            <option value="morning">朝（6:00-12:00）</option>
            <option value="afternoon">昼（12:00-18:00）</option>
            <option value="evening">夜（18:00-24:00）</option>
          </select>
        </div>

        {/* 日本語レベル */}
        <div style={{
          marginBottom: '20px'
        }}>
          <label style={{
            display: 'block',
            marginBottom: '8px',
            fontWeight: 'bold',
            fontSize: '14px'
          }}>
            現在の日本語レベル *
          </label>
          <select 
            name="level" 
            value={formData.level} 
            onChange={handleChange}
            disabled={isSubmitting}
            style={{
              width: '100%',
              padding: '12px',
              borderRadius: '5px',
              border: '1px solid #ddd',
              fontSize: '14px',
              boxSizing: 'border-box'
            }}
          >
            <option value="beginner">初級</option>
            <option value="intermediate">中級</option>
            <option value="advanced">上級</option>
          </select>
        </div>

        {/* 登録ボタン */}
        <button 
          type="submit" 
          disabled={isSubmitting}
          style={{
            width: '100%',
            padding: '14px',
            backgroundColor: isSubmitting ? '#ccc' : '#1abc9c',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            fontSize: '16px',
            fontWeight: 'bold',
            cursor: isSubmitting ? 'not-allowed' : 'pointer',
            transition: 'background-color 0.3s'
          }}
        >
          {isSubmitting ? '登録中...' : '✅ 登録'}
        </button>
      </form>

      {/* 情報 */}
      <div style={{
        marginTop: '30px',
        padding: '15px',
        backgroundColor: '#e7f3ff',
        borderRadius: '5px',
        fontSize: '13px',
        color: '#004085',
        lineHeight: '1.6'
      }}>
        <p style={{ marginTop: 0 }}>
          <strong>ℹ️ 登録後について：</strong>
        </p>
        <p style={{ marginBottom: 0 }}>
          登録完了後、自動的にホームページに移動します。
          <br />
          そこで、登録時の情報が自動入力された状態で、
          <br />
          レッスンのテーマを入力して講師を選択できます。
        </p>
      </div>
    </div>
  );
}

export default LearnerRegistration;
