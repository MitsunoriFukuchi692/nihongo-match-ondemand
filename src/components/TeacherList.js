import React, { useState, useEffect } from 'react';

const TeacherList = ({ teachers, socket, isConnected, onViewProfile, onMatched }) => {
  const [studentName, setStudentName] = useState('');
  const [proficiencyLevel, setProficiencyLevel] = useState('');
  const [lessonTopic, setLessonTopic] = useState('');
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState(''); // 'success', 'error', 'info'
  const [teacherRatings, setTeacherRatings] = useState({}); // 講師の評価を保存
  const [studentRatings, setStudentRatings] = useState({}); // 学習者の本気度を保存
  const [loadingRatings, setLoadingRatings] = useState(true); // 評価ロード中フラグ
  const [isLearnerRegistered, setIsLearnerRegistered] = useState(false); // 学習者登録済みフラグ

  // ✅ ページ読み込み時に、localStorageから学習者情報を読み込む
  useEffect(() => {
    const learnerData = localStorage.getItem('currentLearner');
    
    if (learnerData) {
      try {
        const learner = JSON.parse(learnerData);
        console.log('✅ localStorageから学習者情報を読み込みました:', learner);
        
        // フォームに自動入力
        setStudentName(learner.name);
        setProficiencyLevel(learner.proficiencyLevel);
        setIsLearnerRegistered(true);

        console.log('📝 フォームに自動入力:');
        console.log(`   名前: ${learner.name}`);
        console.log(`   レベル: ${learner.proficiencyLevel}`);
      } catch (error) {
        console.error('❌ 学習者情報の読み込みエラー:', error);
      }
    } else {
      console.log('⚠️ 学習者情報が登録されていません。先に「学習者登録」をしてください。');
      setIsLearnerRegistered(false);
    }
  }, []);

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
      
      // 親コンポーネント（App.js）に通知
      if (onMatched) {
        onMatched(data, {
          name: studentName,
          level: proficiencyLevel,
          lessonTopic: lessonTopic
        });
      }
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
    if (onViewProfile) {
      onViewProfile(teacherId);
    }
  };

  return (
    <div className="teacher-list-container" style={{ padding: '20px' }}>
      <h2>📚 日本語会話マッチング</h2>

      {/* メッセージ表示 */}
      {message && (
        <div 
          className={`message message-${messageType}`}
          style={{
            padding: '15px',
            borderRadius: '5px',
            marginBottom: '20px',
            backgroundColor: messageType === 'error' ? '#f8d7da' : 
                           messageType === 'success' ? '#d4edda' : '#d1ecf1',
            color: messageType === 'error' ? '#721c24' : 
                   messageType === 'success' ? '#155724' : '#0c5460',
            border: '1px solid',
            borderColor: messageType === 'error' ? '#f5c6cb' : 
                        messageType === 'success' ? '#c3e6cb' : '#bee5eb'
          }}
        >
          {message}
        </div>
      )}

      {/* 接続確認 */}
      {!isConnected && (
        <div style={{
          padding: '15px',
          backgroundColor: '#fff3cd',
          borderRadius: '5px',
          marginBottom: '20px',
          color: '#856404',
          border: '1px solid #ffeeba'
        }}>
          ⚠️ バックエンドサーバーに接続されていません。
          <br />
          リアルタイム機能が使用できません。
        </div>
      )}

      {/* 学習者未登録の警告 */}
      {!isLearnerRegistered && (
        <div style={{
          padding: '15px',
          backgroundColor: '#f8d7da',
          borderRadius: '5px',
          marginBottom: '20px',
          color: '#721c24',
          border: '1px solid #f5c6cb'
        }}>
          <strong>⚠️ 学習者登録が必要です</strong>
          <br />
          ナビゲーションの「学習者登録」から、先に登録してください。
        </div>
      )}

      {/* ===== レッスン情報入力フォーム ===== */}
      <div style={{
        padding: '20px',
        backgroundColor: '#f8f9fa',
        borderRadius: '8px',
        border: '1px solid #dee2e6',
        marginBottom: '30px'
      }}>
        <h3>📋 レッスン情報を入力</h3>
        
        {isLearnerRegistered ? (
          <p style={{ color: '#28a745', fontWeight: 'bold' }}>
            ✅ 登録済みです。下のテーマを入力して、講師を選択してください。
          </p>
        ) : (
          <p style={{ color: '#dc3545', fontWeight: 'bold' }}>
            ❌ 学習者登録をしてから利用してください。
          </p>
        )}

        {/* 名前（自動入力・読み取り専用） */}
        <div style={{ marginBottom: '15px' }}>
          <label style={{
            display: 'block',
            marginBottom: '5px',
            fontWeight: 'bold',
            fontSize: '14px'
          }}>
            <strong>名前</strong> <span style={{ color: '#28a745' }}>（登録情報）</span>
          </label>
          <input
            type="text"
            value={studentName}
            readOnly
            placeholder="学習者登録をしてください"
            style={{
              width: '100%',
              padding: '10px',
              borderRadius: '5px',
              border: '1px solid #ddd',
              fontSize: '14px',
              boxSizing: 'border-box',
              backgroundColor: '#e9ecef',
              cursor: 'not-allowed'
            }}
          />
          <p style={{ fontSize: '12px', color: '#666', marginTop: '5px' }}>
            ※ 学習者登録時の情報が表示されます
          </p>
        </div>

        {/* レベル（自動入力・読み取り専用） */}
        <div style={{ marginBottom: '15px' }}>
          <label style={{
            display: 'block',
            marginBottom: '5px',
            fontWeight: 'bold',
            fontSize: '14px'
          }}>
            <strong>日本語レベル</strong> <span style={{ color: '#28a745' }}>（登録情報）</span>
          </label>
          <input
            type="text"
            value={proficiencyLevel || '未設定'}
            readOnly
            style={{
              width: '100%',
              padding: '10px',
              borderRadius: '5px',
              border: '1px solid #ddd',
              fontSize: '14px',
              boxSizing: 'border-box',
              backgroundColor: '#e9ecef',
              cursor: 'not-allowed'
            }}
          />
          <p style={{ fontSize: '12px', color: '#666', marginTop: '5px' }}>
            ※ 学習者登録時の情報が表示されます
          </p>
        </div>

        {/* レッスンのテーマ（ユーザー入力） */}
        <div style={{ marginBottom: '15px' }}>
          <label style={{
            display: 'block',
            marginBottom: '5px',
            fontWeight: 'bold',
            fontSize: '14px'
          }}>
            <strong>レッスンのテーマ</strong> <span style={{ color: '#dc3545' }}>*</span>
          </label>
          <textarea
            value={lessonTopic}
            onChange={(e) => setLessonTopic(e.target.value)}
            placeholder="例: 日常会話、発音練習、敬語の使い方"
            rows="3"
            disabled={!isLearnerRegistered}
            style={{
              width: '100%',
              padding: '10px',
              borderRadius: '5px',
              border: '1px solid #ddd',
              fontSize: '14px',
              boxSizing: 'border-box',
              fontFamily: 'sans-serif',
              opacity: isLearnerRegistered ? 1 : 0.6,
              cursor: isLearnerRegistered ? 'text' : 'not-allowed'
            }}
          />
        </div>
      </div>

      {/* ===== 講師一覧 ===== */}
      {teachers.length === 0 ? (
        <div style={{
          padding: '40px',
          textAlign: 'center',
          backgroundColor: '#f8f9fa',
          borderRadius: '8px'
        }}>
          <p style={{ fontSize: '18px', marginBottom: '10px' }}>📭 現在オンラインの講師はいません。</p>
          <p style={{ color: '#666' }}>講師がオンラインになるまでしばらくお待ちください。</p>
        </div>
      ) : (
        <>
          <div style={{
            padding: '15px',
            backgroundColor: '#e7f3ff',
            borderRadius: '8px',
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px'
          }}>
            <span style={{ fontSize: '20px' }}>🟢</span>
            <p style={{ margin: 0 }}>
              現在 <strong>{teachers.length}</strong> 名の講師がオンラインです
            </p>
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
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
            gap: '20px'
          }}>
            {teachers.map((teacher) => {
              const teacherRating = teacherRatings[teacher.socketId];
              const studentRating = studentRatings[teacher.socketId];

              return (
                <div 
                  key={teacher.socketId} 
                  style={{
                    padding: '20px',
                    backgroundColor: '#fff',
                    borderRadius: '8px',
                    border: '1px solid #dee2e6',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '15px'
                  }}
                >
                  {/* ヘッダー */}
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'start'
                  }}>
                    <h3 style={{ margin: 0, fontSize: '18px' }}>👨‍🏫 {teacher.name}</h3>
                    <span style={{
                      backgroundColor: '#28a745',
                      color: 'white',
                      padding: '5px 10px',
                      borderRadius: '20px',
                      fontSize: '12px',
                      fontWeight: 'bold'
                    }}>
                      🟢 オンライン
                    </span>
                  </div>

                  {/* 評価情報を表示 */}
                  <div style={{
                    padding: '10px',
                    backgroundColor: '#f0f8ff',
                    borderRadius: '5px',
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

                  {/* 講師情報 */}
                  <div style={{ fontSize: '14px', color: '#555' }}>
                    <p style={{ margin: '5px 0' }}>
                      <strong>📧 メール:</strong> {teacher.email}
                    </p>
                    <p style={{ margin: '5px 0' }}>
                      <strong>📊 対応レベル:</strong> {teacher.proficiency}
                    </p>
                    <p style={{ margin: '5px 0' }}>
                      <strong>⏰ 対応時間:</strong> {teacher.timeSlots}
                    </p>
                  </div>

                  {/* アクションボタン */}
                  <div style={{ display: 'flex', gap: '10px', marginTop: 'auto' }}>
                    <button
                      onClick={() => handleStartLesson(teacher.socketId)}
                      disabled={!isConnected || !isLearnerRegistered || !studentName || !proficiencyLevel || !lessonTopic}
                      style={{
                        flex: 1,
                        padding: '12px',
                        backgroundColor: (!isConnected || !isLearnerRegistered || !studentName || !proficiencyLevel || !lessonTopic) ? '#ccc' : '#1abc9c',
                        color: 'white',
                        border: 'none',
                        borderRadius: '5px',
                        fontSize: '14px',
                        fontWeight: 'bold',
                        cursor: (!isConnected || !isLearnerRegistered || !studentName || !proficiencyLevel || !lessonTopic) ? 'not-allowed' : 'pointer'
                      }}
                    >
                      🎓 今すぐ開始
                    </button>
                    <button
                      onClick={() => handleViewTeacherProfile(teacher.socketId)}
                      style={{
                        flex: 1,
                        padding: '12px',
                        backgroundColor: '#17a2b8',
                        color: 'white',
                        border: 'none',
                        borderRadius: '5px',
                        fontSize: '14px',
                        fontWeight: 'bold',
                        cursor: 'pointer'
                      }}
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
