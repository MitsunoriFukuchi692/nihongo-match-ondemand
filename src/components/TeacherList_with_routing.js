import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const TeacherList = ({ teachers, socket, isConnected }) => {
  const navigate = useNavigate(); // ✅ useNavigate を使用
  const [selectedTeacherId, setSelectedTeacherId] = useState(null);
  const [studentName, setStudentName] = useState('');
  const [proficiencyLevel, setProficiencyLevel] = useState('');
  const [lessonTopic, setLessonTopic] = useState('');
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState(''); // 'success', 'error', 'info'
  const [teacherRatings, setTeacherRatings] = useState({}); // 講師の評価を保存
  const [studentRatings, setStudentRatings] = useState({}); // 学習者の本気度を保存
  const [loadingRatings, setLoadingRatings] = useState(true); // 評価ロード中フラグ

  // ✅ 講師の評価を取得
  useEffect(() => {
    if (!socket || teachers.length === 0) return;

    console.log('📊 講師の評価を取得中...');
    setLoadingRatings(true);

    // 各講師の評価を取得
    teachers.forEach((teacher) => {
      socket.emit('get_teacher_rating', teacher.socketId, (response) => {
        console.log(`📊 講師 ${teacher.name} の評価:`, response);
        setTeacherRatings((prev) => ({
          ...prev,
          [teacher.socketId]: response
        }));
      });

      // 学習者の本気度評価も取得
      socket.emit('get_student_rating', teacher.socketId, (response) => {
        console.log(`🎓 講師 ${teacher.name} の学習者評価:`, response);
        setStudentRatings((prev) => ({
          ...prev,
          [teacher.socketId]: response
        }));
      });
    });

    setTimeout(() => {
      setLoadingRatings(false);
    }, 1000);
  }, [socket, teachers]);

  // 「今すぐ開始」ボタンをクリック
  const handleStartLesson = (teacherId) => {
    if (!isConnected) {
      setMessage('❌ サーバーに接続されていません。');
      setMessageType('error');
      return;
    }

    if (!studentName.trim()) {
      setMessage('❌ あなたの名前を入力してください。');
      setMessageType('error');
      return;
    }

    if (!proficiencyLevel) {
      setMessage('❌ 日本語レベルを選択してください。');
      setMessageType('error');
      return;
    }

    if (!lessonTopic.trim()) {
      setMessage('❌ レッスンのテーマを入力してください。');
      setMessageType('error');
      return;
    }

    // リクエストを送信
    const studentData = {
      name: studentName,
      proficiencyLevel: proficiencyLevel,
      lessonTopic: lessonTopic,
      selectedTeacherId: teacherId,
    };

    socket.emit('request_lesson', studentData);
    console.log('🎓 レッスンをリクエストしました:', studentData);
    setMessage('⏳ 講師にマッチング中です...');
    setMessageType('info');

    // レッスンがマッチングされた
    socket.on('lesson_matched', (data) => {
      setMessage(`✅ マッチング成功！${data.teacherName}と接続されました。`);
      setMessageType('success');
      console.log('✅ レッスンマッチング成功:', data);
      // ここでLessonRoomに遷移する処理を追加（後で実装）
    });

    // レッスンがマッチングされなかった（待機キューに追加）
    socket.on('queued', (data) => {
      setMessage(`⏳ ${data.message}\n番号: ${data.queuePosition}\n予想待ち時間: ${data.estimatedWaitTime}`);
      setMessageType('info');
      console.log('⏳ 待機キューに追加されました:', data);
    });

    // エラー
    socket.on('error', (data) => {
      setMessage(`❌ ${data.message}`);
      setMessageType('error');
    });
  };

  // 評価を星で表示
  const renderStars = (rating) => {
    if (!rating) return '未評価';
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;
    let stars = '⭐'.repeat(fullStars);
    if (hasHalfStar) stars += '✨';
    return `${stars} ${rating}`;
  };

  // ✅ 講師詳細ページに遷移
  const handleViewTeacherProfile = (teacherId) => {
    console.log('📄 講師詳細ページに遷移:', teacherId);
    navigate(`/teacher/${teacherId}`);
  };

  return (
    <div className="teacher-list-container">
      <h2>📚 オンライン講師</h2>

      {/* メッセージ表示 */}
      {message && (
        <div className={`message message-${messageType}`}>
          {message}
        </div>
      )}

      {/* 接続確認 */}
      {!isConnected && (
        <div className="warning-box">
          ⚠️ バックエンドサーバーに接続されていません。
          <br />
          リアルタイム機能が使用できません。
        </div>
      )}

      {teachers.length === 0 ? (
        <div className="empty-state">
          <p>📭 現在オンラインの講師はいません。</p>
          <p>しばらくしてから、もう一度確認してください。</p>
        </div>
      ) : (
        <>
          <p className="teacher-count">
            現在 <strong>{teachers.length}</strong> 名の講師がオンラインです
          </p>

          {/* 学習者情報フォーム */}
          <div className="lesson-request-form">
            <h3>📋 レッスン情報を入力</h3>

            <div className="form-group">
              <label>あなたの名前 *</label>
              <input
                type="text"
                value={studentName}
                onChange={(e) => setStudentName(e.target.value)}
                placeholder="例: 太郎"
              />
            </div>

            <div className="form-group">
              <label>日本語レベル *</label>
              <select
                value={proficiencyLevel}
                onChange={(e) => setProficiencyLevel(e.target.value)}
              >
                <option value="">選択してください</option>
                <option value="全く話せない">全く話せない</option>
                <option value="少し話せる">少し話せる</option>
                <option value="日常会話ができる">日常会話ができる</option>
                <option value="ビジネス日本語が必要">ビジネス日本語が必要</option>
              </select>
            </div>

            <div className="form-group">
              <label>レッスンのテーマ *</label>
              <textarea
                value={lessonTopic}
                onChange={(e) => setLessonTopic(e.target.value)}
                placeholder="例: 日常会話、発音練習、敬語の使い方"
                rows="3"
              />
            </div>
          </div>

          {/* 評価ロード中 */}
          {loadingRatings && (
            <div style={{
              padding: '10px',
              backgroundColor: '#fff3cd',
              borderRadius: '5px',
              marginBottom: '15px',
              textAlign: 'center'
            }}>
              ⏳ 講師の評価情報を読み込み中...
            </div>
          )}

          {/* 講師カード */}
          <div className="teacher-grid">
            {teachers.map((teacher) => {
              const teacherRating = teacherRatings[teacher.socketId];
              const studentRating = studentRatings[teacher.socketId];

              return (
                <div key={teacher.socketId} className="teacher-card">
                  <div className="teacher-header">
                    <h3>👨‍🏫 {teacher.name}</h3>
                    <span className="online-badge">🟢 オンライン</span>
                  </div>

                  {/* ✅ 評価情報を表示 */}
                  <div className="teacher-ratings" style={{
                    padding: '10px',
                    backgroundColor: '#f0f8ff',
                    borderRadius: '5px',
                    marginBottom: '10px',
                    fontSize: '14px'
                  }}>
                    {teacherRating && teacherRating.count > 0 ? (
                      <p style={{ margin: '5px 0' }}>
                        <strong>⭐ 教え方:</strong> {renderStars(parseFloat(teacherRating.average))} ({teacherRating.count}件)
                      </p>
                    ) : (
                      <p style={{ margin: '5px 0', color: '#666' }}>
                        <strong>⭐ 教え方:</strong> 未評価
                      </p>
                    )}

                    {studentRating && studentRating.count > 0 ? (
                      <p style={{ margin: '5px 0' }}>
                        <strong>🎓 本気度:</strong> {renderStars(parseFloat(studentRating.average))} ({studentRating.count}人)
                      </p>
                    ) : (
                      <p style={{ margin: '5px 0', color: '#666' }}>
                        <strong>🎓 本気度:</strong> 未評価
                      </p>
                    )}
                  </div>

                  <div className="teacher-info">
                    <p>
                      <strong>📧 メール:</strong> {teacher.email}
                    </p>
                    <p>
                      <strong>📊 対応レベル:</strong> {teacher.proficiency}
                    </p>
                    <p>
                      <strong>⏰ 対応時間:</strong> {teacher.timeSlots}
                    </p>
                  </div>

                  <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                    <button
                      className="btn btn-start-lesson"
                      onClick={() => handleStartLesson(teacher.socketId)}
                      disabled={!isConnected || !studentName || !proficiencyLevel || !lessonTopic}
                      style={{ flex: 1 }}
                    >
                      🎓 今すぐ開始
                    </button>
                    <button
                      className="btn btn-info"
                      style={{ flex: 1 }}
                      onClick={() => handleViewTeacherProfile(teacher.socketId)}
                    >
                      📄 詳細
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
};

export default TeacherList;
