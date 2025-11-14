import React, { useState, useEffect } from 'react';

const TeacherDashboard = ({ socket, isConnected, onMatched }) => {
  const [isOnline, setIsOnline] = useState(false);
  const [teacherName, setTeacherName] = useState('');
  const [proficiencyLevel, setProficiencyLevel] = useState('');
  const [timeSlots, setTimeSlots] = useState('');
  const [registeredTeachers, setRegisteredTeachers] = useState([]);
  const [selectedTeacherId, setSelectedTeacherId] = useState('');
  const [lessonRequests, setLessonRequests] = useState([]);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');

  // ページ読み込み時にローカルストレージから講師情報を読み込む
  useEffect(() => {
    const teachersFromStorage = localStorage.getItem('teachers');
    if (teachersFromStorage) {
      const teachers = JSON.parse(teachersFromStorage);
      setRegisteredTeachers(teachers);
      
      if (teachers.length > 0) {
        // 最初の講師を自動選択
        const firstTeacher = teachers[0];
        setSelectedTeacherId(firstTeacher.id);
        setTeacherName(firstTeacher.name);
        setProficiencyLevel(firstTeacher.proficiencyLevel || 'beginner');
        setTimeSlots(firstTeacher.timeSlots || 'morning');
      }
    }
  }, []);

  // Socket.io イベントリスナー
  useEffect(() => {
    if (!socket) return;

    // 講師がオンラインになったことを確認
    socket.on('teacher_online', (data) => {
      console.log('✅ 講師オンライン:', data);
      setMessage(`✅ オンラインになりました (講師ID: ${data.teacherId})`);
      setMessageType('success');
    });

    // マッチした学習者からリクエスト
    socket.on('student_matched', (data) => {
      console.log('📚 学習者がマッチしました:', data);
      setLessonRequests((prev) => [...prev, data]);
      setMessage(`📚 新しいリクエストが来ました: ${data.studentName}`);
      setMessageType('info');

      // App.jsにマッチング情報を通知（講師側）
      if (onMatched) {
        onMatched(data, {
          name: teacherName,
          level: proficiencyLevel,
          timeSlots: timeSlots
        });
      }
    });

    // レッスンリクエストを受け取る
    socket.on('lesson_request', (data) => {
      console.log('📚 レッスンリクエスト:', data);
      setLessonRequests((prev) => [...prev, data]);
      setMessage(`📚 新しいリクエストが来ました: ${data.studentName}`);
      setMessageType('info');
    });

    // エラー
    socket.on('error', (data) => {
      console.error('❌ エラー:', data);
      setMessage(`❌ ${data.message || 'エラーが発生しました'}`);
      setMessageType('error');
    });

    return () => {
      socket.off('teacher_online');
      socket.off('student_matched');
      socket.off('lesson_request');
      socket.off('error');
    };
  }, [socket, teacherName, proficiencyLevel, timeSlots, onMatched]);

  // 講師を選択
  const handleSelectTeacher = (teacher) => {
    setSelectedTeacherId(teacher.id);
    setTeacherName(teacher.name);
    setProficiencyLevel(teacher.proficiencyLevel || 'beginner');
    setTimeSlots(teacher.timeSlots || 'morning');
  };

  // オンライン/オフライン切り替え
    const handleToggleOnline = () => {
    console.log('🔴 ボタンクリック: isOnline=', isOnline, 'isConnected=', isConnected);  // ← これを追加
    if (!isConnected) {

      setMessage('❌ サーバーに接続されていません');
      setMessageType('error');
      return;
    }

    if (!teacherName) {
      setMessage('❌ 講師情報が見つかりません。講師を選択してください。');
      setMessageType('error');
      return;
    }

    if (!isOnline) {
      // オンラインに設定
      const teacherData = {
        name: teacherName,
        email: registeredTeachers.find(t => t.id === selectedTeacherId)?.email || '',
        proficiencyLevel: proficiencyLevel,
        timeSlots: timeSlots
      };

      socket.emit('teacher_online', teacherData);
      setIsOnline(true);
      setMessage(`✅ オンラインに設定しました (${teacherName})`);
      setMessageType('success');
    } else {
      // オフラインに設定
      socket.emit('teacher_offline', {});
      setIsOnline(false);
      setLessonRequests([]);
      setMessage('✅ オフラインに設定しました');
      setMessageType('info');
    }
  };

  // レッスンリクエストを承認
  const handleAcceptRequest = (request) => {
    if (!socket) return;

    socket.emit('accept_request', {
      lessonId: request.lessonId,
      studentId: request.studentId
    });

    console.log('✅ リクエストを承認しました:', request);
    setMessage('✅ レッスンを開始します');
    setMessageType('success');
  };

  // レッスンリクエストを拒否
  const handleRejectRequest = (studentId) => {
    if (!socket) return;

    socket.emit('reject_request', { studentId });
    setLessonRequests((prev) =>
      prev.filter((req) => req.studentId !== studentId)
    );
    setMessage('❌ リクエストを拒否しました');
    setMessageType('info');
  };

  return (
    <div className="teacher-dashboard">
      <h2>👨‍🏫 講師ダッシュボード</h2>

      {/* メッセージ表示 */}
      {message && (
        <div className={`message message-${messageType}`}>
          {message}
        </div>
      )}

      {/* 講師選択 */}
      {registeredTeachers.length > 0 && (
        <div className="teacher-selection-section">
          <h3>👨‍🏫 使用する講師を選択</h3>
          <div className="teacher-select-grid">
            {registeredTeachers.map((teacher) => (
              <div
                key={teacher.id}
                className={`teacher-option ${
                  selectedTeacherId === teacher.id ? 'selected' : ''
                }`}
                onClick={() => handleSelectTeacher(teacher)}
              >
                <div className="teacher-option-name">{teacher.name}</div>
                <div className="teacher-option-level">
                  {teacher.proficiencyLevel || '未設定'}
                </div>
                {selectedTeacherId === teacher.id && (
                  <div className="selection-checkmark">✅</div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ステータス */}
      <div className="status-section">
        <h3>ステータス</h3>

        {!isOnline ? (
          <div className="offline-section">
            <p>現在オフラインです</p>
            {registeredTeachers.length === 0 ? (
              <div className="no-teachers-message">
                <p>⚠️ 講師情報が登録されていません</p>
                <p>先に「講師登録」ページから講師情報を登録してください</p>
              </div>
            ) : (
              <div>
                <div className="current-teacher-info">
                  <p>
                    <strong>選択中の講師:</strong> {teacherName}
                  </p>
                  <p>
                    <strong>レベル:</strong> {proficiencyLevel}
                  </p>
                  <p>
                    <strong>時間帯:</strong> {timeSlots}
                  </p>
                </div>
                <button
                  className="btn btn-primary"
                  onClick={handleToggleOnline}
                  disabled={!isConnected || !teacherName}
                >
                  🟢 オンラインに設定
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="online-section">
            <div className="online-badge">🟢 オンライン</div>
            <p>講師名: {teacherName}</p>
            <p>レベル: {proficiencyLevel}</p>
            <p>時間帯: {timeSlots}</p>
            <button
              className="btn btn-danger"
              onClick={handleToggleOnline}
            >
              🔴 オフラインに設定
            </button>
          </div>
        )}
      </div>

      {/* レッスンリクエスト */}
      {isOnline && (
        <div className="requests-section">
          <h3>📚 レッスンリクエスト</h3>

          {lessonRequests.length === 0 ? (
            <p className="empty-message">リクエストはありません</p>
          ) : (
            <div className="request-list">
              {lessonRequests.map((request, index) => (
                <div key={index} className="request-card">
                  <div className="request-header">
                    <h4>👤 {request.studentName}</h4>
                  </div>

                  <div className="request-info">
                    <p>
                      <strong>📊 レベル:</strong> {request.studentLevel || request.proficiencyLevel}
                    </p>
                    <p>
                      <strong>📖 テーマ:</strong> {request.lessonTopic}
                    </p>
                    <p>
                      <strong>⏰ リクエスト時刻:</strong>{' '}
                      {new Date().toLocaleTimeString('ja-JP')}
                    </p>
                  </div>

                  <div className="request-actions">
                    <button
                      className="btn btn-success"
                      onClick={() => handleAcceptRequest(request)}
                    >
                      ✅ 承認
                    </button>
                    <button
                      className="btn btn-reject"
                      onClick={() => handleRejectRequest(request.studentId)}
                    >
                      ❌ 拒否
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default TeacherDashboard;
