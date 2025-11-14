import React, { useState, useEffect } from 'react';

const TeacherProfile = ({ socket, teacherId, onBack }) => {
  const [teacherInfo, setTeacherInfo] = useState(null);
  const [teacherRating, setTeacherRating] = useState(null);
  const [studentRating, setStudentRating] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  // 講師情報と評価を取得
  useEffect(() => {
    if (!socket || !teacherId) return;

    console.log('📊 講師情報と評価を取得中:', teacherId);

    // 講師の教え方評価
    socket.emit('get_teacher_rating', teacherId, (response) => {
      console.log('⭐ 講師評価:', response);
      setTeacherRating(response);
    });

    // 学習者の本気度評価
    socket.emit('get_student_rating', teacherId, (response) => {
      console.log('🎓 学習者評価:', response);
      setStudentRating(response);
    });

    // 評価一覧を取得
    socket.emit('get_teacher_reviews', teacherId, (response) => {
      console.log('📝 評価一覧:', response);
      setReviews(response);
      setLoading(false);
    });
  }, [socket, teacherId]);

  if (loading) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        ⏳ 読み込み中...
      </div>
    );
  }

  // 星を表示
  const renderStars = (rating) => {
    if (!rating) return '未評価';
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;
    let stars = '⭐'.repeat(fullStars);
    if (hasHalfStar) stars += '✨';
    return `${stars} ${rating}`;
  };

  return (
    <div style={{
      maxWidth: '800px',
      margin: '0 auto',
      padding: '20px'
    }}>
      {/* 戻るボタン */}
      <button
        onClick={onBack}
        style={{
          padding: '8px 16px',
          backgroundColor: '#6c757d',
          color: 'white',
          border: 'none',
          borderRadius: '5px',
          cursor: 'pointer',
          marginBottom: '20px',
          fontSize: '14px'
        }}
      >
        ← 戻る
      </button>

      {/* プロフィール情報 */}
      <div style={{
        padding: '20px',
        backgroundColor: '#f8f9fa',
        borderRadius: '8px',
        marginBottom: '20px',
        border: '1px solid #dee2e6'
      }}>
        <h2>👨‍🏫 講師プロフィール</h2>
        
        {/* 基本情報 */}
        <div style={{
          padding: '15px',
          backgroundColor: '#fff',
          borderRadius: '5px',
          marginBottom: '15px'
        }}>
          <h3 style={{ marginTop: 0 }}>基本情報</h3>
          <p><strong>講師ID:</strong> {teacherId}</p>
          {/* 他の講師情報があれば表示 */}
        </div>

        {/* 評価情報 */}
        <div style={{
          padding: '15px',
          backgroundColor: '#e7f3ff',
          borderRadius: '5px',
          marginBottom: '15px'
        }}>
          <h3 style={{ marginTop: 0 }}>📊 評価情報</h3>

          {teacherRating && teacherRating.count > 0 ? (
            <div style={{ marginBottom: '10px' }}>
              <p><strong>⭐ 教え方の評価:</strong></p>
              <p style={{ fontSize: '18px', color: '#ffc107' }}>
                {renderStars(parseFloat(teacherRating.average))}
              </p>
              <p style={{ color: '#666' }}>
                {teacherRating.count}人の学習者から評価されています
              </p>
            </div>
          ) : (
            <p style={{ color: '#999' }}>⭐ 教え方: 未評価</p>
          )}

          {studentRating && studentRating.count > 0 ? (
            <div>
              <p><strong>🎓 学習者の本気度:</strong></p>
              <p style={{ fontSize: '18px', color: '#28a745' }}>
                {renderStars(parseFloat(studentRating.average))}
              </p>
              <p style={{ color: '#666' }}>
                {studentRating.count}人の講師から評価されています
              </p>
            </div>
          ) : (
            <p style={{ color: '#999' }}>🎓 本気度: 未評価</p>
          )}
        </div>
      </div>

      {/* 評価一覧 */}
      <div style={{
        padding: '20px',
        backgroundColor: '#f8f9fa',
        borderRadius: '8px',
        border: '1px solid #dee2e6'
      }}>
        <h2>📝 評価一覧</h2>

        {reviews.length === 0 ? (
          <p style={{ textAlign: 'center', color: '#666' }}>
            📭 評価はまだありません
          </p>
        ) : (
          <div>
            {reviews.map((review, index) => (
              <div
                key={index}
                style={{
                  padding: '15px',
                  backgroundColor: '#fff',
                  borderRadius: '5px',
                  marginBottom: '10px',
                  border: '1px solid #dee2e6'
                }}
              >
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '10px'
                }}>
                  <div>
                    <p style={{ margin: '0 0 5px 0', fontWeight: 'bold' }}>
                      👤 {review.evaluatorName}
                    </p>
                    <p style={{ margin: 0, fontSize: '12px', color: '#666' }}>
                      {review.evaluatorRole === 'teacher' ? '講師' : '学習者'}
                    </p>
                  </div>
                  <p style={{
                    fontSize: '18px',
                    margin: 0,
                    color: '#ffc107'
                  }}>
                    {'⭐'.repeat(review.rating)}
                  </p>
                </div>

                {review.comment && (
                  <p style={{
                    margin: '10px 0 0 0',
                    padding: '10px',
                    backgroundColor: '#f8f9fa',
                    borderLeft: '4px solid #007bff',
                    borderRadius: '3px',
                    color: '#333'
                  }}>
                    💬 {review.comment}
                  </p>
                )}

                <p style={{
                  margin: '10px 0 0 0',
                  fontSize: '12px',
                  color: '#999'
                }}>
                  {new Date(review.timestamp).toLocaleString('ja-JP')}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default TeacherProfile;
