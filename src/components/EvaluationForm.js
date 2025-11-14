import React, { useState } from 'react';

const EvaluationForm = ({ 
  socket, 
  userRole, 
  currentUserName,
  otherUserSocketId,
  otherUserName,
  onSubmit 
}) => {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async () => {
    if (rating === 0) {
      alert('評価を選んでください');
      return;
    }

    setIsSubmitting(true);

    try {
      const evaluationData = {
        evaluatorId: socket.id,
        evaluatorRole: userRole,
        evaluatorName: currentUserName,
        targetId: otherUserSocketId,
        targetRole: userRole === 'teacher' ? 'student' : 'teacher',
        targetName: otherUserName,
        rating: rating,
        comment: comment.trim(),
        timestamp: new Date().toISOString()
      };

      console.log('📤 評価を送信:', evaluationData);

      // Socket.io で送信
      socket.emit('submit_evaluation', evaluationData, (response) => {
        console.log('✅ 評価送信成功:', response);
        setSubmitted(true);
        
        // 2秒後に親コンポーネントに通知
        setTimeout(() => {
          if (onSubmit) {
            onSubmit();
          }
        }, 2000);
      });
    } catch (error) {
      console.error('❌ 評価送信エラー:', error);
      alert('評価の送信に失敗しました');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div style={{
        padding: '20px',
        borderRadius: '8px',
        backgroundColor: '#d4edda',
        border: '1px solid #c3e6cb',
        textAlign: 'center'
      }}>
        <h3>✅ 評価ありがとうございます！</h3>
        <p>あなたの評価はプラットフォームで公開されます。</p>
      </div>
    );
  }

  const roleLabel = userRole === 'teacher' ? '学習者' : '講師';
  const ratingLabel = userRole === 'teacher' ? '本気度と学習態度' : '教え方';

  return (
    <div style={{
      padding: '20px',
      backgroundColor: '#f8f9fa',
      borderRadius: '8px',
      border: '1px solid #dee2e6',
      marginTop: '20px'
    }}>
      <h3>🌟 {roleLabel}を評価してください</h3>
      
      {/* ユーザー情報 */}
      <div style={{
        padding: '10px',
        backgroundColor: '#e7f3ff',
        borderRadius: '5px',
        marginBottom: '15px',
        fontSize: '14px'
      }}>
        <p><strong>対象者:</strong> {otherUserName}</p>
        <p><strong>評価項目:</strong> {ratingLabel}</p>
      </div>

      {/* 評価スター */}
      <div style={{
        display: 'flex',
        gap: '10px',
        marginBottom: '15px',
        fontSize: '40px'
      }}>
        {[1, 2, 3, 4, 5].map((star) => (
          <span
            key={star}
            onClick={() => setRating(star)}
            onMouseEnter={() => setHoverRating(star)}
            onMouseLeave={() => setHoverRating(0)}
            style={{
              cursor: 'pointer',
              color: star <= (hoverRating || rating) ? '#ffc107' : '#ddd',
              transition: 'color 0.2s',
              userSelect: 'none'
            }}
          >
            ⭐
          </span>
        ))}
      </div>

      {/* 評価表示 */}
      {rating > 0 && (
        <p style={{
          fontSize: '18px',
          fontWeight: 'bold',
          color: '#333',
          marginBottom: '15px'
        }}>
          評価: <span style={{ color: '#ffc107' }}>⭐ {rating}.0</span>
        </p>
      )}

      {/* コメント入力 */}
      <div style={{
        marginBottom: '15px'
      }}>
        <label style={{
          display: 'block',
          marginBottom: '8px',
          fontWeight: 'bold',
          fontSize: '14px'
        }}>
          💬 コメント（任意）
        </label>
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder={`${otherUserName}についてのコメント... (最大200字)`}
          maxLength={200}
          style={{
            width: '100%',
            padding: '10px',
            borderRadius: '5px',
            border: '1px solid #ddd',
            fontFamily: 'sans-serif',
            fontSize: '14px',
            minHeight: '80px',
            resize: 'vertical',
            boxSizing: 'border-box'
          }}
        />
        <p style={{
          fontSize: '12px',
          color: '#666',
          marginTop: '5px'
        }}>
          {comment.length} / 200
        </p>
      </div>

      {/* 送信ボタン */}
      <button
        onClick={handleSubmit}
        disabled={rating === 0 || isSubmitting}
        style={{
          padding: '12px 24px',
          backgroundColor: rating > 0 && !isSubmitting ? '#007bff' : '#ccc',
          color: 'white',
          border: 'none',
          borderRadius: '5px',
          fontSize: '16px',
          fontWeight: 'bold',
          cursor: rating > 0 && !isSubmitting ? 'pointer' : 'not-allowed',
          width: '100%'
        }}
      >
        {isSubmitting ? '送信中...' : '✅ 評価を送信'}
      </button>

      {/* 注意事項 */}
      <div style={{
        marginTop: '15px',
        padding: '10px',
        backgroundColor: '#fff3cd',
        borderRadius: '5px',
        fontSize: '12px',
        color: '#856404',
        borderLeft: '4px solid #ffc107'
      }}>
        <p>📌 <strong>注意:</strong> この評価は公開されます。講師と学習者の質を保つため、正直で誠実な評価をお願いします。</p>
      </div>
    </div>
  );
};

export default EvaluationForm;
