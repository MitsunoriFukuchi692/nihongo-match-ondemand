import React, { useState, useEffect } from 'react';

const StudentDashboard = ({ socket, isConnected, teachers, onMatched }) => {
  const [studentName, setStudentName] = useState('');
  const [proficiencyLevel, setProficiencyLevel] = useState('');
  const [lessonTopic, setLessonTopic] = useState('');
  const [selectedTeacherId, setSelectedTeacherId] = useState('');
  const [isMatching, setIsMatching] = useState(false);
  const [matchedTeacher, setMatchedTeacher] = useState(null);
  const [queuePosition, setQueuePosition] = useState(null);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');

  // デバッグ用：teachers の内容をログ出力
  useEffect(() => {
    if (teachers && teachers.length > 0) {
      console.log('👨‍🏫 学習者ダッシュボード: 利用可能な講師一覧');
      teachers.forEach((teacher, index) => {
        console.log(`   [${index}] 名前: ${teacher.name}`);
        console.log(`       socketId: ${teacher.socketId}`);
        console.log(`       id: ${teacher.id}`);
        console.log(`       proficiencyLevel: ${teacher.proficiencyLevel}`);
      });
    }
  }, [teachers]);

  // Socket.io イベントリスナー
  useEffect(() => {
    if (!socket) return;

    // マッチング成功
    socket.on('lesson_matched', (data) => {
      console.log('✅ マッチング成功:', data);
      setMatchedTeacher(data);
      setIsMatching(false);
      setMessage(`✅ ${data.teacherName}講師とマッチしました！`);
      setMessageType('success');

      // App.jsにマッチング情報を通知
      if (onMatched) {
        onMatched(data, {
          name: studentName,
          level: proficiencyLevel,
          topic: lessonTopic
        });
      }
    });

    // 待機キューに追加
    socket.on('queued', (data) => {
      console.log('⏳ 待機キューに追加:', data);
      setQueuePosition(data.queuePosition);
      setMessage(
        `⏳ 待機中です...\n待機番号: ${data.queuePosition}\n予想待ち時間: ${data.estimatedWaitTime}分`
      );
      setMessageType('info');
    });

    // エラー
    socket.on('error', (data) => {
      console.error('❌ エラー:', data);
      setMessage(`❌ ${data.message}`);
      setMessageType('error');
      setIsMatching(false);
    });

    return () => {
      socket.off('lesson_matched');
      socket.off('queued');
      socket.off('error');
    };
  }, [socket, studentName, proficiencyLevel, lessonTopic, onMatched]);

  // レッスン開始
  const handleStartLesson = () => {
    if (!isConnected) {
      setMessage('❌ サーバーに接続されていません');
      setMessageType('error');
      return;
    }

    if (!studentName.trim()) {
      setMessage('❌ あなたの名前を入力してください');
      setMessageType('error');
      return;
    }

    if (!proficiencyLevel) {
      setMessage('❌ 日本語レベルを選択してください');
      setMessageType('error');
      return;
    }

    if (!lessonTopic.trim()) {
      setMessage('❌ レッスンのテーマを入力してください');
      setMessageType('error');
      return;
    }

    if (!selectedTeacherId) {
      setMessage('❌ 講師を選択してください');
      setMessageType('error');
      return;
    }

    // マッチング開始
    setIsMatching(true);
    setMessage('⏳ 講師を探しています...');
    setMessageType('info');

    const studentData = {
      name: studentName,
      proficiencyLevel: proficiencyLevel,
      lessonTopic: lessonTopic,
      selectedTeacherId: selectedTeacherId
    };

    console.log('🎓 レッスンをリクエストしました:', studentData);
    socket.emit('request_lesson', studentData);
  };

  // マッチングをキャンセル
  const handleCancelMatching = () => {
    setIsMatching(false);
    setQueuePosition(null);
    setMessage('❌ マッチングをキャンセルしました');
    setMessageType('info');
    socket.emit('cancel_request', {});
  };

  // レッスンルームに進む
  const handleGoToLessonRoom = () => {
    console.log('🎓 レッスンルームに進みます');
    if (onMatched) {
      onMatched(matchedTeacher, {
        name: studentName,
        level: proficiencyLevel,
        topic: lessonTopic
      });
    }
  };

  // 講師を選択
  const handleSelectTeacher = (teacher) => {
    // socketId を優先的に使用、なければ id を使用
    const teacherId = teacher.socketId || teacher.id;
    setSelectedTeacherId(teacherId);
    
    console.log('👨‍🏫 講師を選択しました:');
    console.log(`   名前: ${teacher.name}`);
    console.log(`   選択されたID: ${teacherId}`);
    console.log(`   socketId: ${teacher.socketId}`);
    console.log(`   id: ${teacher.id}`);
  };

  return (
    <div className="student-dashboard">
      <h2>📚 学習者ダッシュボード</h2>

      {/* メッセージ表示 */}
      {message && (
        <div className={`message message-${messageType}`}>
          {message}
        </div>
      )}

      {/* マッチング中の画面 */}
      {isMatching ? (
        <div className="matching-section">
          <h3>⏳ マッチング中</h3>
          <div className="matching-spinner">
            <div className="spinner"></div>
            <p>講師を探しています...</p>
            {queuePosition && (
              <p className="queue-info">待機番号: {queuePosition}</p>
            )}
          </div>
          <button
            className="btn btn-danger"
            onClick={handleCancelMatching}
          >
            ❌ キャンセル
          </button>
        </div>
      ) : matchedTeacher ? (
        /* マッチング成功後の画面 */
        <div className="matched-section">
          <h3>✅ マッチング成功</h3>
          <div className="teacher-card">
            <div className="teacher-header">
              <h4>👨‍🏫 {matchedTeacher.teacherName}</h4>
              <span className="online-badge">🟢 接続中</span>
            </div>
            <div className="teacher-info">
              <p>
                <strong>📊 レベル:</strong> {matchedTeacher.studentLevel || '未設定'}
              </p>
              <p>
                <strong>⏰ テーマ:</strong> {matchedTeacher.lessonTopic || '未設定'}
              </p>
            </div>
            <button 
              className="btn btn-primary"
              onClick={handleGoToLessonRoom}
            >
              🎓 レッスンルームに進む
            </button>
          </div>
        </div>
      ) : (
        /* デフォルト画面 */
        <div className="request-section">
          <h3>📋 レッスンをリクエスト</h3>

          {/* オンライン講師一覧 */}
          <div className="teachers-list-section">
            <h4>👨‍🏫 オンライン講師を選択</h4>
            {teachers && teachers.length > 0 ? (
              <div className="teachers-grid">
                {teachers.map((teacher) => {
                  const teacherId = teacher.socketId || teacher.id;
                  return (
                    <div
                      key={teacherId}
                      className={`teacher-selection-card ${
                        selectedTeacherId === teacherId ? 'selected' : ''
                      }`}
                      onClick={() => handleSelectTeacher(teacher)}
                    >
                      <div className="teacher-name">👨‍🏫 {teacher.name}</div>
                      <div className="teacher-details">
                        <p>
                          <strong>レベル:</strong> {teacher.proficiencyLevel || '未設定'}
                        </p>
                        <p>
                          <strong>時間:</strong> {teacher.timeSlots || '未設定'}
                        </p>
                      </div>
                      <div className="selection-indicator">
                        {selectedTeacherId === teacherId && (
                          <span className="checkmark">✅</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="no-teachers">
                現在、オンラインの講師がいません。後で試してください。
              </p>
            )}
          </div>

          <div className="form-group">
            <label>あなたの名前 *</label>
            <input
              type="text"
              value={studentName}
              onChange={(e) => setStudentName(e.target.value)}
              placeholder="例: 太郎"
              disabled={isMatching}
            />
          </div>

          <div className="form-group">
            <label>日本語レベル *</label>
            <select
              value={proficiencyLevel}
              onChange={(e) => setProficiencyLevel(e.target.value)}
              disabled={isMatching}
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
              disabled={isMatching}
            />
          </div>

          <button
            className="btn btn-success"
            onClick={handleStartLesson}
            disabled={
              isMatching ||
              !isConnected ||
              !studentName ||
              !proficiencyLevel ||
              !lessonTopic ||
              !selectedTeacherId
            }
          >
            🎓 今すぐ開始
          </button>
        </div>
      )}
    </div>
  );
};

export default StudentDashboard;
